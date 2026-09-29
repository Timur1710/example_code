<template>
  <q-form ref="formRef" class="order-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('order_form.order_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      lazy-rules
    />

    <q-select
      v-model="formData.type"
      outlined
      dense
      :label="t('order_form.order_type')"
      :options="orderTypeOptions"
      emit-value
      map-options
      :rules="typeRules"
      :disable="isFormBusy"
      lazy-rules
    />

    <div class="order-form__row">
      <q-input
        dense
        outlined
        type="date"
        :disable="isFormBusy"
        :label="t('order_date')"
        v-model="formData.orderDate"
        :rules="orderDateRules"
        lazy-rules
      ></q-input>
      <q-input
        dense
        outlined
        type="date"
        :disable="isFormBusy"
        :label="t('shipment_date')"
        v-model="formData.shipmentDate"
        lazy-rules
      ></q-input>
    </div>

    <q-input
      v-model="formData.description"
      outlined
      :label="t('description') + ' (' + t('optional') + ')'"
      type="textarea"
      autogrow
      counter
      maxlength="1000"
      :disable="isFormBusy"
      class="custom-textarea"
    />

    <q-checkbox
      v-model="formData.isolatedOrder"
      :label="t('order_form.isolated_order')"
      :disable="isFormBusy"
      class="order-form__checkbox"
    />

    <q-separator class="q-my-md" />

    <!-- Выбор материалов -->
    <div class="order-form__materials-section">
      <OrderMaterialsSelection
        v-model="formData.materials"
        :production-unit-id="productionUnitId"
        :disabled="isFormBusy"
      />
      <div v-if="formData.materials.length === 0" class="order-form__error-text">
        {{ t('order_form.select_at_least_one_material') }}
      </div>
    </div>

    <div v-if="showActions" class="order-form__actions">
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { QForm, useQuasar } from 'quasar';
import {
  orderApi,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type OrderListItem,
  type UpdateOrderRequest,
  type UpdateOrderResponse,
  type OrderType,
  type OrderMaterialDto,
} from 'src/entities/order';
import {
  todayLocalYmd,
  calendarYmdLocalMidnightToUtcIso,
  toLocalYmd,
} from 'src/shared/utils';
import { OrderMaterialsSelection } from './materials-selection';

interface Props {
  productionUnitId: string | null;
  order?: OrderListItem | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия */
  onClose?: () => void;
}

interface Emits {
  (e: 'created', order: CreateOrderResponse): void;
  (e: 'updated', order: UpdateOrderResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  order: null,
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
  type: 'client' as OrderType,
  orderDate: '',
  shipmentDate: '',
  description: '',
  isolatedOrder: false,
  materials: [] as OrderMaterialDto[],
});

const nameRules = [
  (val: string) => !!val?.trim() || t('order_form.enter_order_name'),
  (val: string) => val.trim().length >= 2 || t('order_form.minimum_2_characters'),
];

const typeRules = [
  (val: string) => !!val || t('order_form.select_order_type'),
];
const orderDateRules = [(val: string) => !!val || t('order_form.order_date_required')];

const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);
const submitLabel = computed(() => (isEditMode.value ? t('save') : t('create')));
const hasFilledFields = computed(() => Boolean(formData.name.trim()));

const isSubmitDisabled = computed(() => {
  if (isFormBusy.value) {
    return true;
  }
  if (isEditMode.value) {
    return !props.order?._id;
  }
  return !props.productionUnitId;
});

const orderTypeOptions = computed(() => [
  { label: t('order_form.client'), value: 'client' },
  { label: t('order_form.production'), value: 'production' },
]);

/**
 * Поле type="date" (YYYY-MM-DD) → ISO UTC: полночь календарного дня в зоне браузера.
 * Одна и та же логика для даты размещения и контрактной даты.
 */
function dateOnlyFieldToApiUtcIso(ymd: string): string {
  return calendarYmdLocalMidnightToUtcIso(ymd);
}

function fillFormFromOrder(order?: OrderListItem | null): void {
  if (!order) return;

  formData.name = order.name ?? '';
  formData.type = order.type ?? 'client';
  formData.orderDate = order.orderDate ? toLocalYmd(order.orderDate) : '';
  formData.shipmentDate = order.shipmentDate ? toLocalYmd(order.shipmentDate) : '';
  formData.description = (order as { description?: string }).description ?? '';
  formData.isolatedOrder = order.isolatedOrder ?? false;

  // Копируем материалы, сохраняя структуру для правильной обработки при отправке
  formData.materials = order.materials
    ? order.materials.map((m) => ({
        materialId: m.materialId,
        quantity: m.quantity,
      }))
    : [];
}

function reset(): void {
  formData.name = '';
  formData.type = 'client';
  formData.orderDate = isEditMode.value ? '' : todayLocalYmd();
  formData.shipmentDate = '';
  formData.description = '';
  formData.isolatedOrder = false;
  formData.materials = [];
  formRef.value?.resetValidation();
}

function buildCreatePayload(): CreateOrderRequest | null {
  if (!props.productionUnitId) return null;

  // Очищаем материалы - оставляем только необходимые поля
  const cleanMaterials = formData.materials.map((m) => {
    // Извлекаем ID материала (может быть строкой или объектом)
    let materialId = '';
    if (typeof m.materialId === 'string') {
      materialId = m.materialId;
    } else if (m.materialId && typeof m.materialId === 'object') {
      const matObj = m.materialId as Record<string, unknown>;
      materialId = (matObj._id as string) || '';
    }

    return {
      materialId,
      quantity: m.quantity,
    };
  });

  const payload: CreateOrderRequest = {
    p_id: props.productionUnitId,
    name: formData.name.trim(),
    type: formData.type,
    orderDate: dateOnlyFieldToApiUtcIso(formData.orderDate),
    materials: cleanMaterials,
  };

  if (formData.shipmentDate) {
    payload.shipmentDate = dateOnlyFieldToApiUtcIso(formData.shipmentDate);
  }

  if (formData.description?.trim()) {
    (payload as { description?: string }).description = formData.description.trim();
  }

  payload.isolatedOrder = formData.isolatedOrder;

  return payload;
}

function buildUpdatePayload(): UpdateOrderRequest | null {
  if (!props.order?._id) return null;

  // Очищаем материалы - оставляем только необходимые поля
  const cleanMaterials = formData.materials.map((m) => {
    // Извлекаем ID материала (может быть строкой или объектом)
    let materialId = '';
    if (typeof m.materialId === 'string') {
      materialId = m.materialId;
    } else if (m.materialId && typeof m.materialId === 'object') {
      const matObj = m.materialId as Record<string, unknown>;
      materialId = (matObj._id as string) || '';
    }

    return {
      materialId,
      quantity: m.quantity,
    };
  });

  // Извлекаем p_id (может быть строкой или объектом)
  let pId = props.order.p_id ?? props.productionUnitId ?? '';
  if (pId && typeof pId === 'object') {
    const pObj = pId as Record<string, unknown>;
    pId = (pObj._id as string) || '';
  }

  const payload: UpdateOrderRequest = {
    _id: props.order._id,
    name: formData.name.trim(),
    type: formData.type,
    orderDate: dateOnlyFieldToApiUtcIso(formData.orderDate),
    materials: cleanMaterials,
  };

  if (pId) {
    payload.p_id = String(pId);
  }

  if (formData.shipmentDate) {
    payload.shipmentDate = dateOnlyFieldToApiUtcIso(formData.shipmentDate);
  } else {
    payload.shipmentDate = null;
  }

  if (formData.description?.trim()) {
    (payload as { description?: string }).description = formData.description.trim();
  }

  payload.isolatedOrder = formData.isolatedOrder;

  return payload;
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  // Проверяем наличие материалов
  if (formData.materials.length === 0) {
    $q.notify({
      type: 'warning',
      message: t('order_form.select_at_least_one_material'),
    });
    return;
  }

  // Если showActions = false, не выполняем API запросы здесь
  if (!props.showActions) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (isEditMode.value) {
      const payload = buildUpdatePayload();
      if (!payload) {
        $q.notify({
          type: 'warning',
          message: t('order_form.no_data_to_update'),
        });
        return;
      }

      console.log('Update payload:', payload);
      const updated = await orderApi.update(payload);
      console.log('Update response:', updated);

      $q.notify({
        type: 'positive',
        message: t('order_form.order_updated'),
      });

      emit('updated', updated);
      return;
    }

    const payload = buildCreatePayload();
    if (!payload) {
      $q.notify({
        type: 'warning',
        message: t('order_form.select_production_unit_first'),
      });
      return;
    }

    const created = await orderApi.create(payload);

    $q.notify({
      type: 'positive',
      message: t('order_form.order_created'),
    });

    emit('created', created);
  } catch (error) {
    console.error('Failed to save order:', error);
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: unknown } };
      console.error('Error response data:', axiosError.response?.data);
    }
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? t('order_form.update_order_error') : t('order_form.create_order_error'),
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function validate(): Promise<boolean> {
  return (await formRef.value?.validate()) ?? false;
}

function getFormData(): CreateOrderRequest | UpdateOrderRequest | null {
  if (isEditMode.value) {
    return buildUpdatePayload();
  }
  return buildCreatePayload();
}

onMounted(() => {
  if (props.active) {
    reset();
    if (isEditMode.value) {
      fillFormFromOrder(props.order);
    }
  }
});

defineExpose({
  submit,
  reset,
  validate,
  getFormData,
  isSubmitting,
  isSubmitDisabled,
  formRef,
  hasFilledFields,
});
</script>

<style scoped lang="scss">
.order-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.order-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.order-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.custom-btn {
  text-transform: none !important;
  width: 100px;
}

.order-form__materials-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-form__error-text {
  font-size: 12px;
  color: #c41e3a;
  margin-top: -4px;
}

.order-form__checkbox {
  margin-top: 4px;
}

:deep(.custom-textarea .q-field__control) {
  min-height: 100px;
}

:deep(.q-field__native),
:deep(.q-field__control),
:deep(.q-field__label) {
  font-size: 16px;
}
</style>
