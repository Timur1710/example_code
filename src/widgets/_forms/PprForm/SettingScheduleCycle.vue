<template>
  <q-form ref="formRef" class="setting-schedule-cycle">
    <q-select dense outlined v-model="schedule_setting.cycle" :options="SCHEDULE_CYCLE" emit-value map-options :option-label="(option) => t(`repeat.${option.label}`)" option-value="value" />
    <div class="setting-schedule-cycle__row">
      <q-radio v-model="condition" val="first"/>
      <span>{{every}}</span>
      <template v-if="schedule_setting.cycle === 'month'">{{ props.formData ? new Date(props.formData.startDate).getDate() : '' }}</template>
      <span v-if="unit_time === t('repeat.month')"> число </span>
      <q-select 
        :disable="condition !== 'first'"
        dense 
        outlined 
        v-model="schedule_setting.repeat.number" 
        :options="number_options"
        class="setting-schedule-cycle__select"
        :dropdown-icon="''"
      />
      <span>{{unit_time}}</span>
    </div>
    <div class="setting-schedule-cycle__row">
    <q-radio v-if="unit_time === t('repeat.day')" v-model="condition" val="second" label="Каждый рабочий день" />
    <div v-if="unit_time === t('repeat.week')" class="schedule-template-form__days">
      <q-option-group
        v-model="schedule_setting.repeat.week_days"
        :options="daysOfWeekOptions"
        type="checkbox"
        inline
      />
    </div>
    </div>
    <div v-if="unit_time === t('repeat.month')" class="setting-schedule-cycle__row">
      <q-radio v-model="condition" val="second"/>
      {{ getWeekNumberInMonth(new Date(props.formData ? props.formData.startDate : '')) }}
      {{ new Date(props.formData ? props.formData.startDate : '').toLocaleString('ru-RU', { weekday: 'short' }).toUpperCase() }}
      <span>{{t('every')}}</span>
      <q-select 
        :disable="condition!='second'"
        dense 
        outlined 
        v-model="schedule_setting.repeat.number" 
        :options="number_options"
        class="setting-schedule-cycle__select"
        :dropdown-icon="''"
      />
      <span>{{unit_time}}</span>
    </div>
 


    <p class="q-mb-none">Сколько повторять:</p>
    <div class="setting-schedule-cycle__row">
      <q-radio v-model="limit_type" val="always" label="Всегда" />
    </div>
    <div class="setting-schedule-cycle__row">
      <q-radio v-model="limit_type" val="to" label="До" /> 
      <q-input 
        :disable="limit_type !== 'to'"
        dense 
        outlined 
        type="date"
        v-model="schedule_setting.to" 
        class="setting-schedule-cycle__limit-date"
      />
    </div>
    
  </q-form>
</template>

<script setup lang="ts">
import { ref,computed,watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useScheduleStore } from 'src/entities/schedule';
import { QForm } from 'quasar';
import { formatDateToUTC } from 'src/shared/utils';
import { SCHEDULE_CYCLE,DAYS_OF_WEEK_OPTIONS,DAYS_OF_MONTH_OPTIONS,MONTHS_OF_YEAR_OPTIONS } from "src/shared/constants/schedule/schedule";
import type { ScheduleFormData } from 'src/shared/templates';
import type {
  EquipmentSchedule,
  CreateEquipmentScheduleRequest,
  UpdateEquipmentScheduleRequest,
} from 'src/entities/schedule';
defineOptions({
  name: 'SettingScheduleCycle',
});

interface Props {
  formData: ScheduleFormData | null;
  equipmentId: string;
  /** Расписание для редактирования */
  scheduleItem?: EquipmentSchedule | null;
}

const props = withDefaults(defineProps<Props>(), {
  formData: null,
  scheduleItem: null,
});

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}
const emit = defineEmits<Emits>();
const $q = useQuasar();
const { t } = useI18n();
const scheduleStore = useScheduleStore();
const formRef = ref<QForm>();
const daysOfMonthOptions = DAYS_OF_MONTH_OPTIONS;
const monthsOfYearOptions = MONTHS_OF_YEAR_OPTIONS;
const daysOfWeekOptions = DAYS_OF_WEEK_OPTIONS;

type CycleType = 'day' | 'week' | 'month';
const week_day = new Date(props.formData ? props.formData.startDate : '').getDay();
const limit_type = ref('to');
const condition = ref('first');
const schedule_setting = ref<{
  cycle: CycleType;
  from: string | null;
  to: string | null;
  repeat: {number: number; week_days: number[]};
}>({
    cycle: SCHEDULE_CYCLE[0].value,
    from: props.formData ? props.formData.startDate : null,
    to: props.formData ? props.formData.endDate : null,
    repeat: {
      number: 1,
      week_days: [],
    }
});

const unit_time = computed(() => {
  const translations: Record<CycleType, string> = {
    day: t('repeat.day'),
    week: t('repeat.week'),
    month: t('repeat.month'),
  };
  return translations[schedule_setting.value.cycle] ?? '';
});

const every = computed(() => {
  const keys = {
    day: 'repeat.every',
    week: 'repeat.every_week',
    month: 'repeat.every_month',
  } as const;
  return t(keys[schedule_setting.value.cycle] ?? 'repeat.every');
});

const number_options = computed(() => ({
  day: daysOfMonthOptions,
  week: monthsOfYearOptions,
  month: monthsOfYearOptions,
})[schedule_setting.value.cycle] ?? []);

function getWeekNumberInMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

// Вспомогательные функции
function getWeekDaysForCycle(cycle: CycleType, weekDay: number): number[] {
  return cycle === 'week' ? [weekDay] : [];
}

function getWeekDaysForCondition(condition: string, cycle: CycleType, weekDay: number): number[] {
  if (condition === 'first') return cycle === 'week' ? [weekDay] : [];
  if (condition === 'second') return cycle === 'month' ? [weekDay] : [];
  return [];
}

// Объединенные watchers
watch(
  () => schedule_setting.value.cycle,
  () => {
    condition.value = 'first';
    schedule_setting.value.repeat = {
      number: 1,
      week_days: getWeekDaysForCycle(schedule_setting.value.cycle, week_day),
    };
  }
);

watch(
  () => limit_type.value,
  (newVal) => {
    schedule_setting.value.to = newVal === 'to' ? props.formData?.endDate ?? null : null;
  }
);

watch(
  () => condition.value,
  (newVal) => {
    schedule_setting.value.repeat.number = 1;
    schedule_setting.value.repeat.week_days = getWeekDaysForCondition(
      newVal,
      schedule_setting.value.cycle,
      week_day
    );
  }
);

/** Преобразование полей формы в CreateEquipmentScheduleRequest или UpdateEquipmentScheduleRequest */
function formToScheduleRequest(): CreateEquipmentScheduleRequest | UpdateEquipmentScheduleRequest {
  const dateStart = formatDateToUTC(props.formData?.startDate as string, props.formData?.startTime);
  const dateEnd = formatDateToUTC(props.formData?.endDate as string, props.formData?.endTime);

  const baseData = {
    entityType: 'equipment' as const,
    equipmentId: props.equipmentId,
    name: props.formData?.name?.trim(),
    dateStart,
    dateEnd,
    type: 'instance' as const, // ППР обычно instance, не template
  };

  // if (props.scheduleItem?._id) {
  //   return {
  //     _id: props.scheduleItem._id,
  //     ...baseData,
  //   } as UpdateEquipmentScheduleRequest;
  // }

  return baseData as CreateEquipmentScheduleRequest;
}

async function submit() {
  console.log('Submitting schedule setting:', schedule_setting.value);
  try {
    const scheduleRequest = formToScheduleRequest();

    if (props.scheduleItem?._id) {
      // Обновление существующего расписания
      await scheduleStore.updateSchedule(scheduleRequest as UpdateEquipmentScheduleRequest);
    } else {
      // Создание нового расписания
      await scheduleStore.createSchedule(scheduleRequest as CreateEquipmentScheduleRequest);
    }
    $q.notify({
      type: 'positive',
      message: t('success'),
      position: 'top',
      timeout: 3000,
    });
    emit('saved');
  } catch (error: unknown) {
    console.error('Failed to save PPR:', error);
  } finally {
   console.log('Schedule setting submission completed');
  }
}

defineExpose({
  submit
});
</script>

<style scoped lang="scss">
.setting-schedule-cycle {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.q-field__bottom) {
  padding: 2px 0;
  min-height: 11px;
}

.setting-schedule-cycle__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-schedule-cycle__select {
  
  width: 38px;
  min-width: 38px;
  max-width: 38px;
  height: 38px;
  &:deep(.q-field__append) {
    display: none;
  }
  &:deep(.q-field__control) {
    height: 38px;
    min-height: 38px;
    padding: 0 6px;
  }  
  &:deep(.q-field__native) {
    height: 38px;
    min-height: 38px;
  }
}
.setting-schedule-cycle__limit-date {
  width: 125px;
  &:deep(.q-field__control) {
    height: 38px;
    min-height: 38px;
    padding: 0 6px;
  }
}

.setting-schedule-cycle__row {
  margin-top: -10px;
}
</style>