<template>
  <div class="stream-resources">
    <div v-if="loading" class="stream-resources__loading">
      <q-spinner color="primary" size="3em" />
      <div class="stream-resources__loading-text">Загрузка ресурсов...</div>
    </div>

    <div v-else-if="error" class="stream-resources__error">
      <q-icon name="error_outline" size="3em" color="negative" />
      <div class="stream-resources__error-text">{{ error }}</div>
      <q-btn
        label="Повторить"
        color="primary"
        @click="loadResources"
      />
    </div>

    <div v-else-if="resources.length === 0" class="stream-resources__empty">
      <q-icon name="inventory_2" size="3em" color="grey-6" />
      <div class="stream-resources__empty-text">Ресурсы не найдены</div>
    </div>

    <div v-else class="stream-resources__content">
      <div class="stream-resources__list">
        <div
          v-for="operation in groupedResources"
          :key="operation.operation_id"
          class="stream-resources__operation"
        >
          <div class="stream-resources__operation-header">
            <q-icon name="settings" size="20px" color="primary" class="q-mr-sm" />
            <div class="stream-resources__operation-title">{{ operation.operation_name }}</div>
          </div>
          <div class="stream-resources__operation-resources">
            <div
              v-for="(item, index) in operation.resources"
              :key="index"
              class="stream-resources__item"
              :class="{ 'stream-resources__item--clickable': isResourceClickable(item) }"
              @click="handleResourceClick(item)"
            >
              <div class="stream-resources__item-header">
                <div class="stream-resources__item-title">
                  {{ item.resource.name }} - {{ formatQuantity(getMaterialQuantityConsumed(item)!) }} {{ getMeasureTranslation(getMaterialMeasure(item)) }}
                </div>
                <q-chip
                  :label="getResourceTypeLabel(item.resource.type)"
                  :color="getResourceTypeColor(item.resource.type)"
                  text-color="white"
                  size="sm"
                />
              </div>
              <div class="stream-resources__item-info">
                <div v-if="hasCondition(item.resource.condition)" class="stream-resources__item-field">
                  <span class="stream-resources__field-label">Условия:</span>
                  <span class="stream-resources__field-value">
                    {{ formatCondition(item.resource.condition) }}
                  </span>
                </div>
                <div
                  v-if="item.resource.type === 'material' && getMaterialQuantityConsumed(item)"
                  class="stream-resources__item-field"
                >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  streamApi,
  type GetStreamResourcesResponse,
  type StreamResourceConditionDto,
  type StreamResourceItemDto,
} from 'src/entities/stream';

interface StreamResourcesProps {
  /** ID потока */
  streamId: string | null;
}

interface GroupedOperation {
  operation_id: string;
  operation_name: string;
  resources: StreamResourceItemDto[];
}

const props = defineProps<StreamResourcesProps>();
const { t } = useI18n();
const router = useRouter();

const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const resources = ref<GetStreamResourcesResponse>([]);

async function loadResources(): Promise<void> {
  if (!props.streamId) {
    resources.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await streamApi.getResources(props.streamId);
    resources.value = data;
  } catch (e) {
    console.error('Failed to load stream resources:', e);
    error.value = 'Не удалось загрузить ресурсы потока';
    resources.value = [];
  } finally {
    loading.value = false;
  }
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    material: 'Материал',
    worker: 'Работник',
    equipments: 'Оборудование',
    directory: 'Справочник',
  };
  return labels[type] || type;
}

function getResourceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    material: 'blue',
    worker: 'green',
    equipments: 'orange',
    directory: 'purple',
  };
  return colors[type] || 'grey';
}

/**
 * Группировка ресурсов по операциям
 */
const groupedResources = computed<GroupedOperation[]>(() => {
  const groups = new Map<string, GroupedOperation>();

  resources.value.forEach((item) => {
    const key = item.operation_id;
    
    if (!groups.has(key)) {
      groups.set(key, {
        operation_id: item.operation_id,
        operation_name: item.operation_name,
        resources: [],
      });
    }
    
    groups.get(key)!.resources.push(item);
  });

  return Array.from(groups.values());
});

/**
 * Форматировать количество
 */
function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('ru-RU').format(quantity);
}

/**
 * Получить перевод единицы измерения
 */
function getMeasureTranslation(measure?: string): string {
  if (!measure) return '';
  return t(`measurement_units.${measure}`) || measure;
}

/**
 * Получить потребленное количество для материала
 */
function getMaterialQuantityConsumed(item: StreamResourceItemDto): number | null {
  if (item.resource.type !== 'material') return null;
  return item.resource.condition?.material_params?.quantity_consumed ?? null;
}

/**
 * Получить единицу измерения для материала
 */
function getMaterialMeasure(item: StreamResourceItemDto): string | undefined {
  if (item.resource.type !== 'material') return undefined;
  // Сначала проверяем condition.measure, затем details.measure
  return item.resource.condition?.measure || 
         (item.resource.details as { measure?: string } | undefined)?.measure;
}

function formatCondition(condition: StreamResourceConditionDto | undefined): string {
  if (!condition) return '—';
  
  const parts: string[] = [];
  
  if (condition.material_params) {
    const mp = condition.material_params;
    if (mp.quantity_required) parts.push(`Требуется: ${mp.quantity_required}`);
    // quantity_consumed теперь отображается отдельно
    if (mp.waste_percentage) parts.push(`Отходы: ${mp.waste_percentage}%`);
  }
  
  if (condition.worker_params) {
    const wp = condition.worker_params;
    if (wp.worker_count) parts.push(`Работников: ${wp.worker_count}`);
    if (wp.can_multitask) parts.push('Многозадачность');
  }
  
  if (condition.equipment_params) {
    const ep = condition.equipment_params;
    if (ep.setup_time) parts.push(`Настройка: ${ep.setup_time} мин`);
    if (ep.operation_time) parts.push(`Операция: ${ep.operation_time} мин`);
  }
  
  return parts.length > 0 ? parts.join(', ') : '—';
}

/**
 * Проверяет, есть ли непустое условие
 */
function hasCondition(condition: StreamResourceConditionDto | undefined): boolean {
  if (!condition) return false;
  const formatted = formatCondition(condition);
  return formatted !== '—';
}

/**
 * Проверяет, можно ли перейти на страницу деталей ресурса
 */
function isResourceClickable(item: StreamResourceItemDto): boolean {
  const type = item.resource.type;
  return type === 'material' || type === 'worker' || type === 'equipments';
}

/**
 * Обработчик клика на ресурс
 */
function handleResourceClick(item: StreamResourceItemDto): void {
  if (!isResourceClickable(item)) return;
  
  const resourceId = item.resource.r_id;
  const type = item.resource.type;
  
  let routeName: string;
  if (type === 'material') {
    routeName = 'material-details';
  } else if (type === 'worker') {
    routeName = 'worker-details';
  } else if (type === 'equipments') {
    routeName = 'equipment-details';
  } else {
    return;
  }
  
  void router.push({ name: routeName, params: { id: resourceId } });
}

// Загружаем ресурсы при монтировании и при изменении streamId
onMounted(() => {
  void loadResources();
});

watch(
  () => props.streamId,
  () => {
    void loadResources();
  }
);
</script>

<style scoped lang="scss">
.stream-resources {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 48px;
    height: 100%;
  }

  &__loading-text,
  &__error-text,
  &__empty-text {
    font-size: 16px;
    color: #7a7a7a;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 400px;
  }

  &__operation {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e0e0e0;
  }

  &__operation-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e0e0e0;
  }

  &__operation-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
    flex: 1;
  }

  &__operation-resources {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &--clickable {
      cursor: pointer;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
      }
    }
  }

  &__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__item-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item-field {
    display: flex;
    gap: 8px;
    font-size: 14px;
  }

  &__field-label {
    color: #7a7a7a;
    font-weight: 500;
  }

  &__field-value {
    color: #1f1f1f;
  }

  &__quantity-consumed {
    font-weight: 500;
    color: #1976d2;
  }
}
</style>

