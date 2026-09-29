<template>
  <ScheduleBreaksSetting 
    v-if="breaks_setting_active" 
    :row="table_row" 
    :breaks_setting_active="breaks_setting_active" 
    @saved_breaks="handleSavedBreaks" 
    @update_breaks_setting_active="emit('update_breaks_setting_active', $event)"
  />   
  <q-form v-else ref="formRef" class="schedule-template-form" @submit.prevent>
    <q-input
      v-model="formData.name"
      outlined
      label="Наименование"
      dense
      class="q-pb-none"
      :rules="[(val: string) => !!val || 'Обязательное поле', (val: string) => val.length >= 2 || 'Минимум 2 символа']"
    />

    <div class="schedule-template-form__params">
      <span>Параметры:</span>
      <q-radio v-model="formData.schedulePattern" val="weekly" label="По неделям" />
      <q-radio v-model="formData.schedulePattern" val="daily" label="По циклам" />
    </div>
    <div v-if="formData.schedulePattern === 'daily'" class="schedule-template-form__params">
      <span>Длина цикла:</span>
      <q-input dense outlined type="number" max="30" min="0" class="schedule-input q-pb-none cycle_length"  v-model="cycle_length" @update:model-value="(val) => cycle_length = Math.min(30, Math.max(0, Number(val)))" ></q-input>
      <span> дней, начиная с</span>
      <q-input dense outlined type="date" class="schedule-input q-pb-none cycle_start_date"  v-model="cycle_start_date" ></q-input>
    </div>
    <div class="schedule-template-form__table">
      <q-table
        v-if="formData.schedulePattern === 'weekly' || (formData.schedulePattern === 'daily' && cycle_length > 0 && cycle_start_date)"
        flat bordered
        dense hide-bottom
        :rows="scheduleRows"
        :rows-per-page-options="[0]"
        :columns="DAYS_OF_WEEK_COLUMNS"
        wrap-cells
        row-key="name"
        :class="'week_days_table ' + (formData.schedulePattern === 'weekly' ? 'week_table' : 'cycle_table')"
      >
        <template #body-cell-week_day="props">
          <q-td :props="props">
            <template class="schedule-template-form__params" >
              <q-checkbox v-model="week_days" :val="props.row.value" />
              {{ props.row.label}}
            </template>
          </q-td>
        </template>
        <template #body-cell-start_time="props">
          <q-td :props="props">
            <q-input class="schedule-input q-pb-none" dense borderless v-model="props.row.start_time" mask="time" @update:model-value="(val) => (props.row.start_time = clampTimeTo24(String(val ?? '')))" :rules="[val => isValidTime(val) || 'Время от 00:00 до 24:00', val => compareTimes(val, props.row.end_time) || 'Начало должно быть меньше конца']"></q-input>
          </q-td>
        </template>
        <template #body-cell-end_time="props">
          <q-td :props="props">
            <q-input class="schedule-input q-pb-none" dense borderless v-model="props.row.end_time" mask="time" @update:model-value="(val) => (props.row.end_time = clampTimeTo24(String(val ?? '')))" :rules="[val => isValidTime(val) || 'Время от 00:00 до 24:00', val => compareTimes(props.row.start_time, val) || 'Конец должно быть больше начала']"></q-input>
          </q-td>
        </template>
        <template #body-cell-break_time="props">
          <q-td :props="props">
            {{ get_break_time(props.row.breaks) }} ч.
          </q-td>
        </template>
        <template #body-cell-breaks_setting="props">
          <q-td :props="props">
            <q-btn :disable="week_days.includes(props.row.value) === false" outline dense :class="'btn_setting q-mx-auto ' + (week_days.includes(props.row.value) === false ? '' : 'bg-primary text-white')" color="primary" label="Настроить" @click="() => {table_row = { ...props.row ,index:props.rowIndex}; emit('update_breaks_setting_active', true); }" />
          </q-td>
        </template>
      </q-table>
    </div>
    <div class="schedule-form-template__holidays-fields">
      <q-toggle
        label="Учитывать праздники"
        v-model="formData.takeHolidaysInSchedule"
      />
    </div>
    <div class="schedule-form-template__comment-fields">
      <q-input
        class="comment_input"
        outlined
        dense
        v-model="formData.comment"
        :label="t('comment')"
        maxlength="100"
        counter
        :rules="[(val: string) => !val || val.length <= 100 || t('validate.max_length', { max: 100 })]"
      />
    </div>
  </q-form>

</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, QForm } from 'quasar';
import { useScheduleStore } from 'src/entities/schedule';
import { ScheduleBreaksSetting } from './';
import { scheduleTableRows,get_break_time,compareTimes,DAYS_OF_WEEK_COLUMNS } from 'src/shared/lib/useScheduleOptions';
import { isValidTime, clampTimeTo24 } from 'src/shared/lib/useTimeInput';
import type {
  ScheduleListItem,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleDayEntry,
} from 'src/entities/schedule';

interface Props {
  scheduleItem?: ScheduleListItem | null;
  active?: boolean;
  breaks_setting_active?: boolean;
}

interface Emits {
  (e: 'saved'): void;
  (e: 'update_breaks_setting_active', active: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleItem: null,
  active: true,
  breaks_setting_active: false,
});

const emit = defineEmits<Emits>();

const $q = useQuasar();
const { t } = useI18n();
const scheduleStore = useScheduleStore();
const formRef = ref<QForm>();
const isSubmitting = ref(false);
const showDaysError = ref(false);
const week_days = ref<(number | string)[]>([]);
const table_row = ref<{
  label: string;
  value: number;
  index: number | undefined;
  start_time: string;
  end_time: string;
  breaks: Array<{ break_start: string; break_end: string }>;
} | null>(null);
// type TimeWithUtc = { time: string; utc: string };
const cycle_length = ref(0);
const cycle_start_date = ref('');
const isRestoring = ref(false);
const formData = reactive({
  name: '',
  entityType: 'worker' as 'worker' | 'equipment',
  schedulePattern: 'weekly' as 'weekly' | 'daily',
  takeHolidaysInSchedule: false,
  comment: '',
  scheduleRows: [] as Array<{
    label: string;
    value: number;
    start_time: string;
    end_time: string;
    breaks: Array<{ break_start: string; break_end: string }>;
  }>,
});
const scheduleRows = ref(scheduleTableRows(formData.schedulePattern, cycle_length.value, cycle_start_date.value));
const handleSavedBreaks = (index: number | undefined, breaks: Array<{ break_start: string; break_end: string }>) => {
  if (index !== undefined && scheduleRows.value[index]) {
    const row = scheduleRows.value[index];
    if ('breaks' in row) {
      row.breaks = breaks;
    }
  }
  else{
    scheduleRows.value.forEach((row) => {
      if ('breaks' in row) {
        row.breaks = breaks;
      }
    });
  }
  emit('update_breaks_setting_active', false);
};


const isEditMode = computed(() => !!props.scheduleItem?._id);

function parseScheduleToForm(schedule: ScheduleListItem) {
  isRestoring.value = true;
  formData.name = schedule.name || '';
  formData.schedulePattern = (schedule.schedulePattern as 'daily' | 'weekly') || 'weekly';
  formData.takeHolidaysInSchedule = schedule.takeHolidaysInSchedule ?? false;
  formData.comment = schedule.comment || '';

  // Восстановление scheduleEntries → scheduleRows
  if (schedule.scheduleEntries && schedule.scheduleEntries.length > 0) {
    if (schedule.schedulePattern === 'daily' && schedule.cycleSettings) {
      cycle_length.value = schedule.cycleSettings.cycleLength;
      const startDate = new Date(schedule.cycleSettings.cycleStartDate);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      cycle_start_date.value = `${year}-${month}-${day}`;

      // Генерируем полные строки таблицы, заполняя из entries
      const rows = scheduleTableRows('daily', cycle_length.value, cycle_start_date.value);
      const entryMap = new Map(schedule.scheduleEntries.map(e => [e.dayIndex, e]));
      const selectedDays: (number | string)[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const entry = entryMap.get(i);
        if (entry) {
          row.start_time = entry.timeStart || '09:00';
          row.end_time = entry.timeEnd || '18:00';
          row.breaks = (entry.breaks ?? []).map(b => ({
            break_start: b.start || '',
            break_end: b.end || '',
          }));
          selectedDays.push(row.value);
        }
      }
      scheduleRows.value = rows;
      week_days.value = selectedDays;
    } else {
      // weekly
      const rows = scheduleTableRows('weekly');
      const entryMap = new Map(schedule.scheduleEntries.map(e => [e.dayIndex, e]));
      const selectedDays: (number | string)[] = [];

      for (const row of rows) {
        const entry = entryMap.get(typeof row.value === 'number' ? row.value : Number(row.value));
        if (entry) {
          row.start_time = entry.timeStart || '09:00';
          row.end_time = entry.timeEnd || '18:00';
          row.breaks = (entry.breaks ?? []).map(b => ({
            break_start: b.start || '',
            break_end: b.end || '',
          }));
          selectedDays.push(row.value);
        }
      }
      scheduleRows.value = rows;
      week_days.value = selectedDays;
    }
  }
  void nextTick(() => {
    isRestoring.value = false;
  });
}

function reset() {
  if (props.scheduleItem) {
    parseScheduleToForm(props.scheduleItem);
  } else {
    formData.name = '';
    formData.schedulePattern = 'weekly';
    formData.takeHolidaysInSchedule = false;
    formData.comment = '';
    formData.scheduleRows = [];
  }
  showDaysError.value = false;
}
watch(() => formData.schedulePattern, (newPattern) => {
  if (isRestoring.value) return;
  week_days.value = [];
  if (newPattern === 'daily') {
    cycle_length.value = 0;
    cycle_start_date.value = '';
    scheduleRows.value = [];
  } else {
    scheduleRows.value = scheduleTableRows('weekly');
  }
});
watch(()=> cycle_start_date.value, (val) => {
  if (isRestoring.value) return;
  if (val && cycle_length.value > 0) {
    scheduleRows.value = scheduleTableRows('daily', cycle_length.value, val);
  }
});
watch(()=> cycle_length.value, (val) => {
  if (isRestoring.value) return;
  if (val > 0 && cycle_start_date.value) {
    scheduleRows.value = scheduleTableRows('daily', val, cycle_start_date.value);
  }
});
watch(cycle_length, (val) => {
  if (val > 30) cycle_length.value = 30;
  else if (val < 0) cycle_length.value = 0;
});
watch(() => props.scheduleItem, (val) => {
  if (val) {
    parseScheduleToForm(val);
  } else {
    reset();
  }
}, { immediate: true });

watch(() => props.active, (isActive) => {
  if (isActive) reset();
});


async function submit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    const selectedRows = scheduleRows.value.filter((row) => week_days.value.includes(row.value));

    const scheduleEntries: ScheduleDayEntry[] = selectedRows.map((row) => {
      // Для daily: dayIndex — позиция строки в цикле (0..cycleLength-1)
      // Для weekly: dayIndex — день недели (0–6)
      const dayIndex = formData.schedulePattern === 'daily'
        ? scheduleRows.value.indexOf(row)
        : (typeof row.value === 'number' ? row.value : Number(row.value));

      return {
        dayIndex,
        label: row.label,
        timeStart: row.start_time,
        timeEnd: row.end_time,
        breaks: (row.breaks ?? []).map((b) => ({
          start: b.break_start,
          end: b.break_end,
        })),
      };
    });

    // Смещение часового пояса клиента в минутах от UTC (положительное для восточных)
    const timezoneOffset = -(new Date().getTimezoneOffset());

    const baseData = {
      name: formData.name.trim(),
      entityType: formData.entityType,
      type: 'template' as const,
      schedulePattern: formData.schedulePattern,
      takeHolidaysInSchedule: formData.takeHolidaysInSchedule,
      comment: formData.comment.trim(),
      timezoneOffset,
      scheduleEntries,
      ...(formData.schedulePattern === 'daily' && cycle_length.value > 0 && cycle_start_date.value
        ? {
            cycleSettings: {
              cycleLength: Number(cycle_length.value),
              cycleStartDate: cycle_start_date.value,
            },
          }
        : {}),
    };
    if (isEditMode.value && props.scheduleItem?._id) {
      await scheduleStore.updateSchedule({
        _id: props.scheduleItem._id,
        ...baseData,
      } as UpdateScheduleRequest);
    } else {
      await scheduleStore.createSchedule(baseData as CreateScheduleRequest);
    }

    $q.notify({
      type: 'positive',
      message: isEditMode.value ? 'Шаблон обновлён' : 'Шаблон создан',
      position: 'top',
      timeout: 3000,
    });

    emit('saved');
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    $q.notify({
      type: 'negative',
      message: axiosError.response?.data?.message || 'Ошибка сохранения шаблона',
      position: 'top',
      timeout: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

defineExpose({ submit, reset, isSubmitting,week_days});
</script>

<style scoped lang="scss">
@media (max-height: 900px){
:deep(.week_table > .scroll),
:deep(.cycle_table > .scroll) {
  height: 200px;
}
}
.cycle_length {
  max-width: 60px;
}
.schedule-input {
  & :deep(input.q-field__native){
    text-align: center!important;
  }
}
.btn_setting {
  display: flex;
  height: 26px;
  padding: 4px 16px;
  justify-content: center;
  align-items: center;
  & :deep(.block) {
    color: #111010;
    text-align: center;
    /* Buttons table */
    font-family: Roboto;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px; /* 142.857% */
    text-transform: capitalize;
  }
}
.text-white {
  & :deep(.block) {
    color: #fff;
  }
} 
:deep(.q-field:not(.comment_input) .q-field__bottom) {
  display: none;
}

:deep(.comment_input .q-field__bottom) {
  padding: 2px 0;
}
:deep(.week_table > .scroll),
:deep(.cycle_table > .scroll) {
  height: auto;
  min-height: 5vh;
  max-height: 42.5vh;
  padding-top: 8px;
  padding-bottom: 8px;
  overflow: auto;
}
@media (max-height: 900px) {
  :deep(.week_table > .scroll),
  :deep(.cycle_table > .scroll) {
    height: 35%;
    max-height: 35vh;
  }
}
@media (max-height: 700px) {
  :deep(.week_table > .scroll),
  :deep(.cycle_table > .scroll) {
    height: 25vh;
    max-height: 25vh;
  }
}
.week_days_table {
  background-color: var(--gray);
  & :deep(th){
    white-space: normal; /* Allows text to wrap */
    word-wrap: break-word; /* Older browsers */
    overflow-wrap: break-word; /* Modern browsers */
    color: var(--black, #000);
    text-align: center;
    /* Typing text medium */
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px; /* 137.5% */
  }
}

:deep(.q-field__bottom) {
  padding: 2px 0;
}
.schedule-template-form__params {
  display: flex;
  align-items: center;
  gap: 4px;
}

.schedule-template-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
