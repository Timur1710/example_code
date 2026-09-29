<template>
  <q-menu
    v-model="isOpen"
    :target="menuTarget"
    anchor="center middle"
    self="center middle"
    :offset="[0, 0]"
    max-width="600px"
    max-height="90vh"
  >
    <q-card class="order-info-modal">
      <OrderInfoModalHeader :title="orderName" @close="handleClose" />

      <q-separator />

      <q-card-section class="order-info-modal__content">
        <q-spinner-dots
          v-if="isLoading"
          color="primary"
          size="32px"
          class="order-info-modal__loader"
        />

        <template v-else>
          <OrderInfoModalDates
            :execution-time="executionTime"
            :planned-date="plannedDate"
            :contract-date="contractDate"
            :has-deadline-conflict="hasDeadlineConflict"
          />

          <OrderInfoModalMaterials
            :materials="orderMaterials"
            :title="t('order_info_modal.ordered_nomenclatures')"
          />
        </template>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PlanOperation, PlanTaskGroup } from 'src/stores/planning-selection.store';
import { orderApi } from 'src/entities/order';
import type { OrderListItem } from 'src/entities/order';
import OrderInfoModalHeader from './OrderInfoModalHeader.vue';
import OrderInfoModalDates from './OrderInfoModalDates.vue';
import OrderInfoModalMaterials from './OrderInfoModalMaterials.vue';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  /** ID клиентского заказа */
  clientOrderId: string;
  /** Название заказа (из строки Ганта) */
  orderName: string;
  /** Все операции плана */
  operations: PlanOperation[];
  /** Группы задач плана */
  taskGroups: PlanTaskGroup[];
  /** Целевой элемент для позиционирования меню */
  menuTarget?: string | Element | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  menuTarget: false,
});

const emits = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emits('update:modelValue', value),
});

// Загрузка данных заказа
const isLoading = ref(false);
const orderData = ref<OrderListItem | null>(null);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.clientOrderId) return;
    isLoading.value = true;
    try {
      orderData.value = await orderApi.getById(props.clientOrderId);
    } catch (e) {
      console.error('Failed to fetch order details:', e);
      orderData.value = null;
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

/**
 * Все операции, принадлежащие заказам этого клиентского заказа
 */
const orderOperations = computed(() => {
  const relatedOrderIds = new Set<string>();
  for (const tg of props.taskGroups) {
    if (tg.clientOrderId === props.clientOrderId || tg.orderId === props.clientOrderId) {
      relatedOrderIds.add(tg.orderId);
    }
  }
  if (relatedOrderIds.size === 0) {
    relatedOrderIds.add(props.clientOrderId);
  }
  return props.operations.filter((op) => relatedOrderIds.has(op.orderId));
});

/**
 * 1. Время выполнения (от начала первой операции до конца последней)
 */
const executionTime = computed(() => {
  const ops = orderOperations.value;
  if (ops.length === 0) return null;

  const starts = ops.map((op) => new Date(op.startTime).getTime());
  const ends = ops.map((op) => new Date(op.endTime).getTime());
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...ends);

  return {
    startTime: new Date(minStart).toISOString(),
    endTime: new Date(maxEnd).toISOString(),
    durationMinutes: Math.round((maxEnd - minStart) / 60000),
  };
});

/**
 * 2. Плановая дата и время выполнения (конец последней операции)
 */
const plannedDate = computed(() => {
  if (!executionTime.value) return null;
  return executionTime.value.endTime;
});

/**
 * 3. Контрактная дата (shipmentDate из заказа)
 */
const contractDate = computed(() => {
  if (!orderData.value?.shipmentDate) return null;
  return new Date(orderData.value.shipmentDate).toISOString();
});

/**
 * Конфликт: плановая дата > контрактной
 */
const hasDeadlineConflict = computed(() => {
  if (!plannedDate.value || !contractDate.value) return false;
  return new Date(plannedDate.value) > new Date(contractDate.value);
});

/**
 * 5. Список заказанных номенклатур и их количество
 */
const orderMaterials = computed(() => {
  if (!orderData.value?.materials) return [];
  return orderData.value.materials.map((m) => ({
    materialId: m.materialId,
    name: m.materialData?.name ?? m.materialId,
    quantity: m.quantity,
    measure: m.materialData?.measure,
  }));
});

function handleClose() {
  isOpen.value = false;
}
</script>

<style lang="scss" scoped>
.order-info-modal {
  min-width: 500px;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__content {
    flex: 1;
    min-height: 0;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
  }

  &__loader {
    display: block;
    margin: 32px auto;
  }
}
</style>

<style lang="scss">
.q-menu:has(.order-info-modal) {
  overflow: hidden !important;
}
</style>
