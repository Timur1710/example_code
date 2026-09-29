<template>
  <div class="orders-tab">
    <GanttChart
      :operations="planningResult.operations"
      :task-groups="planningResult.taskGroups"
      :cell-height="80"
      group-by="orders"
      suppress-default-left-modal
      :warning-row-ids="deadlineConflictIds"
      @row-click="handleRowClick"
    />

    <OrderInfoModal
      v-if="selectedClientOrderId"
      :key="modalKey"
      v-model="isModalOpen"
      :client-order-id="selectedClientOrderId"
      :order-name="selectedOrderName"
      :operations="planningResult.operations"
      :task-groups="planningResult.taskGroups"
      :menu-target="menuTarget"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PlanningResult } from 'src/stores/planning-selection.store';
import { GanttChart, type GanttChartRow } from 'src/widgets/gantt-chart';
import { orderApi } from 'src/entities/order';
import OrderInfoModal from './OrderInfoModal.vue';

const props = defineProps<{
  planningResult: PlanningResult;
}>();

const isModalOpen = ref(false);
const selectedClientOrderId = ref<string | null>(null);
const selectedOrderName = ref('');
const menuTarget = ref<Element | boolean>(false);
const modalKey = ref(0);

/** Набор clientOrderId с конфликтом сроков (плановая дата > контрактной) */
const deadlineConflictIds = ref<Set<string>>(new Set());

watch(
  () => props.planningResult,
  async (result) => {
    if (!result) return;

    // Собираем уникальные clientOrderId из taskGroups
    const clientOrderIds = new Set<string>();
    for (const tg of result.taskGroups) {
      if (tg.clientOrderId) clientOrderIds.add(tg.clientOrderId);
    }
    if (clientOrderIds.size === 0) return;

    // Вычисляем plannedDate (max endTime операций) по каждому clientOrderId
    const plannedByOrder = new Map<string, number>();
    for (const op of result.operations) {
      const tg = result.taskGroups.find((g) => g.orderId === op.orderId);
      const clientId = tg?.clientOrderId;
      if (!clientId) continue;
      const endMs = new Date(op.endTime).getTime();
      const cur = plannedByOrder.get(clientId) ?? 0;
      if (endMs > cur) plannedByOrder.set(clientId, endMs);
    }

    // Параллельно загружаем данные заказов и определяем конфликты
    const entries = [...clientOrderIds];
    const results = await Promise.allSettled(entries.map((id) => orderApi.getById(id)));

    const conflictIds = new Set<string>();
    results.forEach((res, idx) => {
      if (res.status !== 'fulfilled' || !res.value?.shipmentDate) return;
      const id = entries[idx]!;
      const plannedMs = plannedByOrder.get(id);
      if (plannedMs == null) return;
      const contractMs = new Date(res.value.shipmentDate).getTime();
      if (plannedMs > contractMs) conflictIds.add(id);
    });

    deadlineConflictIds.value = conflictIds;
  },
  { immediate: true },
);

function handleRowClick(row: GanttChartRow, event: MouseEvent) {
  const orderId = row.clientOrderId ?? extractOrderIdFromRow(row);
  if (!orderId) return;

  selectedClientOrderId.value = orderId;
  selectedOrderName.value = row.clientOrderName ?? row.name;
  menuTarget.value = event.currentTarget as Element;
  modalKey.value += 1;
  isModalOpen.value = true;
}

/**
 * Извлечь ID заказа из строки, если clientOrderId не доступен.
 * row.id имеет формат: client_order_row_${orderId}
 */
function extractOrderIdFromRow(row: GanttChartRow): string | null {
  const prefix = 'client_order_row_';
  if (row.id.startsWith(prefix)) {
    return row.id.slice(prefix.length);
  }
  return null;
}
</script>

<style scoped lang="scss">
.orders-tab {
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
