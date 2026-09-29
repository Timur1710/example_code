<template>
  <q-form ref="formRef" class="equipment-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('equipment.equipment_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hide-bottom-space
      @keyup.enter="submit"
    />

    <q-toggle
      v-model="formData.occupied"
      left-label
      dense
      color="primary"
      :label="t('occupied')"
      :disable="isFormBusy"
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

    <div v-if="showActions" class="equipment-form__actions">
      <q-btn :label="t('cancel')" flat color="grey" @click="() => props.onClose?.()" class="custom-btn" />
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
import { useI18n } from 'vue-i18n';
import {
  equipmentApi,
  type CreateEquipmentRequest,
  type CreateEquipmentResponse,
  type EquipmentListItem,
  type UpdateEquipmentRequest,
  type UpdateEquipmentResponse,
} from 'src/entities/equipment';

interface Props {
  productionUnitId: string | null;
  equipment?: EquipmentListItem | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  showActions?: boolean;
  onClose: () => void;
}

interface Emits {
  (e: 'created', equipment: CreateEquipmentResponse): void;
  (e: 'updated', equipment: UpdateEquipmentResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  equipment: null,
  mode: 'create',
  active: true,
  showActions: false,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();
const $q = useQuasar();

const formRef = ref<QForm>();
const isSubmitting = ref(false);

const formData = reactive({
  name: '',
  amount: '',
  measure: '',
  description: '',
  occupied: false,
});

const nameRules = [
  (val: string) => !!val?.trim() || 'Введите наименование',
  (val: string) => val.trim().length >= 2 || 'Минимум 2 символа',
];

const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);
const submitLabel = computed(() => (isEditMode.value ? 'Сохранить' : 'Создать'));
const hasFilledFields = computed(() => Boolean(formData.name.trim()));

const isSubmitDisabled = computed(() => {
  if (!formData.name.trim() || isFormBusy.value) {
    return true;
  }

  if (isEditMode.value) {
    return !props.equipment?._id;
  }

  return !props.productionUnitId;
});

function fillFormFromEquipment(equipment?: EquipmentListItem | null): void {
  if (!equipment) return;
  formData.name = equipment.name ?? '';
  formData.amount =
    equipment.amount !== undefined && equipment.amount !== null ? String(equipment.amount) : '';
  formData.measure = equipment.measure ?? '';
  formData.description = equipment.description ?? '';
  formData.occupied = Boolean(equipment.occupied);
}

function reset(): void {
  formData.name = '';
  formData.amount = '';
  formData.measure = '';
  formData.description = '';
  formData.occupied = false;
  formRef.value?.resetValidation();
}

function buildCreatePayload(): CreateEquipmentRequest | null {
  if (!props.productionUnitId) return null;

  const payload: CreateEquipmentRequest = {
    p_id: props.productionUnitId,
    name: formData.name.trim(),
    occupied: formData.occupied,
  };

  if (formData.amount !== '') {
    const parsed = Number(formData.amount);
    if (!Number.isNaN(parsed)) {
      payload.amount = parsed;
    }
  }

  const measure = formData.measure?.trim();
  if (measure) {
    payload.measure = measure;
  }

  const description = formData.description?.trim();
  if (description) {
    payload.description = description;
  }

  return payload;
}

function buildUpdatePayload(): UpdateEquipmentRequest | null {
  if (!props.equipment?._id) return null;

  const payload: UpdateEquipmentRequest = {
    _id: props.equipment._id,
    name: formData.name.trim(),
    occupied: formData.occupied,
  };

  const pId = props.equipment.p_id ?? props.productionUnitId;
  if (pId) {
    payload.p_id = pId;
  }

  if (formData.amount !== '') {
    const parsed = Number(formData.amount);
    if (!Number.isNaN(parsed)) {
      payload.amount = parsed;
    }
  }

  const measure = formData.measure?.trim();
  if (measure) {
    payload.measure = measure;
  }

  const description = formData.description?.trim();
  if (description) {
    payload.description = description;
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

      const updated = await equipmentApi.update(payload);

      $q.notify({
        type: 'positive',
        message: 'Оборудование обновлено',
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

    const created = await equipmentApi.create(payload);

    $q.notify({
      type: 'positive',
      message: 'Оборудование создано',
    });

    emit('created', created);
  } catch (error) {
    console.error('Failed to submit equipment form:', error);
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? 'Не удалось обновить оборудование' : 'Не удалось создать оборудование',
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
        fillFormFromEquipment(props.equipment);
      }
    }
  },
);

watch(
  () => props.equipment,
  (next) => {
    if (isEditMode.value && props.active) {
      reset();
      fillFormFromEquipment(next);
    }
  },
  { deep: true },
);

onMounted(() => {
  if (props.active) {
    reset();
    if (isEditMode.value) {
      fillFormFromEquipment(props.equipment);
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
.equipment-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.equipment-form__actions {
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


