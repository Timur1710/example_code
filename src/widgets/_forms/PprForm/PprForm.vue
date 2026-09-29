<template>
  <ScheduleFormTemplate
    ref="templateRef"
    :model-value="formData"
    :hide-base-fields="schedule_cycle"
    :schedule-item="scheduleItem"
    :active="active"
    :show-name-field="!schedule_cycle"
    :name-rules="[
      (val: string) => !!val || t('validate.required'),
      (val: string) => val.length >= 2 || t('validate.min_length', { min: 2 }),
      (val: string) => val.length <= 100 || t('validate.max_length', { max: 100 }),
    ]"
    @update:model-value="handleFormDataUpdate"
    @reset="handleTemplateReset"
  >
    <template #fields-after-period>
      <div v-show="!schedule_cycle">
        <div class="schedule-form-template__frequency-fields">
          <div class="schedule-form-template__frequency-title">{{ t('ppr_form.frequency') }}:</div>
          <div class="schedule-form-template__frequency-switch">
            <q-toggle
              :disable="isDisabled"
              :label="t('ppr_form.regularly')"
              v-model="setting_reg"
            />
          </div>
          <div class="schedule-form-template__frequency-button">
            <q-btn
              unelevated
              dense
              :label="t('ppr_form.tune')"
              :class="
                'full-width q-px-md q-py-xs' +
                (!setting_reg ? ' bg-gray' : ' bg-secondary text-white')
              "
              @click="emit('setting_schedule_cycle', formData)"
              :disabled="!setting_reg || isDisabled"
              no-caps
            />
          </div>
        </div>
        <div
          v-if="setting_reg && !isRegularityConfigured"
          class="ppr-form__periodicity-required q-mb-md"
        >
          {{ t('ppr_form.configure_regularity') }}
        </div>
        <div v-else-if="setting_reg" class="ppr-form__periodicity-card q-mb-md">
          <q-icon name="event_note" size="xs" color="primary" />
          <div class="ppr-form__periodicity-details">
            <span class="text-caption text-grey-8">
              Настройки периодичности:
              <strong>{{ periodicitySummary }}</strong>
            </span>
            <span class="text-caption text-grey-6">
              {{ periodicityLimit }}
            </span>
          </div>
        </div>
        <div class="schedule-form-template__comment-fields">
          <q-input outlined dense v-model="formData.comment" :label="t('comment')" />
        </div>
      </div>
      <div v-show="schedule_cycle">
        <q-select
          class="q-mb-sm"
          dense
          outlined
          v-model="equipment_cycle_setting.cycle"
          :options="SCHEDULE_CYCLE"
          emit-value
          map-options
          :option-label="(option) => t(`repeat.${option.label}`)"
          option-value="value"
        />
        <div class="setting-schedule-cycle__row">
          <q-radio v-model="condition" val="first" />
          <span>{{ every }}</span>
          <template v-if="equipment_cycle_setting.cycle === 'month'">{{
            formData ? new Date(formData.startDate).getDate() : ''
          }}</template>
          <span v-if="unit_time === t('repeat.month')"> число </span>
          <q-select
            :disable="condition !== 'first'"
            dense
            outlined
            v-model="equipment_cycle_setting.every"
            :options="number_options"
            class="setting-schedule-cycle__select"
            :dropdown-icon="''"
          />
          <span>{{ unit_time }}</span>
        </div>
        <div class="setting-schedule-cycle__row">
          <q-radio
            v-if="unit_time === t('repeat.day')"
            v-model="condition"
            val="second"
            label="Каждый рабочий день"
          />
          <div v-if="unit_time === t('repeat.week')" class="schedule-template-form__days">
            <q-option-group
              v-model="equipment_cycle_setting.week_days"
              :options="daysOfWeekOptionsComputed"
              type="checkbox"
              inline
            />
          </div>
        </div>
        <div v-if="unit_time === t('repeat.month')" class="setting-schedule-cycle__row">
          <q-radio v-model="condition" val="second" />
          {{ getWeekNumberInMonth(new Date(formData ? formData.startDate : '')) }}
          {{
            new Date(formData ? formData.startDate : '')
              .toLocaleString('ru-RU', { weekday: 'short' })
              .toUpperCase()
          }}
          <span>{{ t('every') }}</span>
          <q-select
            :disable="condition != 'second'"
            dense
            outlined
            v-model="equipment_cycle_setting.every"
            :options="number_options"
            class="setting-schedule-cycle__select"
            :dropdown-icon="''"
          />
          <span>{{ unit_time }}</span>
        </div>

        <p class="q-mb-none">{{ t('repeat.how_many_times') }}:</p>
        <div class="setting-schedule-cycle__row">
          <q-radio v-model="limit_type" val="always" label="Всегда" />
        </div>
        <div class="setting-schedule-cycle__row">
          <q-radio v-model="limit_type" val="limit_date" label="До" />
          <q-input
            :disable="limit_type !== 'limit_date'"
            dense
            outlined
            type="date"
            v-model="equipment_cycle_setting.limit_date"
            class="setting-schedule-cycle__limit-date"
          />
        </div>
        <div class="ppr-form-setting__actions">
          <q-btn :label="t('cancel')" flat @click="close_setting" class="custom-btn grey_button" />
          <q-btn :label="t('save')" color="primary" @click="save_setting" class="custom-btn" />
        </div>
      </div>
    </template>
  </ScheduleFormTemplate>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useScheduleStore } from 'src/entities/schedule';
import { parseDateToLocal, formatDateToUTC } from 'src/shared/utils';
import { ScheduleFormTemplate } from 'src/shared/templates';
import type { ScheduleFormData, ScheduleCycleSetting } from 'src/shared/templates';
import {
  SCHEDULE_CYCLE,
  DAYS_OF_WEEK_OPTIONS,
  DAYS_OF_MONTH_OPTIONS,
  MONTHS_OF_YEAR_OPTIONS,
  ALWAYS,
} from 'src/shared/constants/schedule/schedule';
import type {
  EquipmentSchedule,
  CreateEquipmentScheduleRequest,
  UpdateEquipmentScheduleRequest,
} from 'src/entities/schedule';
import { setDefaultStartDateTime, setDefaultEndDateTime } from 'src/shared/lib/useScheduleOptions';

import { THE_24_HOURS } from 'src/shared/constants/schedule/schedule';
interface Props {
  equipmentId: string;
  /** Расписание для редактирования */
  scheduleItem?: EquipmentSchedule | null;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  schedule_cycle?: boolean;
}

interface Emits {
  (e: 'saved'): void;
  (e: 'setting_schedule_cycle', formData: ScheduleFormData): void;
  (e: 'disable_save_btn', value: boolean): void;
  (e: 'show_schedule_setting', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleItem: null,
  active: true,
  schedule_cycle: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();
const scheduleStore = useScheduleStore();
const templateRef = ref<InstanceType<typeof ScheduleFormTemplate>>();
const setting_reg = ref(false);
const isRegularityConfigured = ref(false);
const formData = reactive<ScheduleFormData>({
  name: '',
  comment: '',
  startDate: '',
  startTime: THE_24_HOURS.start,
  endDate: '',
  endTime: THE_24_HOURS.end,
  equipment_cycle_setting: null,
});

const daysOfMonthOptions = DAYS_OF_MONTH_OPTIONS;
const monthsOfYearOptions = MONTHS_OF_YEAR_OPTIONS;
const daysOfWeekOptions = DAYS_OF_WEEK_OPTIONS;

const isDisabled = computed(() => {
  const disabled =
    !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime;
  return disabled;
});

// Отслеживаем изменения и эмитим событие
watch(
  isDisabled,
  (value) => {
    emit('disable_save_btn', value);
  },
  { immediate: true }
);

type CycleType = 'day' | 'week' | 'month';

const week_day = computed(() => new Date(formData ? formData.startDate : '').getDay());
const limit_date = computed(() =>
  props.scheduleItem?.equipment_cycle_setting?.limit_date?.slice(0, 10)
    ? props.scheduleItem.equipment_cycle_setting.limit_date
    : formData.endDate
);

type LimitType = 'always' | 'limit_date';
const limit_type = ref<LimitType>('limit_date');
const condition = ref('first');

const equipment_cycle_setting = ref<ScheduleCycleSetting>({
  cycle: SCHEDULE_CYCLE[0].value,
  every: 1,
  limit_date: limit_date.value,
  week_days: [],
  week_day_number: null,
});
const daysOfWeekOptionsComputed = computed(() => {
  const selected = equipment_cycle_setting.value.week_days;
  if (selected.length !== 1) return daysOfWeekOptions;
  return daysOfWeekOptions.map((opt) => ({
    ...opt,
    disable: opt.value === selected[0],
  }));
});
const unit_time = computed(() => {
  const translations: Record<CycleType, string> = {
    day: t('repeat.day'),
    week: t('repeat.week'),
    month: t('repeat.month'),
  };
  return translations[equipment_cycle_setting.value.cycle] ?? '';
});

const every = computed(() => {
  const keys = {
    day: 'repeat.every',
    week: 'repeat.every_week',
    month: 'repeat.every_month',
  } as const;
  return t(keys[equipment_cycle_setting.value.cycle] ?? 'repeat.every');
});

const number_options = computed(
  () =>
    ({
      day: daysOfMonthOptions,
      week: monthsOfYearOptions,
      month: monthsOfYearOptions,
    })[equipment_cycle_setting.value.cycle] ?? []
);

function formatDisplayDate(value?: string | null): string {
  if (!value) return '-';
  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split('-');
  if (!year || !month || !day) return normalized;
  return `${day}.${month}.${year}`;
}

const periodicitySummary = computed(() => {
  const { cycle, every: everyValue, week_days } = equipment_cycle_setting.value;

  if (cycle === 'day') {
    return `каждые ${everyValue} дн.`;
  }

  if (cycle === 'week') {
    const selectedDays = week_days
      .map((day) => daysOfWeekOptions.find((option) => option.value === day)?.label)
      .filter(Boolean)
      .join(', ');
    return `каждые ${everyValue} нед. (${selectedDays || 'дни не выбраны'})`;
  }

  return `каждые ${everyValue} мес.`;
});

const periodicityLimit = computed(() => {
  const limitDate = equipment_cycle_setting.value.limit_date;
  if (!limitDate || limitDate.slice(0, 10) === ALWAYS) {
    return 'Повторять: всегда';
  }
  return `Повторять до: ${formatDisplayDate(limitDate)}`;
});

const save_setting = () => {
  isRegularityConfigured.value = true;
  if (props.scheduleItem) {
    const scheduleRequest = formToScheduleRequest();
    // Обрезаем limit_date до 10 символов, если оно есть
    if (
      scheduleRequest.equipment_cycle_setting &&
      scheduleRequest.equipment_cycle_setting.limit_date
    ) {
      scheduleRequest.equipment_cycle_setting.limit_date =
        scheduleRequest.equipment_cycle_setting.limit_date.slice(0, 10);
    }
    equipment_cycle_setting.value = scheduleRequest.equipment_cycle_setting as ScheduleCycleSetting;
  }
  emit('show_schedule_setting', false);
};
const close_setting = () => {
  setting_reg.value = !props.scheduleItem ? false : true;
  if (props.scheduleItem?.equipment_cycle_setting) {
    equipment_cycle_setting.value = {
      cycle:
        (props.scheduleItem.equipment_cycle_setting.cycle as CycleType) ?? SCHEDULE_CYCLE[0].value,
      every: props.scheduleItem.equipment_cycle_setting.every ?? 1,
      limit_date:
        props.scheduleItem.equipment_cycle_setting.limit_date?.slice(0, 10) ??
        formData?.endDate ??
        ALWAYS,
      week_days: Array.isArray(props.scheduleItem.equipment_cycle_setting.week_days)
        ? [...props.scheduleItem.equipment_cycle_setting.week_days]
        : [],
      week_day_number: props.scheduleItem.equipment_cycle_setting.week_day_number ?? null,
    };
  } else {
    condition.value = 'first';
    equipment_cycle_setting.value = {
      cycle: SCHEDULE_CYCLE[0].value,
      every: 1,
      limit_date: formData?.endDate ?? ALWAYS,
      week_days: [],
      week_day_number: null,
    };
  }
  emit('show_schedule_setting', false);
};
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

watch(
  () => equipment_cycle_setting.value.cycle,
  (newCycle, oldCycle) => {
    if (newCycle === oldCycle) return;

    const source = props.scheduleItem?.equipment_cycle_setting;
    const isBackToSourceCycle = source?.cycle === newCycle;

    if (isBackToSourceCycle) {
      equipment_cycle_setting.value.every = source?.every ?? 1;
      equipment_cycle_setting.value.week_day_number = source?.week_day_number ?? null;
      equipment_cycle_setting.value.week_days = Array.isArray(source?.week_days)
        ? [...source.week_days]
        : getWeekDaysForCycle(newCycle as CycleType, week_day.value);
      return;
    }

    condition.value = 'first';
    equipment_cycle_setting.value.every = 1;
    equipment_cycle_setting.value.week_day_number = null;
    equipment_cycle_setting.value.week_days = getWeekDaysForCycle(
      newCycle as CycleType,
      week_day.value
    );
  }
);

watch(
  () => limit_type.value,
  (newVal) => {
    equipment_cycle_setting.value.limit_date =
      newVal === 'limit_date' ? (formData?.endDate ?? ALWAYS) : ALWAYS;
  }
);

watch(
  () => condition.value,
  (newVal) => {
    if (
      props.scheduleItem?.equipment_cycle_setting?.cycle !== equipment_cycle_setting.value.cycle
    ) {
      equipment_cycle_setting.value.every = 1;
      equipment_cycle_setting.value.week_days = getWeekDaysForCondition(
        newVal,
        equipment_cycle_setting.value.cycle,
        week_day.value
      );
    }
  }
);

watch(
  () => props.schedule_cycle,
  (newVal) => {
    if (newVal) {
      equipment_cycle_setting.value.limit_date = equipment_cycle_setting.value.limit_date
        ? equipment_cycle_setting.value.limit_date
        : (formData?.endDate ?? ALWAYS);
    }
  }
);

// Синхронизация scheduleItem с формой
watch(
  () => props.scheduleItem,
  (newScheduleItem) => {
    if (newScheduleItem) {
      setting_reg.value = !!newScheduleItem.equipment_cycle_setting;
      isRegularityConfigured.value = !!newScheduleItem.equipment_cycle_setting;
      parseScheduleToForm(newScheduleItem);
    } else {
      // Сброс формы при отсутствии scheduleItem
      formData.name = '';
      setting_reg.value = false;
      isRegularityConfigured.value = false;
      setDefaultStartDateTime(formData);
      setDefaultEndDateTime(formData);
    }
  },
  { immediate: true }
);

watch(
  () => setting_reg.value,
  (newVal, oldVal) => {
    if (!newVal) {
      isRegularityConfigured.value = false;
      return;
    }

    if (!oldVal && !props.scheduleItem?.equipment_cycle_setting) {
      isRegularityConfigured.value = false;
    }
  }
);

// Синхронизация active для сброса формы при открытии диалога
watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      reset();
    }
  }
);

const isSubmitting = ref(false);

/** Преобразование EquipmentSchedule в поля формы */
function parseScheduleToForm(schedule: EquipmentSchedule) {
  formData.name = schedule.name || '';

  const startParsed = parseDateToLocal(schedule.dateStart);
  if (startParsed) {
    formData.startDate = startParsed.date;
    formData.startTime = startParsed.time;
  } else {
    setDefaultStartDateTime(formData);
  }

  const endParsed = parseDateToLocal(schedule.dateEnd);
  if (endParsed) {
    formData.endDate = endParsed.date;
    formData.endTime = endParsed.time;
  } else {
    setDefaultEndDateTime(formData);
  }
}

/** Валидация дат на фронтенде */
function validateDates(): string | null {
  return templateRef.value?.validateDates() || null;
}

/** Преобразование полей формы в CreateEquipmentScheduleRequest или UpdateEquipmentScheduleRequest */
function formToScheduleRequest(): CreateEquipmentScheduleRequest | UpdateEquipmentScheduleRequest {
  const dateStart = formatDateToUTC(formData.startDate, formData.startTime);
  const dateEnd = formatDateToUTC(formData.endDate, formData.endTime);
  // Преобразуем limit_date в UTC только для отправки, без изменения оригинального значения
  let limitDateUTC: string | undefined = undefined;
  if (equipment_cycle_setting.value.limit_date && setting_reg.value) {
    limitDateUTC = formatDateToUTC(equipment_cycle_setting.value.limit_date, '23:59');
  }
  const baseData = {
    entityType: 'equipment' as const,
    equipmentId: props.equipmentId,
    name: formData.name.trim(),
    dateStart,
    dateEnd,
    equipment_cycle_setting:
      limitDateUTC !== undefined
        ? {
            ...equipment_cycle_setting.value,
            limit_date: limitDateUTC, // Используем преобразованное значение только здесь
          }
        : null,
    type: 'instance' as const, // ППР обычно instance, не template
  };

  if (props.scheduleItem?._id) {
    return {
      _id: props.scheduleItem._id,
      ...baseData,
    } as UpdateEquipmentScheduleRequest;
  }

  return baseData as CreateEquipmentScheduleRequest;
}

function reset(): void {
  if (props.scheduleItem) {
    parseScheduleToForm(props.scheduleItem);
  } else {
    formData.name = '';
    setDefaultStartDateTime(formData);
    setDefaultEndDateTime(formData);
  }
}

/** Обработка обновления данных формы из шаблона */
function handleFormDataUpdate(newData: ScheduleFormData) {
  // Обновляем reactive объект напрямую для сохранения реактивности
  Object.assign(formData, newData);
}

/** Обработка события сброса из шаблона */
function handleTemplateReset() {
  reset();
}

async function submit() {
  if (setting_reg.value && !isRegularityConfigured.value) {
    $q.notify({
      type: 'negative',
      message: t('ppr_form.configure_regularity'),
      position: 'top',
      timeout: 4000,
    });
    return;
  }

  const isValid = await templateRef.value?.validateForm();
  if (!isValid) {
    // Показываем ошибку валидации дат, если она есть
    const dateValidationError = validateDates();
    if (dateValidationError) {
      $q.notify({
        type: 'negative',
        message: dateValidationError,
        position: 'top',
        timeout: 5000,
      });
    }
    return;
  }

  isSubmitting.value = true;

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

    // Извлекаем сообщение об ошибке из ответа API
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    const errorMessage =
      axiosError.response?.data?.message || t('error') || 'Произошла ошибка при сохранении';

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 5000,
      actions: [
        {
          icon: 'close',
          color: 'white',
          round: true,
          handler: () => {},
        },
      ],
    });
  } finally {
    isSubmitting.value = false;
  }
}
onMounted(() => {
  if (props.scheduleItem) {
    const src = props.scheduleItem?.equipment_cycle_setting;
    equipment_cycle_setting.value = src
      ? {
          cycle: (src.cycle as CycleType) ?? SCHEDULE_CYCLE[0].value,
          every: src.every ?? 1,
          limit_date: src.limit_date?.slice(0, 10) ?? formData?.endDate ?? ALWAYS,
          week_days: Array.isArray(src.week_days) ? [...src.week_days] : [],
          week_day_number: src.week_day_number ?? null,
        }
      : equipment_cycle_setting.value;
    if (src) {
      limit_type.value = src.limit_date?.slice(0, 10) === ALWAYS ? 'always' : 'limit_date';
    }
  }
});
defineExpose({
  submit,
  reset,
  isSubmitting,
  ppr_name: computed(() => formData.name),
});
</script>

<style scoped lang="scss">
.grey_button {
  background-color: var(--gray);
}
.ppr-form-setting__actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-top: 18px;
}

.schedule-form-template__frequency-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  height: 35px;
  /* Typing text medium */
  font-family: Roboto;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  /* 137.5% */
}

.schedule-form-template__frequency-fields > * {
  flex: 1 1 0;
}

.schedule-form-template__frequency-button {
  & :deep(.block) {
    /* Buttons table */
    font-family: Roboto;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
    /* 142.857% */
  }
}

.schedule-form-template__comment-fields {
  :deep(.q-field__native) {
    overflow: hidden;
    color: var(--strong-gray);
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    /* 137.5% */
  }
}

.ppr-form__periodicity-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  margin-top: 8px;
  border: 1px solid #d9e7f7;
  border-radius: 8px;
  background: #f5f9ff;
}

.ppr-form__periodicity-required {
  color: var(--q-negative);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.ppr-form__periodicity-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

// Стили теперь наследуются из ScheduleFormTemplate

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
  width: 130px;

  &:deep(.q-field__control) {
    height: 38px;
    min-height: 38px;
    padding: 0 6px;
  }
}
</style>
