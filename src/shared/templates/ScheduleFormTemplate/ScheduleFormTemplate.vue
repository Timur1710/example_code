<template>
  <q-form ref="formRef" class="schedule-form-template" @submit.prevent="handleSubmit">
    <!-- Поле названия (опционально) -->
    <q-input v-if="showNameField" :model-value="modelValue.name" outlined dense :label="t('ppr_form.name')"
      :rules="nameRules || defaultNameRules" @update:model-value="updateField('name', $event)" class="q-pb-none" />

    <!-- Дополнительные поля перед секцией периода (слот) -->
    <slot name="fields-before-period" :form-data="modelValue" :update-field="updateField" />

    <!-- Секция периода -->
    <div v-if="!hideBaseFields" class="schedule-form-template__period-section">
      <div class="schedule-form-template__period-title q-mb-sm">
        <!-- <q-icon name="schedule" class="q-mr-sm" /> -->
        {{ t(periodTitleKey || 'ppr_form.maintenance_period') }}:
      </div>

      <div class="schedule-form-template__period-grid">
        <div class="schedule-form-template__period-row">
          <div class="schedule-form-template__period-label">{{ t('ppr_form.start') }}</div>
          <q-input :model-value="modelValue.startDate" outlined dense :label="t('ppr_form.start_date')" type="date"
            class="schedule-form-template__date-input q-pb-none" :rules="[val => !!val || '']"
            @update:model-value="updateField('startDate', $event)" />
          <q-input :model-value="modelValue.startTime" outlined dense :label="t('ppr_form.start_time')" type="time"
            class="schedule-form-template__time-input q-pb-none" :disable="props.disableTimeFields"
            @update:model-value="updateField('startTime', $event)" />
        </div>

        <div class="schedule-form-template__period-row">
          <div class="schedule-form-template__period-label">{{ t('ppr_form.end') }}</div>
          <q-input :model-value="modelValue.endDate" outlined dense :label="t('ppr_form.end_date')" type="date"
            :rules="[val => !!val || t('validate.required'), validateEndDateRule]"
            class="schedule-form-template__date-input q-pb-none" @update:model-value="updateField('endDate', $event)" />
          <q-input :model-value="modelValue.endTime" outlined dense :label="t('ppr_form.end_time')" type="time"
            :rules="[validateEndTimeRule]" class="schedule-form-template__time-input q-pb-none"
            :disable="props.disableTimeFields"
            @update:model-value="updateField('endTime', $event)" />
        </div>
      </div>
    </div>

    <!-- Дополнительные поля после секции периода (слот) -->
    <slot name="fields-after-period" :form-data="modelValue" :update-field="updateField" />
  </q-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { QForm } from 'quasar';
import { validateDateRange } from 'src/shared/utils';
import type {
  ScheduleFormTemplateProps,
  ScheduleFormTemplateEmits,
  ScheduleFormData,
} from './model/types';

defineOptions({
  name: 'ScheduleFormTemplate',
});

const props = withDefaults(defineProps<ScheduleFormTemplateProps>(), {
  scheduleItem: null,
  active: true,
  showNameField: true,
  hideBaseFields: false,
  disableTimeFields: false,
  periodTitleKey: 'ppr_form.maintenance_period',
  dateValidationErrorKey: 'ppr_form.validation.start_after_end',
});

const emit = defineEmits<ScheduleFormTemplateEmits>();

const { t } = useI18n();

const formRef = ref<QForm>();

/** Правила валидации для поля названия по умолчанию */
const defaultNameRules = [
  (val: string) => !!val || t('validate.required'),
  (val: string) => val.length >= 2 || t('validate.min_length', { min: 2 }),
  (val: string) => val.length <= 100 || t('validate.max_length', { max: 100 }),
];

/** Обновление поля формы */
function updateField(field: keyof ScheduleFormData, value: unknown) {
  const updatedData = {
    ...props.modelValue,
    [field]: value,
  };
  emit('update:modelValue', updatedData);
}

/** Правило валидации для поля даты окончания */
function validateEndDateRule(val: string): boolean | string {
  if (!val || !props.modelValue.startDate) return true;

  const isValid = validateDateRange(
    props.modelValue.startDate,
    props.modelValue.startTime,
    val,
    props.modelValue.endTime
  );

  // return isValid || t(props.dateValidationErrorKey);
  return isValid || '';
}

/** Правило валидации для поля времени окончания */
function validateEndTimeRule(val: string): boolean | string {
  if (!props.modelValue.startDate || !props.modelValue.endDate) return true;

  const isValid = validateDateRange(
    props.modelValue.startDate,
    props.modelValue.startTime,
    props.modelValue.endDate,
    val
  );

  // return isValid || t(props.dateValidationErrorKey);
  return isValid || '';
}

/** Валидация дат на фронтенде */
function validateDates(): string | null {
  if (!props.modelValue.startDate || !props.modelValue.endDate) return null;

  const isValid = validateDateRange(
    props.modelValue.startDate,
    props.modelValue.startTime,
    props.modelValue.endDate,
    props.modelValue.endTime
  );

  return isValid ? null : t(props.dateValidationErrorKey);
}

/** Обработка отправки формы (не эмитит saved, только валидирует) */
async function handleSubmit() {
  const isValid = await formRef.value?.validate();
  if (!isValid) return false;

  // Валидация дат на фронтенде
  const dateValidationError = validateDates();
  if (dateValidationError) {
    return false;
  }

  return true;
}

/** Сброс формы */
function reset() {
  emit('reset');
}

// Watch на active и scheduleItem - сбрасываем форму при открытии диалога или изменении расписания
watch(
  () => [props.active, props.scheduleItem] as const,
  ([isActive, scheduleItem], [prevActive, prevScheduleItem]) => {
    // Сбрасываем только если форма стала активной или изменился scheduleItem
    if (isActive && (isActive !== prevActive || scheduleItem?._id !== prevScheduleItem?._id)) {
      reset();
    }
  },
  { deep: true }
);

/** Публичный метод для валидации и проверки формы */
async function validateForm(): Promise<boolean> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return false;

  const dateValidationError = validateDates();
  return !dateValidationError;
}

defineExpose({
  validate: () => formRef.value?.validate(),
  validateForm,
  validateDates,
  reset,
  formRef,
});
</script>

<style scoped lang="scss">
.schedule-form-template {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// .schedule-form-template__period-section {
//   margin-top: 16px;
// }
:deep(.q-field__bottom) {
  padding: 2px 0;
  min-height: 11px;
}

.schedule-form-template__period-title {
  color: var(--black);

  /* Typing text medium */
  font-family: Roboto;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  /* 137.5% */
}

.schedule-form-template__period-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-form-template__period-row {
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 12px;
  align-items: center;
  // padding: 12px;
  // border: 1px solid #e0e0e0;
  // border-radius: 8px;
  // background-color: #fafafa;
}

.schedule-form-template__period-label {
  font-weight: 500;
  color: #212121;
}

.schedule-form-template__date-input {
  min-width: 140px;
}

.schedule-form-template__time-input {
  min-width: 120px;
}
</style>
