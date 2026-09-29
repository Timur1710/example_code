/**
 * Composable для управления конструктором операций
 */

import { ref, computed, watch, nextTick, type Ref } from 'vue';
import { svgPathProperties } from 'svg-path-properties';
import {
  drawLine,
  allItemsRelations,
  getUniqueId,
  Relation,
  type ConstructorOperation,
  type ConstructorRelation,
  type Position,
  type PointIndex,
  type LineCoordinates,
  type DrawnRelation,
  type EmptyCell,
  type ParentCoords,
  type ActivePoint,
  CONSTRUCTOR_CONSTANTS,
} from './constructor';

interface UseConstructorOptions {
  cells: Ref<ConstructorOperation[]>;
  edit?: Ref<boolean>;
  streamType?: Ref<string>;
  canvasRef?: Ref<HTMLElement | undefined>;
}

export function useConstructor(options: UseConstructorOptions) {
  const { cells, canvasRef } = options;

  // === State ===

  const parentCoords = ref<ParentCoords>({ top: 0, left: 0 });
  const drawnRelations = ref<DrawnRelation[]>([]);
  const moveItemStatus = ref(false);
  const emptyCells = ref<EmptyCell[]>([]);
  const countRow = 10;
  const countColumn = 24;

  // Временная линия при создании связи
  const templateLineCoords = ref<LineCoordinates>({
    x1: '',
    y1: '',
    x2: '',
    y2: '',
  });

  const activePoint = ref<ActivePoint>({
    index: '',
    point: '',
  });

  const zoom = ref(1);
  const disablePointEvents = ref(false);

  // === Computed ===

  const designerStyles = computed(() => {
    const mr = 20;
    const { ITEM_SIZE, ITEM_MARGIN } = CONSTRUCTOR_CONSTANTS;

    return {
      zoom: zoom.value,
      width: `${countColumn * ITEM_SIZE + (countColumn - 1) * ITEM_MARGIN * 2 + mr}px`,
      height: `${countRow * ITEM_SIZE + (countRow - 1) * ITEM_MARGIN * 2}px`,
    };
  });

  const showTemplateLine = computed(() => {
    return templateLineCoords.value.x1 !== 0 || templateLineCoords.value.y1 !== 0;
  });

  // === Methods ===

  /**
   * Получить координаты контейнера
   */
  function getCoords(elem: HTMLElement) {
    const box = elem.getBoundingClientRect();
    parentCoords.value = {
      top: box.top + window.pageYOffset,
      left: box.left + window.pageXOffset,
    };
  }

  /**
   * Создать пустую ячейку
   */
  function createNewCell(position: Position) {
    const _id = getUniqueId();
    const newCell: ConstructorOperation = {
      _id,
      position,
      type: 'operation',
      relation: [],
    };

    cells.value = [...cells.value, newCell];
    return _id;
  }

  /**
   * Удалить операцию
   */
  function deleteCell(cellId: string) {
    // Удаляем все связи к этой операции
    cells.value = cells.value.map((cell) => ({
      ...cell,
      relation: cell.relation.filter((rel) => rel.so_id !== cellId),
    }));

    // Удаляем саму операцию
    cells.value = cells.value.filter((cell) => cell._id !== cellId);
  }

  /**
   * Переместить операцию
   */
  function moveCell(cellId: string, newPosition: Position) {
    cells.value = cells.value.map((cell) => {
      if (cell._id === cellId) {
        return { ...cell, position: newPosition };
      }
      return cell;
    });
  }

  /**
   * Начать рисование временной линии
   */
  function startDrawingTempLine(cellIndex: number, pointIndex: PointIndex) {
    const cell = cells.value[cellIndex];
    if (!cell) return;

    // Обновляем координаты canvas перед началом рисования
    if (canvasRef?.value) {
      getCoords(canvasRef.value);
    }

    const { ITEM_SIZE, ITEM_MARGIN, PADDING_WRAP } = CONSTRUCTOR_CONSTANTS;
    const [col, row] = cell.position;

    let firstX = col * ITEM_SIZE + ITEM_MARGIN * 2 * col;
    let firstY = row * ITEM_SIZE + ITEM_MARGIN * 2 * row;

    // Корректируем координаты в зависимости от точки
    switch (pointIndex) {
      case 0: // Верх
        firstX += ITEM_SIZE / 2;
        break;
      case 1: // Право
        firstX += ITEM_SIZE;
        firstY += ITEM_SIZE / 2;
        break;
      case 2: // Низ
        firstY += ITEM_SIZE;
        firstX += ITEM_SIZE / 2;
        break;
      case 3: // Лево
        firstY += ITEM_SIZE / 2;
        break;
    }

    activePoint.value = {
      index: cellIndex,
      point: pointIndex,
    };

    // Устанавливаем начальные координаты
    templateLineCoords.value.x1 = firstX + PADDING_WRAP;
    templateLineCoords.value.y1 = firstY + PADDING_WRAP;

    // Слушатель движения мыши
    // Получаем актуальные координаты canvas элемента каждый раз для корректного расчета
    document.onmousemove = (e: MouseEvent) => {
      
      // Получаем актуальные координаты canvas элемента
      let currentLeft = parentCoords.value.left;
      let currentTop = parentCoords.value.top;
      
      if (canvasRef?.value) {
        const box = canvasRef.value.getBoundingClientRect();
        currentLeft = box.left + window.pageXOffset;
        currentTop = box.top + window.pageYOffset;
      }
      
      templateLineCoords.value.x2 = e.clientX - currentLeft + PADDING_WRAP;
      templateLineCoords.value.y2 = e.clientY - currentTop + PADDING_WRAP;
    };
  }

  /**
   * Завершить рисование временной линии
   */
  function stopDrawingTempLine() {
    templateLineCoords.value = {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    };
    activePoint.value = {
      index: '',
      point: '',
    };
    document.onmousemove = null;
  }

  /**
   * Создать связь между операциями
   */
  function createRelation(
    fromCellId: string,
    toCellId: string,
    fromPoint: PointIndex,
    toPoint: PointIndex,
    relationData?: Partial<ConstructorRelation>
  ) {
    const fromCell = cells.value.find((c) => c._id === fromCellId);
    if (!fromCell) return;

    const newRelation: Partial<ConstructorRelation> = {
      firstPointIndex: fromPoint,
    };

    Relation.createTmp(newRelation, fromCellId, toPoint, toCellId);
    Relation.create(newRelation, relationData || {});

    // Добавляем связь к операции
    cells.value = cells.value.map((cell) => {
      if (cell._id === fromCellId) {
        return {
          ...cell,
          relation: [...cell.relation, newRelation as ConstructorRelation],
        };
      }
      return cell;
    });
  }

  /**
   * Удалить связь
   */
  function deleteRelation(relationId: string) {
    cells.value = cells.value.map((cell) => ({
      ...cell,
      relation: cell.relation.filter((rel) => rel._id !== relationId),
    }));
  }

  /**
   * Отрисовать все линии связей
   */
  function drawAllLines() {
    const relations = allItemsRelations(cells.value);
    const result: DrawnRelation[] = [];

    relations.forEach((relation) => {
      // Проверяем, существует ли конечная операция
      const hasEndOperation = cells.value.some((cell) => relation.so_id === cell._id);
      if (hasEndOperation && relation.startId) {
        // Проверяем, что startId тоже существует
        const hasStartOperation = cells.value.some((cell) => relation.startId === cell._id);
        if (hasStartOperation) {
          const drawnLine = drawLine(relation, cells.value, relation.bgr_color || '');
          if (drawnLine) {
            result.push(drawnLine);
          }
        }
      }
    });

    // Добавляем свойства линий (center, length и т.д.)
    drawnRelations.value = reformRelations(result);
  }

  /**
   * Добавляет свойства к отрисованным связям
   */
  function reformRelations(relations: DrawnRelation[]): DrawnRelation[] {
    return relations.map((rel) => {
      const properties = new svgPathProperties(rel.d);
      const length = properties.getTotalLength();
      const startPointCoords = properties.getPointAtLength(0);
      const finishPointCoords = properties.getPointAtLength(length);
      const center = properties.getPointAtLength(length / 2);

      return {
        ...rel,
        center,
        length,
        startPointCoords,
        finishPointCoords,
      };
    });
  }

  /**
   * Инициализация пустых ячеек
   */
  function initializeEmptyCells() {
    const cells: EmptyCell[] = [];
    for (let i = 0; i < countColumn; i++) {
      for (let j = 0; j < countRow; j++) {
        cells.push({
          position: [i, j],
          classActive: false,
        });
      }
    }
    emptyCells.value = cells;
  }

  /**
   * Увеличить масштаб
   */
  function zoomIn() {
    if (zoom.value < 2) {
      zoom.value += 0.1;
    }
  }

  /**
   * Уменьшить масштаб
   */
  function zoomOut() {
    if (zoom.value > 1) {
      zoom.value -= 0.1;
    }
  }

  /**
   * Переключить блокировку взаимодействия с элементами
   */
  function togglePointEventsDisabling(payload: boolean) {
    disablePointEvents.value = payload;
  }

  /**
   * Установить статус перемещения элемента
   */
  function setMoveItemStatus(status: boolean) {
    moveItemStatus.value = status;
    if (!status) {
      void nextTick(() => {
        drawAllLines();
      });
    }
  }

  // === Watchers ===

  // Перерисовываем линии при изменении операций
  watch(
    () => cells.value,
    () => {
      void drawAllLines();
    },
    { deep: true, immediate: true }
  );

  // === Lifecycle ===

  // Инициализация
  initializeEmptyCells();

  return {
    // State
    parentCoords,
    drawnRelations,
    moveItemStatus,
    emptyCells,
    templateLineCoords,
    activePoint,
    zoom,
    disablePointEvents,

    // Computed
    designerStyles,
    showTemplateLine,

    // Methods
    getCoords,
    createNewCell,
    deleteCell,
    moveCell,
    startDrawingTempLine,
    stopDrawingTempLine,
    createRelation,
    deleteRelation,
    drawAllLines,
    zoomIn,
    zoomOut,
    togglePointEventsDisabling,
    setMoveItemStatus,
  };
}
