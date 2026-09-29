<template>
  <div class="order-info-tab">
    <!-- Режим редактирования -->
    <template v-if="isEditing">
      <OrderForm
        :production-unit-id="order.p_id"
        :order="order"
        mode="edit"
        :show-actions="true"
        @updated="onOrderUpdated"
        @close="editModeStop"
      />
    </template>

    <!-- Режим просмотра -->
    <template v-else>
      <div class="order-info-tab__header">
        <div class="order-info-tab__section-title">Основная информация</div>
        <q-btn
          icon="edit"
          flat
          dense
          round
          color="primary"
          @click="editModeStart"
        >
          <q-tooltip>Редактировать</q-tooltip>
        </q-btn>
      </div>

      <div class="order-info-tab__section">
        <div class="order-info-tab__grid">
          <div class="order-info-tab__field">
            <div class="order-info-tab__label">Название заказа</div>
            <div class="order-info-tab__value">{{ order.name }}</div>
          </div>

          <div class="order-info-tab__field">
            <div class="order-info-tab__label">Тип заказа</div>
            <div class="order-info-tab__value">
              <q-chip
                :color="order.type === 'client' ? 'primary' : 'secondary'"
                text-color="white"
                dense
              >
                {{ order.type === 'client' ? 'Клиентский' : 'Производственный' }}
              </q-chip>
            </div>
          </div>

          <div class="order-info-tab__field">
            <div class="order-info-tab__label">Дата заказа</div>
            <div class="order-info-tab__value">{{ formatDate(order.orderDate) }}</div>
          </div>

          <div v-if="order.shipmentDate" class="order-info-tab__field">
            <div class="order-info-tab__label">Дата отгрузки</div>
            <div class="order-info-tab__value">{{ formatDate(order.shipmentDate) }}</div>
          </div>

          <div class="order-info-tab__field">
            <div class="order-info-tab__label">Дата создания</div>
            <div class="order-info-tab__value">{{ formatDate(order.createdAt) }}</div>
          </div>

          <div class="order-info-tab__field">
            <div class="order-info-tab__label">Дата обновления</div>
            <div class="order-info-tab__value">{{ formatDate(order.updatedAt) }}</div>
          </div>
        </div>
      </div>

      <q-separator class="q-my-md" />

      <div class="order-info-tab__section">
        <div class="order-info-tab__section-title">Заказ на материалы:</div>
        <div v-if="order.materials && order.materials.length > 0" class="order-info-tab__materials">
          <q-list bordered separator>
            <q-item v-for="(material, index) in order.materials" :key="index">
              <q-item-section>
                <q-item-label>{{ getMaterialName(material) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                Количество: {{ material.quantity }} {{ getMeasureLabel(getMaterialMeasure(material)) }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="order-info-tab__empty">
          <q-icon name="inventory_2" size="48px" color="grey-5" />
          <div class="text-grey-6 q-mt-sm">Материалы не добавлены</div>
        </div>
      </div>

      <template v-if="order.type === 'client' && order.productionOrders">
        <q-separator class="q-my-md" />
        <div class="order-info-tab__section">
          <ProductionOrdersList
            :production-orders="order.productionOrders"
            :format-date="formatDate"
            @order-click="onProductionOrderClick"
          />
        </div>
      </template>

      <template v-if="order.description">
        <q-separator class="q-my-md" />
        <div class="order-info-tab__section">
          <div class="order-info-tab__section-title">Описание</div>
          <div class="order-info-tab__description">{{ order.description }}</div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { OrderListItem } from 'src/entities/order';
import { materialApi, type MaterialListItem } from 'src/entities/material';
import { OrderForm } from 'src/widgets';
import ProductionOrdersList from './ProductionOrdersList.vue';
import { getMeasureLabel } from 'src/shared/utils';

interface Props {
  order: OrderListItem;
  formatDate: (date?: string | Date) => string;
}

interface Emits {
  (e: 'updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const materialsCache = ref<Map<string, MaterialListItem>>(new Map());

// Получаем название материала из materialData или кеша
function getMaterialName(material: unknown): string {
  // Если это объект с materialData
  if (material && typeof material === 'object') {
    const matObj = material as Record<string, unknown>;

    // Пытаемся получить из materialData (новая структура)
    if (matObj.materialData && typeof matObj.materialData === 'object') {
      const matData = matObj.materialData as Record<string, unknown>;
      if (typeof matData.name === 'string') {
        return matData.name;
      }
    }

    // Если materialId это строка, ищем в кеше
    if (typeof matObj.materialId === 'string') {
      const cached = materialsCache.value.get(matObj.materialId);
      if (cached?.name) {
        return cached.name;
      }
      return 'Загружается...';
    }
  }

  return 'Неизвестный материал';
}

// Получаем единицу измерения материала
function getMaterialMeasure(material: unknown): string | undefined {
  if (material && typeof material === 'object') {
    const matObj = material as Record<string, unknown>;

    // Пытаемся получить из materialData (новая структура)
    if (matObj.materialData && typeof matObj.materialData === 'object') {
      const matData = matObj.materialData as Record<string, unknown>;
      if (typeof matData.measure === 'string') {
        return matData.measure;
      }
    }

    // Если materialId это строка, ищем в кеше
    if (typeof matObj.materialId === 'string') {
      const cached = materialsCache.value.get(matObj.materialId);
      if (cached?.measure) {
        return cached.measure;
      }
    }
  }

  return undefined;
}
/*
// Получаем ID материала
function getMaterialId(material: unknown): string | null {
  if (material && typeof material === 'object') {
    const matObj = material as Record<string, unknown>;
    if (typeof matObj.materialId === 'string') {
      return matObj.materialId;
    }
  }
  return null;
}*/

function editModeStart(): void {
  isEditing.value = true;
}

function editModeStop(): void {
  isEditing.value = false;
}

function onOrderUpdated(): void {
  isEditing.value = false;
  emit('updated');
}

// Обработка клика по производственному заказу
function onProductionOrderClick(orderId: string): void {
  // TODO: Добавить навигацию к производственному заказу
  console.log('Production order clicked:', orderId);
}

// Загружаем информацию о материалах (если она не содержится в materialData)
async function loadMaterialsInfo(): Promise<void> {
  if (!props.order.materials || props.order.materials.length === 0) return;

  try {
    // Собираем ID материалов, которые не содержат materialData
    const materialIds: string[] = [];
    props.order.materials.forEach((m) => {
      if (m && typeof m === 'object') {
        const matObj = m as Record<string, unknown>;
        // Если нет materialData, добавляем ID в очередь загрузки
        if (!matObj.materialData && typeof matObj.materialId === 'string') {
          materialIds.push(matObj.materialId);
        }
      }
    });

    const uniqueIds = [...new Set(materialIds)];

    // Загружаем материалы параллельно для скорости
    const promises = uniqueIds.map(async (id) => {
      try {
        const material = await materialApi.getById(id);
        if (material) {
          materialsCache.value.set(id, material);
        }
      } catch (error) {
        console.error(`Failed to load material ${id}:`, error);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to load materials info:', error);
  }
}

onMounted(() => {
  void loadMaterialsInfo();
});

// Следим за изменением заказа и перезагружаем информацию о материалах
watch(
  () => props.order,
  () => {
    void loadMaterialsInfo();
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.order-info-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: 14px;
    color: #1a1a1a;
  }

  &__materials {
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

  &__description {
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    white-space: pre-wrap;
  }
}
</style>
