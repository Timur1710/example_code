<template>
  <div class="production-orders-list">
    <div class="production-orders-list__section-title">Производственные заказы</div>

    <div v-if="productionOrders && productionOrders.length > 0" class="production-orders-list__content">
      <q-list bordered separator>
        <q-item
          v-for="(productionOrder, index) in productionOrders"
          :key="getProductionOrderId(productionOrder, index)"
          clickable
          @click="onProductionOrderClick(productionOrder)"
        >
          <q-item-section>
            <q-item-label>{{ getProductionOrderName(productionOrder) }}</q-item-label>
            <q-item-label caption>
              Дата заказа: {{ formatDate(getProductionOrderDate(productionOrder)) }}
            </q-item-label>
            <q-item-label v-if="getProductionOrderShipmentDate(productionOrder)" caption>
              Дата отгрузки: {{ formatDate(getProductionOrderShipmentDate(productionOrder) ?? undefined) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-chip color="secondary" text-color="white" dense>
              Производственный
            </q-chip>
          </q-item-section>

          <q-item-section side>
            <q-icon name="chevron_right" color="grey-6" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-else class="production-orders-list__empty">
      <q-icon name="construction" size="48px" color="grey-5" />
      <div class="text-grey-6 q-mt-sm">Производственные заказы не созданы</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductionOrderItem } from 'src/entities/order';

interface Props {
  productionOrders?: string[] | ProductionOrderItem[];
  formatDate: (date?: string | Date) => string;
}

interface Emits {
  (e: 'order-click', orderId: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// Проверяем, является ли элемент объектом ProductionOrderItem
function isProductionOrderItem(item: string | ProductionOrderItem): item is ProductionOrderItem {
  return typeof item === 'object' && item !== null && '_id' in item;
}

// Получаем ID производственного заказа
function getProductionOrderId(item: string | ProductionOrderItem, index: number): string {
  if (isProductionOrderItem(item)) {
    return item._id;
  }
  return typeof item === 'string' ? item : `production-order-${index}`;
}

// Получаем название производственного заказа
function getProductionOrderName(item: string | ProductionOrderItem): string {
  if (isProductionOrderItem(item)) {
    return item.name || 'Производственный заказ';
  }
  return 'Производственный заказ';
}

// Получаем дату заказа
function getProductionOrderDate(item: string | ProductionOrderItem): string | Date | undefined {
  if (isProductionOrderItem(item)) {
    return item.orderDate;
  }
  return undefined;
}

// Получаем дату отгрузки
function getProductionOrderShipmentDate(item: string | ProductionOrderItem): string | Date | null | undefined {
  if (isProductionOrderItem(item)) {
    return item.shipmentDate;
  }
  return undefined;
}

// Обработка клика по производственному заказу
function onProductionOrderClick(item: string | ProductionOrderItem): void {
  const orderId = isProductionOrderItem(item) ? item._id : item;
  if (orderId) {
    emit('order-click', orderId);
  }
}
</script>

<style scoped lang="scss">
.production-orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  &__content {
    border-radius: 4px;
    overflow: hidden;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    text-align: center;
  }
}
</style>
