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
    <q-card class="operation-details-modal">
      <q-card-section class="operation-details-modal__header">
        <div class="operation-details-modal__title-row">
          <span class="text-h6">{{ operation.operationName }}</span>
          <a
            v-if="operation.operationId"
            :href="operationDetailsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="operation-details-modal__link-icon"
            :title="t('operation_details.open_in_new_tab')"
          >
            <q-icon name="open_in_new" size="20px" />
          </a>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="handleClose"
          class="operation-details-modal__close-btn"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="operation-details-modal__content">
        <!-- Сегмент (один выбранный или список всех) -->
        <div v-if="displayedSegments.length > 0" class="operation-details-modal__segments">
          <div class="text-subtitle1 q-mb-md">
            {{
              selectedSegmentIndex != null
                ? t('operation_details.segment')
                : t('operation_details.segments')
            }}
          </div>
          <div
            v-for="(segment, index) in displayedSegments"
            :key="index"
            class="operation-details-modal__segment-card"
          >
            <template v-if="segment">
              <div class="operation-details-modal__segment-header">
                <span
                  class="operation-details-modal__segment-number"
                  :class="{
                    'operation-details-modal__segment-number--not-provided': segment.not_provided,
                  }"
                  >{{ index + 1 }}</span
                >
                <div class="operation-details-modal__segment-time">
                  <div>
                    {{ formatDateTime(segment.startTime) }} — {{ formatDateTime(segment.endTime) }}
                  </div>
                  <q-badge outline color="primary">
                    {{ formatDuration(segment.durationMinutes) }}
                  </q-badge>
                  <q-badge v-if="segment.not_provided" color="negative" text-color="white">
                    {{ t('operation_details.not_provided_short') }}
                  </q-badge>
                </div>
              </div>
              <!-- Недостающие материалы сегмента -->
              <div
                v-if="segment.missingMaterials && segment.missingMaterials.length > 0"
                class="operation-details-modal__segment-missing"
              >
                <div
                  v-for="mat in segment.missingMaterials"
                  :key="mat.materialId"
                  class="operation-details-modal__segment-missing-item"
                >
                  <q-icon name="remove_circle_outline" size="16px" color="negative" />
                  <span class="operation-details-modal__segment-missing-name">{{
                    mat.materialName
                  }}</span>
                  <span class="operation-details-modal__segment-missing-qty"
                    >−{{ mat.missing }}</span
                  >
                </div>
              </div>
              <!-- Потребляемые материалы сегмента -->
              <div
                v-if="segment.consumedMaterials && segment.consumedMaterials.length > 0"
                class="operation-details-modal__segment-consumed"
              >
                <div class="operation-details-modal__segment-consumed-title">
                  {{ t('operation_details.consumed_materials') }}
                </div>
                <div
                  v-for="mat in segment.consumedMaterials"
                  :key="mat.materialId"
                  class="operation-details-modal__segment-consumed-item"
                >
                  <q-icon name="arrow_downward" size="16px" color="orange-8" />
                  <span class="operation-details-modal__segment-consumed-name">{{
                    mat.materialName
                  }}</span>
                  <span class="operation-details-modal__segment-consumed-qty"
                    >−{{ mat.quantity }} {{ t('operation_details.pcs') }}</span
                  >
                </div>
              </div>
              <!-- Производимые материалы сегмента -->
              <div
                v-if="segment.producedMaterials && segment.producedMaterials.length > 0"
                class="operation-details-modal__segment-materials"
              >
                <div
                  v-for="mat in segment.producedMaterials"
                  :key="mat.materialId"
                  class="operation-details-modal__segment-material"
                >
                  <q-icon name="inventory_2" size="16px" color="green-7" />
                  <span class="operation-details-modal__segment-material-name">{{
                    mat.materialName
                  }}</span>
                  <span class="operation-details-modal__segment-material-qty"
                    >+{{ mat.quantity }} {{ t('operation_details.pcs') }}</span
                  >
                </div>
              </div>
              <!-- Ресурсы сегмента (оборудование, сотрудники) -->
              <!-- Если есть assignedResources — показываем конкретных участников из группы -->
              <div
                v-if="segment.assignedResources && segment.assignedResources.length > 0"
                class="operation-details-modal__segment-resources"
              >
                <div
                  v-for="r in segment.assignedResources.filter(
                    (x) => x.resourceType === 'equipments' || x.resourceType === 'worker'
                  )"
                  :key="`${r.groupId}-${r.resourceId}-${r.resourceType}`"
                  class="operation-details-modal__segment-resource-group"
                >
                  <q-icon
                    v-if="r.resourceType === 'equipments'"
                    name="precision_manufacturing"
                    size="16px"
                  />
                  <q-icon v-else name="person" size="16px" />
                  <span
                    class="operation-details-modal__segment-resource-names"
                    :class="{
                      'operation-details-modal__segment-resource-names--empty-pu':
                        r.emptyProductionUnitGroup === true,
                    }"
                  >
                    {{ r.resourceName }} ({{ getGroupName(r.groupId) }})
                  </span>
                </div>
              </div>
              <!-- Иначе показываем ресурсы операции (прямые, не групповые) -->
              <div
                v-else-if="resourcesGrouped && hasResources"
                class="operation-details-modal__segment-resources"
              >
                <div
                  v-if="resourcesGrouped.equipments.length > 0"
                  class="operation-details-modal__segment-resource-group"
                >
                  <q-icon name="precision_manufacturing" size="16px" />
                  <span class="operation-details-modal__segment-resource-names">
                    {{ resourcesGrouped.equipments.map((r) => r.name).join(', ') }}
                  </span>
                </div>
                <div
                  v-if="resourcesGrouped.workers.length > 0"
                  class="operation-details-modal__segment-resource-group"
                >
                  <q-icon name="person" size="16px" />
                  <span class="operation-details-modal__segment-resource-names">
                    {{ resourcesGrouped.workers.map((r) => r.name).join(', ') }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { PlanOperation, OperationResource } from 'src/stores/planning-selection.store';

const { t } = useI18n();
const router = useRouter();

interface Props {
  /** Открыта ли модалка */
  modelValue: boolean;
  /** Данные операции */
  operation: PlanOperation;
  /** Целевой элемент для позиционирования меню */
  menuTarget?: string | Element | boolean;
  /** Индекс сегмента, на который кликнули. Если задан — показываем только этот сегмент */
  selectedSegmentIndex?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  menuTarget: false,
  selectedSegmentIndex: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

/**
 * URL страницы деталей операции для открытия в новой вкладке
 */
const operationDetailsUrl = computed(
  () =>
    router.resolve({ name: 'operation-details', params: { id: props.operation.operationId } }).href
);

/**
 * Карта: groupId → название группы (из operation.resources)
 */
const groupNameMap = computed(() => {
  const map = new Map<string, string>();
  for (const r of props.operation.resources ?? []) {
    map.set(r.id, r.name);
  }
  return map;
});

function getGroupName(groupId: string): string {
  return groupNameMap.value.get(groupId) ?? groupId;
}

/**
 * Ресурсы, сгруппированные по типам
 */
const resourcesGrouped = computed(() => {
  const resources = props.operation.resources;
  if (!resources || resources.length === 0) return null;

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

const hasResources = computed(() => {
  return props.operation.resources && props.operation.resources.length > 0;
});

/**
 * Сегменты для отображения: один выбранный или все
 */
const displayedSegments = computed(() => {
  const segments = props.operation.segments;
  if (!segments || segments.length === 0) return [];

  const idx = props.selectedSegmentIndex;
  if (idx != null && idx >= 0 && idx < segments.length) {
    const seg = segments[idx];
    return seg ? [seg] : [];
  }
  return segments;
});

/**
 * Форматировать длительность
 */
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

/**
 * Форматировать дату и время
 */
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
@import 'src/css/quasar.variables.scss';

.operation-details-modal {
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
    position: relative;
    flex-shrink: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__link-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.54);
    text-decoration: none;
    flex-shrink: 0;
    border-radius: 4px;
    padding: 4px;
    transition: color 0.2s;

    &:hover {
      color: #1976d2;
    }
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

  &__segments {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__segment-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fafafa;
  }

  &__segment-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__segment-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #1976d2;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__segment-time {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #424242;
    flex-wrap: wrap;
  }

  &__segment-consumed {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #ffe0b2;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__segment-consumed-title {
    font-size: 11px;
    font-weight: 500;
    color: #bf360c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  &__segment-consumed-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  &__segment-consumed-name {
    color: #424242;
    flex: 1;
  }

  &__segment-consumed-qty {
    font-weight: 600;
    color: #e65100;
  }

  &__segment-materials {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #c8e6c9;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__segment-material {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  &__segment-material-name {
    color: #424242;
  }

  &__segment-material-qty {
    font-weight: 600;
    color: #2e7d32;
    margin-left: auto;
  }

  /* Номер сегмента — вариант «не обеспечено» */
  &__segment-number--not-provided {
    background: #e53935 !important;
  }

  /* Недостающие материалы внутри сегмента */
  &__segment-missing {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #ffcdd2;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__segment-missing-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }

  &__segment-missing-name {
    color: #424242;
    flex: 1;
  }

  &__segment-missing-qty {
    font-weight: 600;
    color: #c62828;
  }

  &__segment-resources {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__segment-resource-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #424242;
  }

  &__segment-resource-names {
    flex: 1;

    &--empty-pu {
      color: $negative;
      font-weight: 600;
    }
  }
}
</style>

<style lang="scss">
/* Убираем внешний скролл q-menu — скролл только у контента модалки */
.q-menu:has(.operation-details-modal) {
  overflow: hidden !important;
}
</style>
