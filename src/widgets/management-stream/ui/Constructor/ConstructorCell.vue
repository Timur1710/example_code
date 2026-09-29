<template>
  <div
    ref="cellRef"
    class="constructor-cell"
    :class="{ 'constructor-cell--dragging': isDragging }"
    :style="cellStyle"
    :id="operation._id"
    @mousedown="handleMouseDown"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @contextmenu.prevent="handleContextMenu"
  >
      <!-- Точки подключения -->
      <div
        v-for="pointIndex in ([0, 1, 2, 3] as const)"
        :key="`point-${pointIndex}`"
        class="constructor-cell__point"
        :class="`constructor-cell__point--${pointIndex}`"
        :style="pointStyle(pointIndex)"
        :data-point="pointIndex"
        :data-parent="operation._id"
        @mousedown.stop="handlePointMouseDown($event, pointIndex)"
        @mouseup.stop="handlePointMouseUp($event, pointIndex)"
        v-show="showPoint(pointIndex)"
      />

    <!-- Контент ячейки -->
    <div class="constructor-cell__content" @dblclick="handleDblClick">
      <!-- ID операции -->
      <div class="constructor-cell__id" @click.stop="$emit('openDetails')">
        {{ operation._id.slice(-5) }}
      </div>

      <!-- Иконка -->
      <div class="constructor-cell__icon">
        <q-icon
          v-if="operationName"
          :name="getIcon"
          size="32px"
          color="primary"
        />
        <q-icon
          v-else
          name="help"
          size="32px"
          color="grey-6"
        />
      </div>

      <!-- Название операции -->
      <div class="constructor-cell__name">
        <span :class="{ 'text-negative': !operationName }">
          {{ operationName || 'Операция отсутствует' }}
        </span>
        <q-tooltip v-if="operationName && operationName.length > 20">
          {{ operationName }}
        </q-tooltip>
      </div>
    </div>

    <!-- Контекстное меню -->
    <q-menu
      v-model="showContextMenu"
      :target="menuTarget"
      context-menu
      touch-position
      no-parent-event
    >
      <q-list dense style="min-width: 150px">
        <q-item
          v-if="edit && operation.type === 'operation'"
          clickable
          v-close-popup
          @click="handleOpenOperationDetails"
        >
          <q-item-section avatar>
            <q-icon name="open_in_new" color="primary" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Перейти к операции</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="edit && operation.type === 'operation'"
          clickable
          v-close-popup
          @click="handleEdit"
        >
          <q-item-section avatar>
            <q-icon name="sym_o_change_circle" color="primary" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Заменить операцию</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="edit"
          clickable
          v-close-popup
          @click="handleDelete"
        >
          <q-item-section avatar>
            <q-icon name="delete" color="negative" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('delete') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- Диалог выбора операции -->
    <q-dialog v-model="showOperationDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <SingleSelectionTemplate
            :items="operationItems"
            :selected-item="selectedOperationId"
            :pagination="operationPagination"
            :loading="isLoadingOperations"
            :search-loading="isSearchingOperations"
            :search-error="operationSearchError"
            :search-placeholder="$t('management_stream.search_operation_placeholder')"
            :select-button-text="$t('management_stream.select_operation')"
            :title="$t('management_stream.select_operation_title')"
            @search="handleOperationSearch"
            @pagination="handleOperationPagination"
            @select="handleOperationSelect"
            @reset="handleOperationReset"
            @confirm="handleOperationConfirm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="primary" @click="cancelOperationSelection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { SingleSelectionTemplate } from 'src/shared/templates';
import { useOperationStore, type OperationListItem } from 'src/entities/operation';
import type { ConstructorOperation, PointIndex } from '../../lib/constructor';
import type { 
  PaginationParams,
  SelectionItem,
} from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  operation: ConstructorOperation;
  names: Record<string, Array<{ label: string; value: string }>>;
  activePoint?: { index: number | string; point: PointIndex | string };
  edit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  edit: true,
  activePoint: () => ({ index: '', point: '' }),
});

const emit = defineEmits<{
  delete: [];
  openDetails: [];
  dblclick: [];
  pointMouseDown: [event: MouseEvent, pointIndex: PointIndex];
  pointMouseUp: [event: MouseEvent, pointIndex: PointIndex];
  mousedown: [event: MouseEvent];
  updateOperation: [operationId: string];
}>();

const { t } = useI18n();
const operationStore = useOperationStore();
const router = useRouter();

const isDragging = ref(false);
const isHovered = ref(false);
const showContextMenu = ref(false);
const cellRef = ref<HTMLElement>();

const menuTarget = computed(() => cellRef.value || false);

// === Operation Selection State ===
const showOperationDialog = ref(false);
const selectedOperationId = ref<string | null>(null);
const isLoadingOperations = ref(false);
const isSearchingOperations = ref(false);
const operationSearchError = ref<string | null>(null);
const operationPagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  pagesNumber: 0,
  sortBy: 'name',
  descending: false,
});

// Преобразуем операции в формат SelectionItem
const operationItems = computed(() => {
  return operationStore.operations.map((op: OperationListItem) => ({
    _id: op._id,
    name: op.name,
    description: op.description || '',
  }));
});

const ITEM_SIZE = 100;
const ITEM_MARGIN = 15;

const cellStyle = computed(() => {
  const [col, row] = props.operation.position;
  return {
    left: `${col * ITEM_SIZE + ITEM_MARGIN * 2 * col}px`,
    top: `${row * ITEM_SIZE + ITEM_MARGIN * 2 * row}px`,
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
  };
});

const operationName = computed(() => {
  const { type, o_id, s_id, status } = props.operation;

  if (type === 'order') {
    const orderName = props.names.order?.find((o) => o.value === status);
    return orderName?.label || status;
  }

  if (type === 'operation') {
    const opName = props.names.operation?.find((o) => o.value === o_id);
    return opName?.label || o_id;
  }

  if (type === 'template') {
    const templateName = props.names.template?.find((t) => t.value === s_id);
    return templateName?.label || s_id;
  }

  return '';
});

const getIcon = computed(() => {
  const iconMap: Record<string, string> = {
    order: 'receipt_long',
    operation: 'settings',
    template: 'description',
    start: 'play_circle',
  };
  return iconMap[props.operation.type] || 'help';
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showPoint(_pointIndex: PointIndex): boolean {
  if (!props.edit) return false;

  // Показываем точки подключения при наведении на ячейку или во время создания связи
  const isCreatingRelation = props.activePoint?.index !== '';
  return isHovered.value || isCreatingRelation;
}

function pointStyle(pointIndex: PointIndex) {
  const positions: Record<PointIndex, Record<string, string>> = {
    0: { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
    1: { right: '-6px', top: '50%', transform: 'translateY(-50%)' },
    2: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
    3: { left: '-6px', top: '50%', transform: 'translateY(-50%)' },
  };

  return positions[pointIndex];
}

function handlePointMouseDown(event: MouseEvent, pointIndex: PointIndex) {
  emit('pointMouseDown', event, pointIndex);
}

function handlePointMouseUp(event: MouseEvent, pointIndex: PointIndex) {
  emit('pointMouseUp', event, pointIndex);
}

function handleMouseDown(event: MouseEvent) {
  // Обрабатываем только левую кнопку мыши (button === 0)
  if (event.button !== 0) return;
  
  isDragging.value = true;
  emit('mousedown', event);

  const handleMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mouseup', handleMouseUp);
}

function handleDblClick() {
  emit('dblclick');
}

function handleContextMenu(event: MouseEvent) {
  if (!props.edit) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Открываем меню
  showContextMenu.value = true;
}

function handleDelete() {
  emit('delete');
}

function handleEdit() {
  if (props.operation.type !== 'operation') return;
  
  // Устанавливаем текущую операцию как выбранную (обратная совместимость)
  selectedOperationId.value = props.operation.o_id || null;
  
  // Открываем диалог
  showOperationDialog.value = true;
  void loadOperations();
}

function handleOpenOperationDetails() {
  if (props.operation.type !== 'operation' || !props.operation.o_id) return;

  const route = router.resolve({
    name: 'operation-details',
    params: { id: props.operation.o_id },
  });

  window.open(route.href, '_blank');
}

// === Operation Selection Methods ===

/**
 * Загрузить список операций
 */
async function loadOperations(params?: Partial<PaginationParams>) {
  isLoadingOperations.value = true;
  operationSearchError.value = null;

  try {
    const response = await operationStore.fetchAll({
      page: params?.page || operationPagination.value.page,
      rowsPerPage: params?.rowsPerPage || operationPagination.value.rowsPerPage,
      sortBy: params?.sortBy || operationPagination.value.sortBy,
      descending: params?.descending ?? operationPagination.value.descending,
      search: params?.search || '',
    });

    operationPagination.value = {
      ...operationPagination.value,
      ...response.pagination,
    };
  } catch (error) {
    operationSearchError.value = 'Ошибка загрузки операций';
    console.error('Failed to load operations:', error);
  } finally {
    isLoadingOperations.value = false;
  }
}

/**
 * Обработка поиска операций
 */
async function handleOperationSearch(query: string) {
  isSearchingOperations.value = true;
  await loadOperations({ search: query, page: 1 });
  isSearchingOperations.value = false;
}

/**
 * Обработка пагинации операций
 */
async function handleOperationPagination(params: Omit<PaginationParams, 'filter'>) {
  await loadOperations(params);
}

/**
 * Обработка выбора операции
 */
function handleOperationSelect(item: SelectionItem) {
  selectedOperationId.value = item._id;
}

/**
 * Сброс выбора операции
 */
function handleOperationReset() {
  // При сбросе возвращаемся к исходной операции (обратная совместимость)
  selectedOperationId.value = props.operation.o_id || null;
}

/**
 * Подтверждение выбора операции
 */
function handleOperationConfirm(operationId: string | null) {
  if (!operationId) {
    showOperationDialog.value = false;
    return;
  }

  // Emit событие обновления операции
  emit('updateOperation', operationId);

  // Закрываем диалог и сбрасываем состояние
  showOperationDialog.value = false;
  selectedOperationId.value = null;
}

/**
 * Отмена выбора операции
 */
function cancelOperationSelection() {
  showOperationDialog.value = false;
  selectedOperationId.value = null;
}

// Следим за изменением операции и обновляем выбранную операцию при открытии диалога
watch(showOperationDialog, (isOpen) => {
  if (isOpen && props.operation.type === 'operation') {
    selectedOperationId.value = props.operation.o_id || null;
  }
});
</script>

<style lang="scss" scoped>
.constructor-cell {
  position: absolute;
  border: 2px solid #1976d2;
  border-radius: 8px;
  background: #fff;
  cursor: grab;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }

  &--dragging {
    cursor: grabbing;
    opacity: 0.8;
    z-index: 100;
  }

  &__point {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #1976d2;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    transition: transform 0.2s ease;
    color: white;
    transform-origin: center;

    &--0:hover {
      transform: translateX(-50%) scale(1.4);
    }

    &--1:hover {
      transform: translateY(-50%) scale(1.4);
    }

    &--2:hover {
      transform: translateX(-50%) scale(1.4);
    }

    &--3:hover {
      transform: translateY(-50%) scale(1.4);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 8px;
    gap: 4px;
  }

  &__id {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 10px;
    color: #666;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px 4px;
    border-radius: 3px;

  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: 11px;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
