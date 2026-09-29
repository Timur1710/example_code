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
    <q-card v-if="operation" class="operation-info-modal">
      <q-card-section class="operation-info-modal__header">
        <div class="text-h6">{{ operation.operationName }}</div>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="handleClose"
          class="operation-info-modal__close-btn"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="operation-info-modal__content">
        <!-- Баннер: операция не обеспечена -->
        <div
          v-if="operation.not_provided"
          class="operation-info-modal__not-provided-banner"
        >
          <q-icon name="warning" size="20px" color="negative" />
          <div class="operation-info-modal__not-provided-text">
            <span class="operation-info-modal__not-provided-title">
              {{ t('operation_details.not_provided') }}
            </span>
            <div
              v-if="operation.missingMaterials && operation.missingMaterials.length > 0"
              class="operation-info-modal__not-provided-materials"
            >
              <span
                v-for="mat in operation.missingMaterials"
                :key="mat.materialId"
                class="operation-info-modal__not-provided-material"
              >
                {{ mat.materialName }}: −{{ mat.missing }}
              </span>
            </div>
          </div>
        </div>

        <!-- Основная информация -->
        <div class="operation-info-modal__info">
          <div class="operation-info-modal__info-row">
            <span class="operation-info-modal__label">{{
              t('operation_details.duration')
            }}</span>
            <span class="operation-info-modal__value">{{ formatDuration(operation.duration) }}</span>
          </div>

          <div class="operation-info-modal__info-row">
            <span class="operation-info-modal__label">{{ t('operation_details.start_time') }}</span>
            <span class="operation-info-modal__value">{{ formatDateTime(operation.startTime) }}</span>
          </div>

          <div class="operation-info-modal__info-row">
            <span class="operation-info-modal__label">{{ t('operation_details.end_time') }}</span>
            <span class="operation-info-modal__value">{{ formatDateTime(operation.endTime) }}</span>
          </div>

          <div
            v-if="operation.description"
            class="operation-info-modal__info-row operation-info-modal__info-row--full"
          >
            <span class="operation-info-modal__label">{{ t('operation_details.description') }}</span>
            <span class="operation-info-modal__value">{{ operation.description }}</span>
          </div>
        </div>

        <!-- Всего потреблено по операции -->
        <div
          v-if="totalConsumedMaterials.length > 0"
          class="operation-info-modal__total-consumed"
        >
          <div class="text-subtitle1 q-mb-md">{{ t('operation_details.total_consumed') }}</div>
          <div class="operation-info-modal__total-consumed-list">
            <div
              v-for="mat in totalConsumedMaterials"
              :key="mat.materialId"
              class="operation-info-modal__total-consumed-item"
            >
              <q-icon name="arrow_downward" size="18px" color="orange-8" />
              <span class="operation-info-modal__total-consumed-name">{{ mat.materialName }}</span>
              <span class="operation-info-modal__total-consumed-qty">−{{ mat.quantity }} {{ t('operation_details.pcs') }}</span>
            </div>
          </div>
        </div>

        <!-- Всего произведено по операции -->
        <div
          v-if="totalProducedMaterials.length > 0"
          class="operation-info-modal__total-produced"
        >
          <div class="text-subtitle1 q-mb-md">{{ t('operation_details.total_produced') }}</div>
          <div class="operation-info-modal__total-produced-list">
            <div
              v-for="mat in totalProducedMaterials"
              :key="mat.materialId"
              class="operation-info-modal__total-produced-item"
            >
              <q-icon name="inventory_2" size="18px" color="green-7" />
              <span class="operation-info-modal__total-produced-name">{{ mat.materialName }}</span>
              <span class="operation-info-modal__total-produced-qty">{{ mat.quantity }} {{ t('operation_details.pcs') }}</span>
            </div>
          </div>
        </div>

        <!-- Ресурсы -->
        <div v-if="resourcesGrouped && hasResources" class="operation-info-modal__resources">
          <div class="text-subtitle1 q-mb-md">{{ t('operation_details.resources') }}</div>

          <!-- Оборудование -->
          <div v-if="resourcesGrouped.equipments.length > 0" class="operation-info-modal__resource-group">
            <div class="operation-info-modal__resource-group-title">
              <q-icon name="precision_manufacturing" size="20px" />
              {{ t('operation_details.equipment') }}
            </div>
            <q-list dense bordered class="operation-info-modal__resource-list">
              <q-item v-for="resource in resourcesGrouped.equipments" :key="resource.id">
                <q-item-section>
                  <q-item-label>{{ resource.name }}</q-item-label>
                  <q-item-label caption v-if="resource.amount">
                    {{ t('operation_details.amount') }}: {{ resource.amount }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Сотрудники -->
          <div v-if="resourcesGrouped.workers.length > 0" class="operation-info-modal__resource-group">
            <div class="operation-info-modal__resource-group-title">
              <q-icon name="person" size="20px" />
              {{ t('operation_details.workers') }}
            </div>
            <q-list dense bordered class="operation-info-modal__resource-list">
              <q-item v-for="resource in resourcesGrouped.workers" :key="resource.id">
                <q-item-section>
                  <q-item-label>{{ resource.name }}</q-item-label>
                  <q-item-label caption v-if="resource.amount">
                    {{ t('operation_details.amount') }}: {{ resource.amount }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <!-- Сообщение если нет ресурсов -->
        <div v-else class="operation-info-modal__no-resources">
          <q-icon name="info" size="24px" color="grey-6" />
          <span class="text-grey-7">{{ t('operation_details.no_resources') }}</span>
        </div>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PlanOperation, OperationResource } from 'src/stores/planning-selection.store';

const { t } = useI18n();

interface Props {
  /** Открыта ли модалка */
  modelValue: boolean;
  /** Данные операции */
  operation: PlanOperation | null;
  /** Целевой элемент для позиционирования меню */
  menuTarget?: string | Element | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  operation: null,
  menuTarget: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operation = computed(() => props.operation);

/**
 * Всего потреблено по операции (сумма по всем сегментам)
 */
const totalConsumedMaterials = computed(() => {
  const segments = operation.value?.segments;
  if (!segments || segments.length === 0) return [];

  const byMaterial = new Map<string, { materialId: string; materialName: string; quantity: number }>();
  for (const seg of segments) {
    const mats = seg.consumedMaterials ?? [];
    for (const m of mats) {
      const existing = byMaterial.get(m.materialId);
      if (existing) {
        existing.quantity += m.quantity;
      } else {
        byMaterial.set(m.materialId, { ...m });
      }
    }
  }
  return Array.from(byMaterial.values());
});

/**
 * Всего произведено по операции (сумма по всем сегментам)
 */
const totalProducedMaterials = computed(() => {
  const segments = operation.value?.segments;
  if (!segments || segments.length === 0) return [];

  const byMaterial = new Map<string, { materialId: string; materialName: string; quantity: number }>();
  for (const seg of segments) {
    const mats = seg.producedMaterials ?? [];
    for (const m of mats) {
      const existing = byMaterial.get(m.materialId);
      if (existing) {
        existing.quantity += m.quantity;
      } else {
        byMaterial.set(m.materialId, { ...m });
      }
    }
  }
  return Array.from(byMaterial.values());
});

/**
 * Ресурсы, сгруппированные по типам
 */
const resourcesGrouped = computed(() => {
  const resources = operation.value?.resources;
  if (!resources) return null;

  const equipments: OperationResource[] = [];
  const workers: OperationResource[] = [];
  const materials: OperationResource[] = [];

  resources.forEach((resource) => {
    switch (resource.type) {
      case 'equipments':
        equipments.push(resource);
        break;
      case 'worker':
        workers.push(resource);
        break;
      case 'material':
        materials.push(resource);
        break;
      default:
        materials.push(resource);
    }
  });

  return { equipments, workers, materials };
});

/**
 * Есть ли хотя бы один ресурс
 */
const hasResources = computed(() => {
  return (
    operation.value?.resources &&
    operation.value.resources.length > 0
  );
});

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} ${t('minutes_short')}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins > 0) {
    return `${hours} ${t('hours_short')} ${mins} ${t('minutes_short')}`;
  }
  return `${hours} ${t('hours_short')}`;
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function handleClose() {
  isOpen.value = false;
}
</script>

<style lang="scss" scoped>
.operation-info-modal {
  min-width: 500px;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #f5f5f5;
    padding: 12px 16px;
    flex-shrink: 0;
  }

  &__close-btn {
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-height: 0;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
  }

  &__info {
    margin-bottom: 24px;
  }

  &__info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;

    &--full {
      flex-direction: column;
      gap: 4px;
    }

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-weight: 500;
    color: #757575;
    font-size: 14px;
  }

  &__value {
    color: #212121;
    font-size: 14px;
    text-align: right;
  }

  &__resources {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__resource-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__resource-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #424242;
    font-size: 15px;
  }

  &__resource-list {
    border-radius: 8px;
    overflow: hidden;
  }

  &__total-consumed {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #fff3e0;
    border-radius: 8px;
    border: 1px solid #ffe0b2;
  }

  &__total-consumed-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__total-consumed-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  &__total-consumed-name {
    color: #424242;
    flex: 1;
  }

  &__total-consumed-qty {
    font-weight: 600;
    color: #e65100;
  }

  &__total-produced {
    margin-bottom: 24px;
    padding: 12px 16px;
    background: #e8f5e9;
    border-radius: 8px;
    border: 1px solid #c8e6c9;
  }

  &__total-produced-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__total-produced-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  &__total-produced-name {
    color: #424242;
    flex: 1;
  }

  &__total-produced-qty {
    font-weight: 600;
    color: #2e7d32;
  }

  &__no-resources {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
  }

  &__not-provided-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
    background: #fff3e0;
    border: 1px solid #ffb74d;
    border-radius: 8px;
  }

  &__not-provided-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__not-provided-title {
    font-weight: 600;
    font-size: 14px;
    color: #e65100;
  }

  &__not-provided-materials {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__not-provided-material {
    font-size: 12px;
    background: #ffe0b2;
    border-radius: 4px;
    padding: 2px 6px;
    color: #bf360c;
    font-weight: 500;
  }
}
</style>

<style lang="scss">
/* Убираем внешний скролл q-menu — скролл только у контента модалки */
.q-menu:has(.operation-info-modal) {
  overflow: hidden !important;
}
</style>
