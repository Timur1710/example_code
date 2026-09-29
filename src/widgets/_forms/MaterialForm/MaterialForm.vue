<template>
  <q-form ref="formRef" class="material-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('material_modal.material_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hide-bottom-space
      @keyup.enter="submit"
    />

    <q-select
      outlined
      v-model="formData.type"
      :options="materialTypeOptions"
      dense
      :label="t('material_modal.material_type')"
      emit-value
      map-options
      popup-content-style="font-size: 16px"
      @update:model-value="
        () => {
          if (formData.type !== 'raw_material') {
            formData.delivery_term = '';
          }
        }
      "
    />

    <q-input
      v-if="formData.type === 'raw_material'"
      v-model="formData.delivery_term"
      outlined
      dense
      :label="t('material_modal.delivery_time')"
      :hint="t('material_modal.in_days')"
      persistent-hint
      type="number"
      min="0"
      :disable="isFormBusy"
      hide-bottom-space
      class="no-spinner"
    >
      <template v-slot:append>
        <q-icon
          name="close"
          v-if="formData.delivery_term.length > 0"
          @click="formData.delivery_term = ''"
          class="cursor-pointer"
        />
      </template>
    </q-input>

    <div class="material-form__row">
      <div class="material-form__quantity-container">
        <q-input
          v-model="formData.quantity"
          outlined
          dense
          :label="t('material_modal.сurrent_stock')"
          type="number"
          :rules="quantityRules"
          hide-bottom-space
          :disable="isQuantityDisabled"
          :hint="
            isQuantityDisabled
              ? 'Для изменения поля редактируйте партии или оставьте одну партию.'
              : ''
          "
          class="no-spinner full-width"
        />
      </div>

      <q-select
        v-model="formData.measure"
        outlined
        dense
        :label="t('measurement_units.measurement_unit')"
        :options="measureOptions"
        emit-value
        map-options
        :rules="[(val: string) => !!val || t('measurement_units.error')]"
        hide-bottom-space
      />
    </div>

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

    <div v-if="showActions" class="material-form__actions">
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
  materialApi,
  useMaterialStore,
  type CreateMaterialRequest,
  type CreateMaterialResponse,
  type MaterialListItem,
  type UpdateMaterialRequest,
  type UpdateMaterialResponse,
  type MaterialType,
} from 'src/entities/material';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMeasurementUnitOptions } from 'src/shared/lib/useMeasurementUnitOptions';
import type { MeasurementUnitCode } from 'src/shared/constants/measurement-units';
interface Props {
  productionUnitId: string | null;
  material?: MaterialListItem | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  materialTypeOptions?: { value: string; label: string; disable?: boolean }[];
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия диалога */
  onClose?: () => void;
}

interface Emits {
  (e: 'created', material: CreateMaterialResponse): void;
  (e: 'updated', material: UpdateMaterialResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  material: null,
  mode: 'create',
  active: true,
  showActions: true,
  materialTypeOptions: () => [],
  onClose: () => {},
});
const emit = defineEmits<Emits>();
const materialStore = useMaterialStore();
const $q = useQuasar();
const { t } = useI18n();

// Реактивные данные из store (используем storeToRefs для сохранения реактивности)
const { materialStream } = storeToRefs(materialStore);

const formRef = ref<QForm>();
const isSubmitting = ref(false);

const formData = reactive({
  name: '',
  type: 'finished_product' as MaterialType,
  quantity: '',
  measure: '' as MeasurementUnitCode | '',
  description: '',
  delivery_term: '',
});

const nameRules = [
  (val: string) => !!val?.trim() || t('material_modal.enter_name'),
  (val: string) => val.trim().length >= 2 || t('material_modal.minimum_of_2_characters'),
];

const quantityRules = [
  (val: string) => val === '' || !Number.isNaN(Number(val)) || 'Введите число',
  (val: string) => val === '' || Number(val) >= 0 || 'Не может быть отрицательным',
];

const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);

const isQuantityDisabled = computed(() => {
  return (
    isFormBusy.value || (props.material?.batchCount !== undefined && props.material.batchCount > 1)
  );
});

const submitLabel = computed(() => (isEditMode.value ? t('save') : t('create')));
const hasFilledFields = computed(() => Boolean(formData.name.trim()));

const isSubmitDisabled = computed(() => {
  if (!formData.name.trim() || isFormBusy.value) {
    return true;
  }
  if (materialStream.value && formData.type === 'raw_material') {
    return true;
  }
  if (isEditMode.value) {
    return !props.material?._id;
  }

  return !props.productionUnitId;
});

const measureOptions = useMeasurementUnitOptions();

function fillFormFromMaterial(material?: MaterialListItem | null): void {
  if (!material) return;
  formData.name = material.name ?? '';
  formData.quantity =
    material.totalQuantity !== undefined && material.totalQuantity !== null
      ? String(material.totalQuantity)
      : '';
  formData.measure = (material.measure ?? '') as MeasurementUnitCode;
  formData.description = material.description ?? '';
  formData.type = material.type ?? 'finished_product';
  formData.delivery_term = material.delivery_term ?? '';
}

function reset(): void {
  formData.name = '';
  formData.type = 'finished_product';
  formData.quantity = '';
  formData.measure = '';
  formData.description = '';
  formData.delivery_term = '';
  formRef.value?.resetValidation();
}

function buildCreatePayload(): CreateMaterialRequest | null {
  if (!props.productionUnitId) return null;

  const payload: CreateMaterialRequest = {
    p_id: props.productionUnitId,
    name: formData.name.trim(),
    type: formData.type,
  };

  if (formData.quantity !== '') {
    const parsed = Number(formData.quantity);
    if (!Number.isNaN(parsed)) {
      payload.batchQuantity = parsed;
    }
  }

  if (formData.measure?.trim()) {
    payload.measure = formData.measure.trim();
  }

  if (formData.description?.trim()) {
    payload.description = formData.description.trim();
  }

  if (formData.delivery_term !== '' && formData.type === 'raw_material') {
    const parsed = Number(formData.delivery_term);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      payload.delivery_term = String(parsed);
    }
  }

  return payload;
}

function buildUpdatePayload(): UpdateMaterialRequest | null {
  if (!props.material?._id) return null;

  const payload: UpdateMaterialRequest = {
    _id: props.material._id,
    name: formData.name.trim(),
    type: formData.type,
  };

  const pId = props.material.p_id ?? props.productionUnitId;
  if (pId) {
    payload.p_id = pId;
  }

  if (props.material.s_id) {
    payload.s_id = props.material.s_id;
  }

  if (formData.quantity !== '') {
    const parsed = Number(formData.quantity);
    if (!Number.isNaN(parsed)) {
      payload.quantity = parsed;
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

  if (formData.type === 'raw_material') {
    if (formData.delivery_term !== '') {
      const parsed = Number(formData.delivery_term);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        payload.delivery_term = String(parsed);
      }
    } else {
      payload.delivery_term = '';
    }
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

      const updated = await materialApi.update(payload);

      $q.notify({
        type: 'positive',
        message: 'Материал обновлён',
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

    const created = await materialApi.create(payload);

    $q.notify({
      type: 'positive',
      message: 'Материал создан',
    });

    emit('created', created);
  } catch (error) {
    console.error('Failed to create material:', error);
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? 'Не удалось обновить материал' : 'Не удалось создать материал',
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
        fillFormFromMaterial(props.material);
      }
    }
  }
);

watch(
  () => props.material,
  (next) => {
    if (isEditMode.value && props.active) {
      reset();
      fillFormFromMaterial(next);
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.active) {
    reset();
    if (isEditMode.value) {
      fillFormFromMaterial(props.material);
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
.material-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.material-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.material-form__info-icon {
  margin-left: 10px;
  margin-top: 5px;
}
.material-form__quantity-container {
  display: flex;
  width: 100%;
  align-items: center;
}

.material-form__actions {
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
:deep(.no-spinner input[type='number']::-webkit-inner-spin-button),
:deep(.no-spinner input[type='number']::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
:deep(.q-field__native),
:deep(.q-field__control),
:deep(.q-field__label) {
  font-size: 16px;
}
</style>
