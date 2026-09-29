<template>
  <q-form ref="formRef" class="batch-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('batch_form.batch_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hide-bottom-space
      @keyup.enter="submit"
    />

    <div class="batch-form__row">
      <q-input
        v-model="formData.quantity"
        outlined
        dense
        :label="t('batch_form.quantity')"
        type="number"
        :rules="quantityRules"
        hide-bottom-space
        :disable="isFormBusy"
        class="no-spinner"
      />

      <q-select
        v-if="isFieldVisible('status').value"
        v-model="formData.status"
        outlined
        dense
        :label="t('batch_form.status')"
        :options="statusOptions"
        emit-value
        map-options
        hide-bottom-space
      />
    </div>

    <q-input
      v-if="isFieldVisible('stringId').value"
      v-model="formData.stringId"
      outlined
      dense
      :label="t('batch_form.string_id')"
      :disable="isFormBusy"
      hide-bottom-space
    >
      <template #append>
        <InfoIcon
          text="id для совместимости систем"
          :hash="'#materials_strokoviy_id'"
          :section="'materials'"
        />
      </template>
    </q-input>

    <template v-if="isFieldVisible('deliveryDate').value || isFieldVisible('expirationDate').value">
      <div v-if="isFieldVisible('deliveryDate').value" class="batch-form__row">
        <q-input
          v-model="formData.deliveryDate"
          outlined
          dense
          :label="t('batch_form.delivery_date')"
          type="date"
          :disable="deliveryDateUnknown || isFormBusy"
          hide-bottom-space
          class="batch-form__date-input"
        />
        <q-input
          v-model="formData.deliveryTime"
          outlined
          dense
          :label="t('batch_form.delivery_time')"
          type="time"
          :disable="deliveryDateUnknown || isFormBusy"
          hide-bottom-space
          class="batch-form__time-input"
        />
      </div>
      <div>
        <q-checkbox v-model="deliveryDateUnknown" :label="t('delivery_date_unknown')" />
      </div>
      <div v-if="isFieldVisible('expirationDate').value" class="batch-form__row">
        <q-input
          v-model="formData.expirationDate"
          outlined
          dense
          :label="t('batch_form.expiration_date')"
          type="date"
          :disable="isFormBusy"
          hide-bottom-space
          class="batch-form__date-input"
        />
        <q-input
          v-model="formData.expirationTime"
          outlined
          dense
          :label="t('batch_form.expiration_time')"
          type="time"
          :disable="isFormBusy"
          hide-bottom-space
          class="batch-form__time-input"
        />
      </div>
    </template>

    <q-input
      v-if="isFieldVisible('description').value"
      v-model="formData.description"
      outlined
      :label="t('description')"
      type="textarea"
      autogrow
      counter
      maxlength="1000"
      :disable="isFormBusy"
      class="custom-textarea"
    />

    <q-input
      v-if="isFieldVisible('feature').value"
      v-model="formData.features"
      outlined
      dense
      :label="t('batch_form.features')"
      :disable="isFormBusy"
      hide-bottom-space
    />

    <div v-if="showActions" class="batch-form__actions">
      <q-btn :label="t('cancel')" flat color="grey" @click="props.onClose" class="custom-btn" />
      <q-btn
        :label="submitLabel"
        color="primary"
        :disable="isSubmitDisabled"
        :loading="isSubmitting"
        @click="submit"
        class="custom-btn"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { QForm, useQuasar } from 'quasar';
import {
  batchApi,
  type CreateBatchRequest,
  type CreateBatchResponse,
  type UpdateBatchRequest,
  type UpdateBatchResponse,
  type BatchListItem,
  type BatchStatus,
} from 'src/entities/batch';
import { useI18n } from 'vue-i18n';
import { getBatchFormFields, type BatchFieldKey } from 'src/shared/config';
import { InfoIcon } from 'src/shared';
import { formatDateToUTC } from 'src/shared/utils';

interface BatchFormData {
  name: string;
  type: 'material';
  quantity: number;
  entityId: string;
  description: string;
  status: BatchStatus;
  stringId: string;
  deliveryDate: string;
  deliveryTime: string;
  expirationDate: string;
  expirationTime: string;
  features: string;
  feature?: Record<string, unknown>;
  _id?: string;
}

interface Props {
  entityId: string;
  entityType?: string;
  batch?: BatchListItem | null | undefined;
  mode?: 'create' | 'edit';
  active: boolean;
  showActions?: boolean;
  onClose: () => void;
  /** Кастомная видимость полей (переопределяет настройки по умолчанию) */
  fieldVisibility?: Partial<Record<BatchFieldKey, boolean>>;
}

interface Emits {
  (e: 'created', batch: CreateBatchResponse): void;
  (e: 'updated', batch: UpdateBatchResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  entityType: 'Material',
  mode: 'create',
  showActions: true,
  fieldVisibility: () => ({}),
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();

// Form ref
const formRef = ref<QForm>();

// Form data
const formData = reactive<BatchFormData>({
  name: '',
  type: 'material' as const,
  quantity: 0,
  entityId: props.entityId,
  description: '',
  status: 'unknown' as BatchStatus,
  stringId: '',
  deliveryDate: '',
  deliveryTime: '00:00',
  expirationDate: '',
  expirationTime: '00:00',
  features: '',
  ...(props.mode === 'edit' && props.batch ? { _id: props.batch._id } : {}),
});

// Status options
const statusOptions = [
  { label: t('batch_form.status_available'), value: 'available' },
  { label: t('batch_form.status_expended'), value: 'expended' },
  { label: t('batch_form.status_unknown'), value: 'unknown' },
];

// Reactive state
const isSubmitting = ref(false);
const deliveryDateUnknown = ref(false);
const isFormBusy = computed(() => isSubmitting.value);

// Computed
const submitLabel = computed(() => (props.mode === 'create' ? t('create') : t('save')));

const isSubmitDisabled = computed(() => isFormBusy.value || !formData.name?.trim());

// Конфигурация полей формы
const formFields = computed(() => getBatchFormFields(props.fieldVisibility));

// Вспомогательные computed для проверки видимости полей
const isFieldVisible = (fieldKey: BatchFieldKey) =>
  computed(() => formFields.value.some((field) => field.key === fieldKey));

// Validation rules
const nameRules = [
  (val: string) => !!val || t('batch_form.name_required'),
  (val: string) => val.length >= 2 || t('batch_form.name_min_length'),
];

const quantityRules = [
  (val: number | string) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    return (numVal >= 0 && !isNaN(numVal)) || t('batch_form.quantity_positive');
  },
];

// Watchers
watch(
  () => props.entityId,
  (newEntityId) => {
    if (props.mode === 'create') {
      formData.entityId = newEntityId;
    }
  }
);

/** Парсит ISO/date строку в { date, time }. Время по умолчанию 00:00. */
function parseDatetimeToFields(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '00:00' };
  const trimmed = value.trim();
  // Дата без времени — используем 00:00 по умолчанию
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { date: trimmed, time: '00:00' };
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return { date: trimmed, time: '00:00' };
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

watch(deliveryDateUnknown, (status_unknown) => {
  if (status_unknown) {
    formData.deliveryDate = '';
    formData.deliveryTime = '00:00';
  }
});
watch(
  () => props.batch,
  (newBatch) => {
    if (newBatch && props.mode === 'edit') {
      // Конвертируем feature обратно в features строку
      const featuresValue =
        newBatch.feature && typeof newBatch.feature === 'object'
          ? ((newBatch.feature as Record<string, string>)['1'] ?? '')
          : '';

      const delivery = parseDatetimeToFields(newBatch.deliveryDate || '');
      const expiration = parseDatetimeToFields(newBatch.expirationDate || '');

      Object.assign(formData, {
        _id: newBatch._id,
        name: newBatch.name,
        type: newBatch.type,
        quantity: newBatch.quantity,
        entityId: newBatch.entityId,
        entityType: newBatch.entityType,
        description: newBatch.description || '',
        status: newBatch.status || 'unknown',
        stringId: newBatch.stringId || '',
        deliveryDate: delivery.date,
        deliveryTime: delivery.time,
        expirationDate: expiration.date,
        expirationTime: expiration.time,
        features: featuresValue,
        feature: newBatch.feature,
      });
      deliveryDateUnknown.value = delivery.date === '';
    }
  },
  { immediate: true }
);

// Methods
async function submit() {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    // Конвертируем features в feature как объект {1: значение}
    const featureData = formData.features ? { 1: formData.features } : undefined;

    if (props.mode === 'create') {
      const createData: CreateBatchRequest = {
        name: formData.name || '',
        type: 'material',
        entityId: formData.entityId || '',
        ...(formData.quantity !== undefined && { quantity: formData.quantity }),
        ...(formData.description && { description: formData.description }),
        ...(formData.status && { status: formData.status }),
        ...(formData.stringId && { stringId: formData.stringId }),
        ...(formData.deliveryDate && {
          deliveryDate: formatDateToUTC(formData.deliveryDate, formData.deliveryTime) ?? '',
        } || formData.deliveryDate === '' && { deliveryDate: '' }),
        ...(formData.expirationDate && {
          expirationDate: formatDateToUTC(formData.expirationDate, formData.expirationTime) ?? '',
        }),
        ...(featureData && { feature: featureData }),
      };

      const response = await batchApi.create(createData);
      emit('created', response);
      $q.notify({
        type: 'positive',
        message: t('batch_form.batch_created'),
      });
    } else {
      const updateData: UpdateBatchRequest = {
        _id: formData._id || '',
        ...(formData.name && { name: formData.name }),
        ...(formData.type && { type: formData.type }),
        ...(formData.quantity !== undefined && { quantity: formData.quantity }),
        ...(formData.description && { description: formData.description }),
        ...(formData.status && { status: formData.status }),
        ...(formData.stringId && { stringId: formData.stringId }),
        ...(formData.deliveryDate && {
          deliveryDate: formatDateToUTC(formData.deliveryDate, formData.deliveryTime) ?? '',
        } || formData.deliveryDate === '' && { deliveryDate: '' }),
        ...(formData.expirationDate && {
          expirationDate: formatDateToUTC(formData.expirationDate, formData.expirationTime) ?? '',
        }),
        ...(featureData && { feature: featureData }),
      };

      const response = await batchApi.update(updateData);
      emit('updated', response);
      $q.notify({
        type: 'positive',
        message: t('batch_form.batch_updated'),
      });
    }

    props.onClose();
  } catch (error) {
    console.error('Error submitting batch form:', error);
    $q.notify({
      type: 'negative',
      message:
        props.mode === 'create' ? t('batch_form.create_error') : t('batch_form.update_error'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Expose form validation method
defineExpose({
  validate: () => formRef.value?.validate(),
  reset: () => formRef.value?.reset(),
});
</script>

<style scoped lang="scss">
.batch-form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__row {
    display: flex;
    gap: 16px;

    & > * {
      flex: 1;
    }
  }

  &__date-input {
    min-width: 140px;
  }

  &__time-input {
    min-width: 100px;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }
}

.custom-textarea {
  :deep(.q-field__control) {
    min-height: 80px;
  }
}

.custom-btn {
  min-width: 100px;
}

.no-spinner {
  :deep(input[type='number']) {
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}
</style>
