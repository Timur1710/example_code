/**
 * Полная реализация функции рисования линий между операциями
 * Портировано из frontend/src/mixins/drawLine.js
 * Линии огибают ячейки и привязываются к точкам подключения
 */

import type {
  ConstructorOperation,
  ConstructorRelation,
  DrawnRelation,
} from './types';

// Константы размеров
const ITEM_SIZE = 100;
const ITEM_MARGIN = 15;
const LINE_WIDTH = 2;
const PADDING_WRAP = 0;
const ARC_WIDTH = 8;

/**
 * Находит операцию, содержащую связь
 */
function findRelationParentItem(
  cells: ConstructorOperation[],
  relationId: string
): ConstructorOperation | undefined {
  return cells.find((cell) => cell.relation.some((rel) => rel._id === relationId));
}

/**
 * Рисует линию связи между двумя операциями
 * Полная реализация с учетом всех комбинаций точек подключения
 */
export function drawLine(
  relation: ConstructorRelation,
  cells: ConstructorOperation[],
  brgColor = ''
): DrawnRelation | null {
  // Находим родительскую операцию по startId (более надежный способ)
  let item: ConstructorOperation | undefined;

  if (relation.startId) {
    // Ищем по startId - это основной способ
    item = cells.find((cell) => cell._id === relation.startId);
  } else if (relation._id) {
    // Если нет startId, пытаемся найти по _id связи
    item = findRelationParentItem(cells, relation._id);
  }

  if (!item) return null;

  const firstParentCoords = item.position;
  const firstId = item._id;
  const _id = relation._id || `${firstId}-${relation.so_id}-${Date.now()}`;
  const result = relation.result;

  // Находим индекс конечной операции
  const secondIndex = cells.findIndex((cell) => relation.so_id === cell._id);
  if (secondIndex === -1) return null;

  const secondCell = cells[secondIndex];
  if (!secondCell) return null;
  const secondParentCoords = secondCell.position;

  let d = 'M';
  const a = `a${ARC_WIDTH} ${ARC_WIDTH} 0 0 `;
  const dataLine = relation;

  // Вычисляем начальные координаты первой ячейки
  let coordX = firstParentCoords[0] * ITEM_SIZE + ITEM_MARGIN * 2 * firstParentCoords[0];
  let coordY = firstParentCoords[1] * ITEM_SIZE + ITEM_MARGIN * 2 * firstParentCoords[1];

  let direction: 'h' | 'v' = 'h';
  let sign = '';
  let residue = '';
  let addLine = true;
  let anotherPath = false;

  // Определяем начальные координаты в зависимости от точки подключения
  switch (dataLine.firstPointIndex) {
    case 0: // Верх
      coordX += ITEM_SIZE / 2;
      direction = 'v';
      sign = '-';
      break;
    case 1: // Право
      coordX += ITEM_SIZE;
      coordY += ITEM_SIZE / 2;
      break;
    case 2: // Низ
      coordY += ITEM_SIZE;
      coordX += ITEM_SIZE / 2;
      direction = 'v';
      break;
    case 3: // Лево
      coordY += ITEM_SIZE / 2;
      sign = '-';
      break;
  }

  d += `${coordX + PADDING_WRAP}, ${coordY + PADDING_WRAP} ${direction} ${sign}${ITEM_MARGIN - ARC_WIDTH} `;

  // Основная логика построения пути в зависимости от расположения ячеек
  if (secondParentCoords[0] > firstParentCoords[0]) {
    // Вторая ячейка правее первой
    const countElemX = secondParentCoords[0] - firstParentCoords[0] - 1;
    coordX = countElemX * ITEM_SIZE + countElemX * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;

    if (secondParentCoords[1] > firstParentCoords[1]) {
      // Вправо и вниз
      const countElemY = secondParentCoords[1] - firstParentCoords[1] - 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;
      d += a;

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_SIZE + ITEM_MARGIN * 3;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          break;

        case 1:
          switch (dataLine.secondPointIndex) {
            case 0:
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              if (secondParentCoords[0] === firstParentCoords[0] + 1) {
                addLine = false;
                coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              } else {
                coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              }
              break;
          }
          if (addLine) {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              if (secondParentCoords[1] === firstParentCoords[1] + 1) {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                addLine = false;
              } else {
                coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              }
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          break;
      }
    } else if (secondParentCoords[1] < firstParentCoords[1]) {
      // Вправо и вверх
      const countElemY = secondParentCoords[1] - firstParentCoords[1] + 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 - ITEM_SIZE / 2 + LINE_WIDTH / 2;
      d += a;

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              if (firstParentCoords[1] - secondParentCoords[1] === 1) {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                addLine = false;
              } else {
                coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 3:
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 1:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              if (secondParentCoords[0] === firstParentCoords[0] + 1) {
                addLine = false;
                coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              } else {
                coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
          }
          if (addLine) {
            d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          break;
      }
    } else if (secondParentCoords[1] === firstParentCoords[1]) {
      // Только вправо (на одной строке)
      const countElemY = secondParentCoords[1] - firstParentCoords[1] - 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;

      if (dataLine.firstPointIndex === 1 && dataLine.secondPointIndex === 3 && secondParentCoords[0] === firstParentCoords[0] + 1) {
        // Специальный случай - соседние ячейки
      } else {
        d += a;
      }

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              addLine = false;
              break;
            case 1:
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_SIZE + ITEM_MARGIN * 3;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${ITEM_SIZE / 2} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 1:
          coordY += ITEM_SIZE + ITEM_MARGIN * 2;
          switch (dataLine.secondPointIndex) {
            case 0:
              anotherPath = true;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
              break;
            case 1:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              if (secondParentCoords[0] === firstParentCoords[0] + 1) {
                anotherPath = true;
                d += `h ${ARC_WIDTH * 2}`;
              } else {
                coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
          }
          if (!anotherPath) {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE / 2 - ITEM_MARGIN - LINE_WIDTH;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY += ITEM_MARGIN * 2 + LINE_WIDTH;
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              addLine = false;
              break;
            case 3:
              coordY += ITEM_MARGIN * 2 + LINE_WIDTH;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 3:
          coordY += ITEM_SIZE + ITEM_MARGIN * 2;
          switch (dataLine.secondPointIndex) {
            case 0:
              anotherPath = true;
              coordX += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              coordY -= ITEM_SIZE - LINE_WIDTH;
              d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
              break;
            case 1:
              if (secondParentCoords[0] === firstParentCoords[0] + 1) {
                anotherPath = true;
                d += `h -${ARC_WIDTH * 2}`;
              } else {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 2:
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (!anotherPath) {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          }
          break;
      }
    }
  } else if (secondParentCoords[0] < firstParentCoords[0]) {
    // Вторая ячейка левее первой
    const countElemX = secondParentCoords[0] - firstParentCoords[0];
    coordX = countElemX * ITEM_SIZE + (countElemX + 1) * ITEM_MARGIN * 2 + ITEM_SIZE / 2 + LINE_WIDTH / 2;

    if (secondParentCoords[1] > firstParentCoords[1]) {
      // Влево и вниз
      const countElemY = secondParentCoords[1] - firstParentCoords[1] - 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;
      d += a;

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_SIZE + ITEM_MARGIN * 3;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          break;

        case 1:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              if (secondParentCoords[1] === firstParentCoords[1] + 1) {
                coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
                addLine = false;
              } else {
                coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              }
              break;
            case 1:
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              if (secondParentCoords[0] === firstParentCoords[0] - 1) {
                addLine = false;
                coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              } else {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              }
              break;
            case 2:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;
      }
    } else if (secondParentCoords[1] < firstParentCoords[1]) {
      // Влево и вверх
      const countElemY = secondParentCoords[1] - firstParentCoords[1] + 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 - ITEM_SIZE / 2 + 1;
      d += a;

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              if (firstParentCoords[1] - secondParentCoords[1] === 1) {
                coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
                addLine = false;
              } else {
                coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 1:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              if (firstParentCoords[0] - secondParentCoords[0] === 1) {
                coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
                addLine = false;
              } else {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 2:
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;
      }
    } else if (secondParentCoords[1] === firstParentCoords[1]) {
      // Только влево (на одной строке)
      const countElemY = secondParentCoords[1] - firstParentCoords[1] - 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;

      if (dataLine.firstPointIndex === 3 && dataLine.secondPointIndex === 1 && secondParentCoords[0] === firstParentCoords[0] - 1) {
        // Специальный случай
      } else {
        d += a;
      }

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              addLine = false;
              break;
            case 1:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_SIZE + ITEM_MARGIN * 3;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 1:
          coordY += ITEM_SIZE + ITEM_MARGIN * 2;
          switch (dataLine.secondPointIndex) {
            case 0:
              anotherPath = true;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
              break;
            case 1:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (!anotherPath) {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE / 2 - ITEM_MARGIN - LINE_WIDTH;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY += ITEM_MARGIN * 2 + LINE_WIDTH;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              addLine = false;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_MARGIN * 2;
              coordY += ITEM_MARGIN * 2 + LINE_WIDTH;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          } else {
            d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 3:
          coordY += ITEM_SIZE + ITEM_MARGIN * 2;
          switch (dataLine.secondPointIndex) {
            case 0:
              anotherPath = true;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              coordY -= ITEM_SIZE - LINE_WIDTH;
              d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
              break;
            case 1:
              if (secondParentCoords[0] === firstParentCoords[0] - 1) {
                anotherPath = true;
                d += `h -${ARC_WIDTH * 2}`;
              } else {
                coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 2:
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (!anotherPath) {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          }
          break;
      }
    }
  } else {
    // secondParentCoords[0] === firstParentCoords[0] - на одной колонке
    const countElemX = secondParentCoords[0] - firstParentCoords[0];
    coordX = countElemX * ITEM_SIZE + countElemX * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;

    if (secondParentCoords[1] > firstParentCoords[1]) {
      // Только вниз
      const countElemY = secondParentCoords[1] - firstParentCoords[1] - 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 + ITEM_SIZE / 2 - LINE_WIDTH / 2;

      if (dataLine.firstPointIndex === 2 && dataLine.secondPointIndex === 0 && secondParentCoords[1] === firstParentCoords[1] + 1) {
        // Специальный случай
      } else {
        d += a;
      }

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_SIZE + ITEM_MARGIN * 3;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              anotherPath = true;
              coordX -= ITEM_SIZE - LINE_WIDTH;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
              break;
          }
          if (!anotherPath) {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          }
          break;

        case 1:
          coordX += LINE_WIDTH;
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX -= ITEM_SIZE;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              addLine = false;
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              break;
            case 2:
              coordX -= ITEM_SIZE;
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              if (secondParentCoords[1] === firstParentCoords[1] + 1) {
                anotherPath = true;
                d += `v ${ARC_WIDTH * 2}`;
              } else {
                coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              }
              break;
            case 1:
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              anotherPath = true;
              coordX -= ITEM_SIZE - LINE_WIDTH;
              residue = `0 ${ARC_WIDTH} ${ARC_WIDTH}`;
              d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
              break;
          }
          if (!anotherPath) {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 1 ${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          }
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH} v ${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 2:
              coordY += ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              addLine = false;
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
              break;
          }
          if (addLine) {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `0 -${ARC_WIDTH} ${ARC_WIDTH} v ${coordY} ${a} 0 ${ARC_WIDTH} ${ARC_WIDTH}`;
          }
          break;
      }
    } else if (secondParentCoords[1] < firstParentCoords[1]) {
      // Только вверх
      const countElemY = secondParentCoords[1] - firstParentCoords[1] + 1;
      coordY = countElemY * ITEM_SIZE + countElemY * ITEM_MARGIN * 2 - ITEM_SIZE / 2 + 1;

      if (dataLine.firstPointIndex === 0 && dataLine.secondPointIndex === 2 && firstParentCoords[1] - secondParentCoords[1] === 1) {
        // Специальный случай
      } else {
        d += a;
      }

      switch (dataLine.firstPointIndex) {
        case 0:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              if (firstParentCoords[1] - secondParentCoords[1] === 1) {
                anotherPath = true;
                d += `v -${ARC_WIDTH * 2}`;
              } else {
                coordY += ITEM_SIZE / 2 + ITEM_MARGIN;
                residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              }
              break;
            case 3:
              anotherPath = true;
              coordX -= ITEM_SIZE - LINE_WIDTH;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              d += `0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
              break;
          }
          if (!anotherPath) {
            d += `1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          }
          break;

        case 1:
          coordX += LINE_WIDTH;
          switch (dataLine.secondPointIndex) {
            case 0:
              coordX -= ITEM_SIZE;
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              addLine = false;
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              break;
            case 2:
              coordX -= ITEM_SIZE;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              coordX -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `1 -${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
          }
          if (addLine) {
            d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;

        case 2:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_SIZE / 2 + ITEM_MARGIN * 3;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              residue = `0 -${ARC_WIDTH} -${ARC_WIDTH} h -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              anotherPath = true;
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} -${ARC_WIDTH}`;
              d += `1 -${ARC_WIDTH} ${ARC_WIDTH} h -${coordX} ${a} 1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
              break;
          }
          if (!anotherPath) {
            d += `0 ${ARC_WIDTH} ${ARC_WIDTH} h ${coordX} ${a} 0 ${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} ${residue}`;
          }
          break;

        case 3:
          switch (dataLine.secondPointIndex) {
            case 0:
              coordY -= ITEM_SIZE + ITEM_MARGIN * 2;
              residue = `1 ${ARC_WIDTH} ${ARC_WIDTH}`;
              break;
            case 1:
              coordX += ITEM_SIZE / 2 + ITEM_MARGIN - LINE_WIDTH / 2;
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH} v -${ITEM_SIZE / 2 - LINE_WIDTH / 2} ${a} 0 -${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 2:
              residue = `0 ${ARC_WIDTH} -${ARC_WIDTH}`;
              break;
            case 3:
              addLine = false;
              coordX -= ITEM_SIZE / 2 + ITEM_MARGIN;
              coordY -= ITEM_SIZE / 2 + ITEM_MARGIN;
              break;
          }
          if (addLine) {
            d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH} h ${coordX} ${a} ${residue}`;
          } else {
            d += `1 -${ARC_WIDTH} -${ARC_WIDTH} v ${coordY} ${a} 1 ${ARC_WIDTH} -${ARC_WIDTH}`;
          }
          break;
      }
    }
  }

  // Добавляем конечный сегмент в зависимости от точки подключения
  switch (dataLine.secondPointIndex) {
    case 0:
      d += ` v ${ITEM_MARGIN - ARC_WIDTH}`;
      break;
    case 1:
      d += ` h -${ITEM_MARGIN - ARC_WIDTH}`;
      break;
    case 2:
      d += ` v -${ITEM_MARGIN - ARC_WIDTH}`;
      break;
    case 3:
      d += ` h ${ITEM_MARGIN - ARC_WIDTH}`;
      break;
  }

  const drawnRelation: DrawnRelation = {
    d,
    startId: firstId,
    startPoint: dataLine.firstPointIndex,
    endId: dataLine.so_id,
    endPoint: dataLine.secondPointIndex,
    active: false,
    brg_Color: brgColor,
    _id,
    condition_operator: dataLine.condition_operator || 'AND',
    default: dataLine.default || false,
  };

  if (result) {
    drawnRelation.result = result;
  }

  if (dataLine.function) {
    drawnRelation.function = dataLine.function;
  }

  if (dataLine.condition) {
    drawnRelation.condition = dataLine.condition;
  }

  return drawnRelation;
}

/**
 * Константы для экспорта
 */
export const CONSTRUCTOR_CONSTANTS = {
  ITEM_SIZE,
  ITEM_MARGIN,
  LINE_WIDTH,
  PADDING_WRAP,
  ARC_WIDTH,
};
