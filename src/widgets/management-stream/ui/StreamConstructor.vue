<template>
  <div class="stream-constructor" ref="containerRef" :style="containerStyle" @scroll="handleScroll">
    <div
      class="stream-constructor__canvas"
      ref="canvasRef"
      :style="designerStyles"
      :class="{ 'stream-constructor__canvas--disabled': disablePointEvents }"
      @mousedown="handleCanvasMouseDown"
    >
      <!-- Пустые ячейки для создания новых операций -->
      <template v-if="edit">
        <CellEmpty
          v-for="(cell, index) in emptyCells"
          :key="`empty-${index}`"
          :position="cell.position"
          :class-active="cell.classActive"
          @click="handleEmptyCellClick"
        />
      </template>

      <!-- Операции -->
      <ConstructorCell
        v-for="(operation, index) in cells"
        :key="operation._id"
        :operation="operation"
        :names="names"
        :active-point="activePoint"
        :edit="edit"
        :class="{ 'constructor-cell--dragging': draggedCellId === operation._id && isDragging }"
        @delete="handleDeleteCell(operation._id)"
        @update-operation="(operationId) => handleUpdateOperation(operation._id, operationId)"
        @pointMouseDown="(event, pointIndex) => handlePointMouseDown(index, event, pointIndex)"
        @pointMouseUp="(event, pointIndex) => handlePointMouseUp(index, event, pointIndex)"
        @mousedown="handleCellMouseDown(operation._id, $event)"
        @dblclick="handleCellDblClick"
      />

      <!-- Визуальная копия перетаскиваемой ячейки -->
      <div
        v-if="draggedCell && isDragging && dragPosition"
        class="constructor-cell-drag-preview"
        :style="{
          position: 'absolute',
          left: `${dragPosition.x}px`,
          top: `${dragPosition.y}px`,
          pointerEvents: 'none',
          transform: `scale(${designerStyles.zoom})`,
        }"
      >
        <ConstructorCell
          :operation="draggedCell"
          :names="names"
          :active-point="activePoint"
          :edit="false"
          class="constructor-cell-drag-preview__cell"
        />
      </div>

      <!-- Линии связей -->
      <RelationLines
        v-show="drawnRelations.length > 0 && !moveItemStatus"
        :relations="drawnRelations"
        :edit="edit"
        @relationDelete="handleRelationDelete"
      />

      <!-- Временная линия при создании связи -->
      <TemplateRelationLine v-if="showTemplateLine" :coordinates="templateLineCoords" />

      <!-- Слот для комментариев -->
      <slot name="comments" />
    </div>

    <!-- Зум контролы -->
    <div v-if="edit" class="stream-constructor__zoom">
      <q-btn flat dense round icon="remove" size="sm" @click="zoomOut" />
      <q-btn flat dense round icon="add" size="sm" @click="zoomIn" />
    </div>

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
          <q-btn flat :label="$t('cancel')" color="primary" @click="cancelOperationSelection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { Relation, CONSTRUCTOR_CONSTANTS } from '../lib/constructor';
import { CellEmpty, ConstructorCell, RelationLines, TemplateRelationLine } from './Constructor';
import { useConstructor } from '../lib/useConstructor';
import { SingleSelectionTemplate } from 'src/shared/templates';
import { useOperationStore, type OperationListItem } from 'src/entities/operation';
import type {
  ConstructorOperation,
  ConstructorRelation,
  Position,
  PointIndex,
  DrawnRelation,
} from '../lib/constructor';
import type {
  PaginationParams,
  SelectionItem,
} from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  cells: ConstructorOperation[];
  names: Record<string, Array<{ label: string; value: string }>>;
  edit?: boolean;
  streamType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  edit: true,
  streamType: 'stream',
});

const emit = defineEmits<{
  update: [cells: ConstructorOperation[]];
  relationCreated: [relationId: string];
  relationDeleted: [relationId: string];
}>();

// Refs
const containerRef = ref<HTMLElement>();
const canvasRef = ref<HTMLElement>();

// Модель данных
const cellsModel = ref<ConstructorOperation[]>(props.cells);

// === Operation Selection State ===
const operationStore = useOperationStore();
const showOperationDialog = ref(false);
const selectedOperationId = ref<string | null>(null);
const pendingCellId = ref<string | null>(null);
const isLoadingOperations = ref(false);
const isSearchingOperations = ref(false);
const operationSearchError = ref<string | null>(null);
const operationPagination = ref({
  page: 1,
  rowsPerPage: 1000,
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

// Drag & Drop state
const draggedCellId = ref<string | null>(null);
const dragOffset = ref<{ x: number; y: number } | null>(null);
const isDragging = ref(false);
const dragPosition = ref<{ x: number; y: number } | null>(null);
const draggedCell = computed(() => {
  if (!draggedCellId.value) return null;
  return cellsModel.value.find((c) => c._id === draggedCellId.value) || null;
});

// Composable
const {
  drawnRelations,
  moveItemStatus,
  emptyCells,
  templateLineCoords,
  activePoint,
  disablePointEvents,
  designerStyles,
  showTemplateLine,
  getCoords,
  createNewCell,
  deleteCell,
  moveCell,
  startDrawingTempLine,
  stopDrawingTempLine,
  drawAllLines,
  zoomIn,
  zoomOut,
  setMoveItemStatus,
  deleteRelation,
} = useConstructor({
  cells: cellsModel,
  edit: ref(props.edit),
  streamType: ref(props.streamType),
  canvasRef,
});

const countRow = 10;
const countColumn = 24;

// Computed
const containerStyle = computed(() => {
  if (!containerRef.value) return {};

  const rect = containerRef.value.getBoundingClientRect();
  return {
    height: `${window.innerHeight - rect.top - 65}px`,
  };
});

// Methods
function handleScroll() {
  if (canvasRef.value) {
    getCoords(canvasRef.value);
  }
}

function handleEmptyCellClick(position: Position) {
  if (!props.edit) return;

  const cellId = createNewCell(position);
  pendingCellId.value = cellId;

  // Открываем диалог выбора операции
  showOperationDialog.value = true;
  void loadOperations();
}

function handleDeleteCell(cellId: string) {
  deleteCell(cellId);
  emitUpdate();
}

function handleUpdateOperation(cellId: string, operationId: string) {
  // Обновляем ячейку с новой операцией
  cellsModel.value = cellsModel.value.map((cell) => {
    if (cell._id === cellId) {
      return {
        ...cell,
        o_id: operationId,
      };
    }
    return cell;
  });

  emitUpdate();

  // Перерисовываем линии
  void nextTick(() => {
    drawAllLines();
  });
}

function handleCellDblClick() {}

// Состояние для создания связи
const creatingRelation = ref<{
  cellIndex: number;
  pointIndex: PointIndex;
  targetElement: HTMLElement | null;
} | null>(null);

function handlePointMouseDown(cellIndex: number, event: MouseEvent, pointIndex: PointIndex) {
  if (!props.edit) return;
  const cell = cellsModel.value[cellIndex];
  if (!cell) return;

  // Сохраняем информацию о начале создания связи
  creatingRelation.value = {
    cellIndex,
    pointIndex,
    targetElement: event.target as HTMLElement,
  };

  startDrawingTempLine(cellIndex, pointIndex);

  // Создаем временную связь
  const tempRelation: Partial<ConstructorRelation> = {
    firstPointIndex: pointIndex,
    so_id: '',
    startId: cell._id,
  };

  // Добавляем временную связь
  cellsModel.value = cellsModel.value.map((c) => {
    if (c._id === cell._id) {
      return {
        ...c,
        relation: [...c.relation, tempRelation as ConstructorRelation],
      };
    }
    return c;
  });

  // Добавляем глобальный обработчик mouseup для отслеживания завершения связи
  const handleGlobalMouseUp = (e: MouseEvent) => {
    if (!creatingRelation.value) {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      return;
    }

    const target = e.target as HTMLElement;

    // Проверяем, кликнули ли на точку подключения другой ячейки
    // Проверяем как саму точку, так и её дочерние элементы (иконка)
    const pointElement = target.closest('.constructor-cell__point');

    if (pointElement) {
      const targetParent = pointElement.closest('.constructor-cell');
      if (targetParent) {
        const targetCellId = targetParent.id || pointElement.getAttribute('data-parent');
        const targetPointIndex = parseInt(
          pointElement.getAttribute('data-point') || '0'
        ) as PointIndex;

        if (targetCellId) {
          // Находим индекс целевой ячейки
          const targetCellIndex = cellsModel.value.findIndex((c) => c._id === targetCellId);

          if (targetCellIndex !== -1 && targetCellIndex !== creatingRelation.value.cellIndex) {
            // Подключаем связь к целевой ячейке
            handlePointMouseUp(targetCellIndex, e, targetPointIndex);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            return;
          }
        }
      }
    }

    // Если кликнули не на точку, удаляем временную связь
    cancelRelationCreation();
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  document.addEventListener('mouseup', handleGlobalMouseUp);
}

function handlePointMouseUp(
  targetCellIndex: number,
  event: MouseEvent,
  targetPointIndex: PointIndex
) {
  if (!creatingRelation.value || !props.edit) return;

  const sourceCell = cellsModel.value[creatingRelation.value.cellIndex];
  const targetCell = cellsModel.value[targetCellIndex];

  if (!sourceCell || !targetCell) {
    cancelRelationCreation();
    return;
  }

  // Проверяем, не пытаемся ли подключиться к той же ячейке
  if (sourceCell._id === targetCell._id) {
    cancelRelationCreation();
    return;
  }

  // Находим последнюю временную связь
  const lastRelationIndex = sourceCell.relation.length - 1;
  const tempRelation = sourceCell.relation[lastRelationIndex];

  if (!tempRelation) {
    cancelRelationCreation();
    return;
  }

  // Проверяем, что это временная связь (so_id пустой или равен startId)
  if (tempRelation.so_id && tempRelation.so_id !== '') {
    // Если связь уже имеет so_id, возможно она уже создана
    // Проверяем, не является ли это попыткой создать дубликат
    const existingRelation = sourceCell.relation.find(
      (rel) =>
        rel.so_id === targetCell._id &&
        rel.firstPointIndex === tempRelation.firstPointIndex &&
        rel.secondPointIndex === targetPointIndex
    );
    if (existingRelation && existingRelation._id) {
      // Связь уже существует
      cancelRelationCreation();
      return;
    }
  }

  // Создаем временную связь через Relation.createTmp
  Relation.createTmp(
    tempRelation as Partial<ConstructorRelation>,
    sourceCell._id,
    targetPointIndex,
    targetCell._id
  );

  // Проверяем, не является ли это обратной связью
  const isReverse = checkReverseRelation(
    tempRelation.firstPointIndex,
    targetPointIndex,
    targetCell._id
  );

  if (isReverse) {
    // Удаляем связь, если это обратная
    cancelRelationCreation();
  } else {
    // Создаем постоянную связь с ID
    Relation.create(tempRelation as Partial<ConstructorRelation>, {
      result: 'ok',
      function: [],
      condition: [],
      condition_operator: 'AND',
      default: false,
    });

    // Обновляем массив связей (tempRelation уже изменен через createTmp и create)
    // Создаем новый массив для правильной реактивности
    const updatedCells = cellsModel.value.map((c) => {
      if (c._id === sourceCell._id) {
        // Создаем новый массив связей с обновленной связью
        const updatedRelations = c.relation.map((rel, idx) => {
          if (idx === lastRelationIndex) {
            return { ...tempRelation } as ConstructorRelation;
          }
          return rel;
        });
        return {
          ...c,
          relation: updatedRelations,
        };
      }
      return c;
    });

    cellsModel.value = updatedCells;

    stopDrawingTempLine();

    // Перерисовываем линии после создания связи
    // Используем двойной nextTick чтобы убедиться, что все обновления применены
    void nextTick(() => {
      void nextTick(() => {
        // Явно вызываем drawAllLines, так как watcher может не сработать сразу
        drawAllLines();
        emitUpdate();
      });
    });
  }

  creatingRelation.value = null;
}

function cancelRelationCreation() {
  if (!creatingRelation.value) return;

  const sourceCell = cellsModel.value[creatingRelation.value.cellIndex];
  if (sourceCell) {
    // Удаляем последнюю временную связь
    cellsModel.value = cellsModel.value.map((c) => {
      if (c._id === sourceCell._id) {
        return {
          ...c,
          relation: c.relation.slice(0, -1),
        };
      }
      return c;
    });
  }

  stopDrawingTempLine();
  creatingRelation.value = null;
}

function checkReverseRelation(
  firstPoint: PointIndex,
  secondPoint: PointIndex,
  secondId: string
): boolean {
  if (!creatingRelation.value) return false;

  // Проверяем, есть ли уже обратная связь
  const targetCell = cellsModel.value.find((c) => c._id === secondId);
  if (!targetCell) return false;

  const sourceCell = cellsModel.value[creatingRelation.value.cellIndex];
  if (!sourceCell) return false;

  return targetCell.relation.some((rel) => {
    return (
      rel.firstPointIndex === secondPoint &&
      rel.secondPointIndex === firstPoint &&
      rel.so_id === sourceCell._id
    );
  });
}

function handleCellMouseDown(cellId: string, event: MouseEvent) {
  if (!props.edit) return;

  // Обрабатываем только левую кнопку мыши (button === 0)
  if (event.button !== 0) return;

  // Начинаем перетаскивание
  const cell = cellsModel.value.find((c) => c._id === cellId);
  if (!cell || !canvasRef.value || !containerRef.value) return;

  const cellElement = document.getElementById(cellId);
  if (!cellElement) return;

  const rect = cellElement.getBoundingClientRect();

  // Вычисляем offset от точки клика до левого верхнего угла ячейки
  // В координатах относительно viewport
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  draggedCellId.value = cellId;
  dragOffset.value = {
    x: offsetX,
    y: offsetY,
  };
  isDragging.value = false;
  setMoveItemStatus(true);

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedCellId.value || !dragOffset.value || !canvasRef.value || !containerRef.value)
      return;

    isDragging.value = true;

    // Вычисляем позицию визуальной копии относительно canvas
    const canvasRect = canvasRef.value.getBoundingClientRect();

    // Позиция курсора относительно viewport
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Позиция курсора относительно canvas (без учета scroll)
    const mouseXInCanvas = mouseX - canvasRect.left;
    const mouseYInCanvas = mouseY - canvasRect.top;

    // Позиция левого верхнего угла ячейки относительно canvas
    // (курсор минус offset от точки клика до угла ячейки)
    const cellX = mouseXInCanvas - dragOffset.value.x;
    const cellY = mouseYInCanvas - dragOffset.value.y;

    dragPosition.value = {
      x: cellX,
      y: cellY,
    };

    // Вычисляем новую позицию относительно canvas для сетки
    const cellLeft = dragPosition.value.x;
    const cellTop = dragPosition.value.y;

    // Конвертируем пиксели в координаты сетки
    // Формула: left = col * ITEM_SIZE + ITEM_MARGIN * 2 * col = col * (ITEM_SIZE + ITEM_MARGIN * 2)
    const { ITEM_SIZE, ITEM_MARGIN } = CONSTRUCTOR_CONSTANTS;
    const step = ITEM_SIZE + ITEM_MARGIN * 2;
    const col = Math.round(cellLeft / step);
    const row = Math.round(cellTop / step);

    // Ограничиваем границами сетки
    const maxCol = countColumn - 1;
    const maxRow = countRow - 1;
    const clampedCol = Math.max(0, Math.min(col, maxCol));
    const clampedRow = Math.max(0, Math.min(row, maxRow));

    // Обновляем позицию ячейки
    const newPosition: Position = [clampedCol, clampedRow];

    // Проверяем, изменилась ли позиция
    const currentCell = cellsModel.value.find((c) => c._id === cellId);
    if (!currentCell) return;

    const positionChanged =
      currentCell.position[0] !== newPosition[0] || currentCell.position[1] !== newPosition[1];

    // Проверяем, не занята ли позиция другой ячейкой
    const isPositionOccupied = cellsModel.value.some(
      (c) =>
        c._id !== cellId && c.position[0] === newPosition[0] && c.position[1] === newPosition[1]
    );

    if (!isPositionOccupied && positionChanged) {
      moveCell(cellId, newPosition);
      // Перерисовываем линии после перемещения ячейки
      void nextTick(() => {
        drawAllLines();
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging.value && draggedCellId.value) {
      // Завершаем перетаскивание
      setMoveItemStatus(false);
      // Убеждаемся, что линии перерисованы после завершения перетаскивания
      void nextTick(() => {
        drawAllLines();
        emitUpdate();
      });
    } else {
      // Если был просто клик без перетаскивания, сбрасываем moveItemStatus
      setMoveItemStatus(false);
      emitUpdate();
    }

    draggedCellId.value = null;
    dragOffset.value = null;
    dragPosition.value = null;
    isDragging.value = false;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleCanvasMouseDown(event: MouseEvent) {
  if (event.target === canvasRef.value && props.edit) {
    // Скролл контейнера с зажатием Ctrl или средней кнопкой мыши
    if ((event.button === 0 && event.ctrlKey) || event.button === 1) {
      event.preventDefault();
      const container = containerRef.value;
      if (!container) return;

      const startX = event.pageX + container.scrollLeft;
      const startY = event.pageY + container.scrollTop;

      document.body.style.cursor = 'grabbing';

      const handleMouseMove = (e: MouseEvent) => {
        if (!container) return;
        container.scrollLeft = startX - e.pageX;
        container.scrollTop = startY - e.pageY;
      };

      const handleMouseUp = () => {
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }
}

function handleRelationDelete(relation: DrawnRelation) {
  if (!relation._id) return;

  deleteRelation(relation._id);
  emitUpdate();

  // Перерисовываем линии после удаления
  void nextTick(() => {
    drawAllLines();
  });
}

function emitUpdate() {
  // Устанавливаем флаг, чтобы watcher не переписывал данные
  isInternalUpdate.value = true;
  emit('update', cellsModel.value);

  // Сбрасываем флаг после завершения обновления
  void nextTick(() => {
    // Даем время Vue обработать реактивные обновления
    setTimeout(() => {
      isInternalUpdate.value = false;
    }, 0);
  });
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
  selectedOperationId.value = null;
}

/**
 * Подтверждение выбора операции
 */
function handleOperationConfirm(operationId: string | null) {
  if (!operationId || !pendingCellId.value) {
    showOperationDialog.value = false;
    return;
  }

  // Обновляем ячейку с выбранной операцией
  cellsModel.value = cellsModel.value.map((cell) => {
    if (cell._id === pendingCellId.value) {
      return {
        ...cell,
        o_id: operationId,
      };
    }
    return cell;
  });

  // Закрываем диалог и сбрасываем состояние
  showOperationDialog.value = false;
  selectedOperationId.value = null;
  pendingCellId.value = null;

  // Обновляем данные конструктора
  emitUpdate();

  // Перерисовываем линии
  void nextTick(() => {
    drawAllLines();
  });
}

/**
 * Отмена выбора операции
 */
function cancelOperationSelection() {
  // Удаляем созданную ячейку, если операция не была выбрана
  if (pendingCellId.value) {
    deleteCell(pendingCellId.value);
  }

  showOperationDialog.value = false;
  selectedOperationId.value = null;
  pendingCellId.value = null;

  emitUpdate();
}

// Флаг для предотвращения циклических обновлений
const isInternalUpdate = ref(false);

// Watchers
watch(
  () => props.cells,
  (newCells) => {
    // Игнорируем обновления, если они пришли от нас самих
    if (isInternalUpdate.value) {
      return;
    }

    cellsModel.value = newCells;
    // Перерисовываем линии после обновления данных из props
    void nextTick(() => {
      drawAllLines();
    });
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  if (canvasRef.value) {
    getCoords(canvasRef.value);
  }

  // Обработчики клавиатуры
  if (props.edit) {
    document.addEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
  stopDrawingTempLine();
});

function handleKeyDown(event: KeyboardEvent) {
  // Скролл стрелками
  const container = containerRef.value;
  if (!container) return;

  const step = 50;
  switch (event.key) {
    case 'ArrowUp':
      container.scrollTop -= step;
      break;
    case 'ArrowDown':
      container.scrollTop += step;
      break;
    case 'ArrowLeft':
      container.scrollLeft -= step;
      break;
    case 'ArrowRight':
      container.scrollLeft += step;
      break;
  }
}
</script>

<style lang="scss" scoped>
.stream-constructor {
  position: relative;
  padding: 20px 0 20px 20px;
  overflow: auto;
  background: #fafafa;
  border-radius: 8px;

  &__canvas {
    :deep(.constructor-cell--dragging) {
      opacity: 0.3;
      pointer-events: none;
    }
  }

  .constructor-cell-drag-preview {
    position: absolute;
    z-index: 1000;
    opacity: 0.8;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));

    :deep(.constructor-cell) {
      position: static !important;
      left: auto !important;
      top: auto !important;
      width: 100px !important;
      height: 100px !important;
      margin: 0 !important;
      transform: none !important;
    }
  }

  &__canvas {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 100%;
    min-height: 400px;

    &--disabled {
      :deep(.constructor-cell),
      :deep(.constructor-cell-empty) {
        pointer-events: none;
      }
    }
  }

  &__zoom {
    position: fixed;
    top: 96px;
    right: 16px;
    z-index: 5;
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
  }
}
</style>
