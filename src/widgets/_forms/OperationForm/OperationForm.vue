<template>
  <q-form ref="formRef" class="operation-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('operation_modal.operation_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hide-bottom-space
      @keyup.enter="submit"
    />

    <q-input
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

    <div v-if="showActions" class="operation-form__actions">
      <q-btn
        :label="t('cancel')"
        flat
        color="grey"
        @click="() => props.onClose?.()"
        class="custom-btn"
      />
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { QForm, useQuasar } from 'quasar';
import {
  operationApi,
  type CreateOperationRequest,
  type CreateOperationResponse,
  type OperationListItem,
  type UpdateOperationRequest,
  type UpdateOperationResponse,
} from 'src/entities/operation';
import { useI18n } from 'vue-i18n';

interface Props {
  productionUnitId: string | null;
  operation?: OperationListItem | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия диалога */
  onClose?: () => void;
}

interface Emits {
  (e: 'created', operation: CreateOperationResponse): void;
  (e: 'updated', operation: UpdateOperationResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  operation: null,
  mode: 'create',
  active: true,
  showActions: true,
  onClose: () => {},
});

const emit = defineEmits<Emits>();

const $q = useQuasar();
const { t } = useI18n();

const formRef = ref<QForm>();
const isSubmitting = ref(false);

const formData = reactive({
  name: '',
  description: '',
});

const nameRules = [
  (val: string) => !!val?.trim() || t('operation_modal.enter_name'),
  (val: string) => val.trim().length >= 2 || t('operation_modal.minimum_of_2_characters'),
];

const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);
const hasFilledFields = computed(() => Boolean(formData.name.trim()));
const submitLabel = computed(() => (isEditMode.value ? t('save') : t('create')));

const isSubmitDisabled = computed(() => {
  if (!formData.name.trim() || isFormBusy.value) {
    return true;
  }

  if (isEditMode.value) {
    return !props.operation?._id;
  }

  return !props.productionUnitId;
});

function fillFormFromOperation(operation?: OperationListItem | null): void {
  if (!operation) return;
  formData.name = operation.name ?? '';
  formData.description = operation.description ?? '';
}

function reset(): void {
  formData.name = '';
  formData.description = '';
  formRef.value?.resetValidation();
}

function buildCreatePayload(): CreateOperationRequest | null {
  if (!props.productionUnitId) return null;

  const payload: CreateOperationRequest = {
    name: formData.name.trim(),
    direction: 'all',
    cost: '0',
    compliance_rate: '0',
    schedule: true,
    scripts: {},
    resources: [],
    p_id: props.productionUnitId,
  };

  if (formData.description?.trim()) {
    payload.description = formData.description.trim();
  }

  return payload;
}

function buildUpdatePayload(): UpdateOperationRequest | null {
  if (!props.operation?._id) return null;

  const payload: UpdateOperationRequest = {
    _id: props.operation._id,
  };

  if (formData.name.trim()) {
    payload.name = formData.name.trim();
  }

  if (formData.description?.trim()) {
    payload.description = formData.description.trim();
  }

  return payload;
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    if (isEditMode.value) {
      const payload = buildUpdatePayload();
      if (!payload) {
        $q.notify({
          type: 'warning',
          message: 'Нет данных для обновления',
        });
        return;
      }

      const updated = await operationApi.update(payload);

      $q.notify({
        type: 'positive',
        message: 'Операция обновлена',
      });

      emit('updated', updated);
      return;
    }

    const payload = buildCreatePayload();
    if (!payload) {
      $q.notify({
        type: 'warning',
        message: 'Сначала выберите производственную единицу',
      });
      return;
    }

    const created = await operationApi.create(payload);

    $q.notify({
      type: 'positive',
      message: 'Операция создана',
    });

    emit('created', created);
  } catch (error) {
    console.error('Failed to create/update operation:', error);
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? 'Не удалось обновить операцию' : 'Не удалось создать операцию',
    });
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      reset();
      if (isEditMode.value) {
        fillFormFromOperation(props.operation);
      }
    }
  }
);

watch(
  () => props.operation,
  (next) => {
    if (isEditMode.value && props.active) {
      reset();
      fillFormFromOperation(next);
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.active) {
    reset();
    if (isEditMode.value) {
      fillFormFromOperation(props.operation);
    }
  }
});

defineExpose({
  submit,
  reset,
  isSubmitting,
  isSubmitDisabled,
  hasFilledFields,
});
</script>

<style scoped lang="scss">
.operation-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.operation-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.custom-btn {
  text-transform: none !important;
  width: 100px;
}

:deep(.custom-textarea .q-field__control) {
  min-height: 147px;
}

:deep(.q-field__native),
:deep(.q-field__control),
:deep(.q-field__label) {
  font-size: 16px;
}
</style>
