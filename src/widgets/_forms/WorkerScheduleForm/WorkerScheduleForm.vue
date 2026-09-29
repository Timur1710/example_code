<template>
  <ScheduleFormTemplate
    ref="templateRef"
    :model-value="formData"
    :disable-time-fields="!calculate_schedule_time"
    :schedule-item="scheduleItem"
    :active="active"
    :show-name-field="true"
    :periodTitleKey="'worker_schedule_form.absence_period'"
    :name-rules="[
      (val: string) => !!val || t('validate.required'),
      (val: string) => val.length >= 2 || t('validate.min_length', { min: 2 }),
    ]"
    @update:model-value="handleFormDataUpdate"
    @reset="handleTemplateReset"
  >
    <template #fields-after-period>
      <q-toggle
        v-model="calculate_schedule_time"
        :label="t('worker_schedule_form.calculate_schedule_time') + ':'"
        left-label
        class="self-start"
        color="primary"
      />
    </template>
  </ScheduleFormTemplate>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useScheduleStore } from 'src/entities/schedule';
import { parseDateToLocal, formatDateToUTC } from 'src/shared/utils';
import { ScheduleFormTemplate } from 'src/shared/templates';
import type { ScheduleFormData } from 'src/shared/templates';
import type {
  WorkerSchedule,
  CreateWorkerScheduleRequest,
  UpdateWorkerScheduleRequest,
} from 'src/entities/schedule';
import { setDefaultStartDateTime, setDefaultEndDateTime } from 'src/shared/lib/useScheduleOptions';
import { THE_24_HOURS } from 'src/shared/constants/schedule/schedule';

interface Props {
  workerId: string;
  /** Расписание для редактирования */
  scheduleItem?: WorkerSchedule | null;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
}

interface Emits {
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleItem: null,
  active: true,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();
const scheduleStore = useScheduleStore();

const templateRef = ref<InstanceType<typeof ScheduleFormTemplate>>();
const calculate_schedule_time = ref(false);
const formData = reactive<ScheduleFormData>({
  name: '',
  comment: '',
  startDate: '',
  startTime: THE_24_HOURS.start,
  endDate: '',
  endTime: THE_24_HOURS.end,
});

// Синхронизация scheduleItem с формой
watch(
  () => props.scheduleItem,
  (newScheduleItem) => {
    if (newScheduleItem) {
      parseScheduleToForm(newScheduleItem);
    } else {
      // Сброс формы при отсутствии scheduleItem
      formData.name = '';
      setDefaultStartDateTime(formData);
      setDefaultEndDateTime(formData);
    }
  },
  { immediate: true }
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

watch(
  () => calculate_schedule_time.value,
  (shouldCalculateTime) => {
    if (!shouldCalculateTime) {
      formData.startTime = THE_24_HOURS.start;
      formData.endTime = THE_24_HOURS.end;
    }
  },
  { immediate: true }
);

const isSubmitting = ref(false);

/** Преобразование WorkerSchedule в поля формы */
function parseScheduleToForm(schedule: WorkerSchedule) {
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

  const isDefaultTimeRange =
    formData.startTime === THE_24_HOURS.start && formData.endTime === THE_24_HOURS.end;
  calculate_schedule_time.value = !isDefaultTimeRange;
}

/** Валидация дат на фронтенде */
function validateDates(): string | null {
  return templateRef.value?.validateDates() || null;
}

/** Преобразование полей формы в CreateWorkerScheduleRequest или UpdateWorkerScheduleRequest */
function formToScheduleRequest(): CreateWorkerScheduleRequest | UpdateWorkerScheduleRequest {
  const dateStart = formatDateToUTC(formData.startDate, formData.startTime);
  const dateEnd = formatDateToUTC(formData.endDate, formData.endTime);

  const baseData = {
    entityType: 'worker' as const,
    workerId: props.workerId,
    name: formData.name.trim(),
    dateStart,
    dateEnd,
    type: 'instance' as const,
  };

  if (props.scheduleItem?._id) {
    return {
      _id: props.scheduleItem._id,
      ...baseData,
    } as UpdateWorkerScheduleRequest;
  }

  return baseData as CreateWorkerScheduleRequest;
}

function reset(): void {
  if (props.scheduleItem) {
    parseScheduleToForm(props.scheduleItem);
  } else {
    formData.name = '';
    calculate_schedule_time.value = false;
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
      await scheduleStore.updateSchedule(scheduleRequest as UpdateWorkerScheduleRequest);
    } else {
      // Создание нового расписания
      await scheduleStore.createSchedule(scheduleRequest as CreateWorkerScheduleRequest);
    }

    $q.notify({
      type: 'positive',
      message: t('success'),
      position: 'top',
      timeout: 3000,
    });

    emit('saved');
  } catch (error: unknown) {
    console.error('Failed to save worker schedule:', error);

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

defineExpose({
  submit,
  reset,
  isSubmitting,
});
</script>

<style scoped lang="scss">
// Стили теперь наследуются из ScheduleFormTemplate
</style>
