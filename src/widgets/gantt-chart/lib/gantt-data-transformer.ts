/**
 * Data transformer for Gantt chart
 * Преобразует данные планирования в формат библиотеки v-gantt-chart-vue3
 */

import type { PlanOperation, PlanTaskGroup } from 'src/stores/planning-selection.store';

/**
 * Конвертировать ISO дату в формат для библиотеки gantt (YYYY-MM-DD HH:mm:ss)
 */
function formatDateForGantt(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Блок (операция) на диаграмме Ганта
 */
export interface GanttChartBlock {
  /** Уникальный ID блока */
  id: string;
  /**
   * ID родительской операции.
   * Для сегментированных операций блок имеет id вида `${parentId}_seg_N`,
   * а parentId указывает на op.id, по kterому выполняется поиск в props.operations.
   */
  parentId?: string;
  /** Название операции */
  name: string;
  /** Время начала (ISO string) */
  start: string;
  /** Время окончания (ISO string) */
  end: string;
  /** ID заказа */
  orderId: string;
  /** ID операции */
  operationId: string;
  /** Длительность в минутах */
  duration: number;
  /** Цвет блока */
  color?: string;
  /** Сегмент/операция не обеспечена материалами — отображается штриховкой */
  not_provided?: boolean;
  /** Ресурсы операции (для отображения в модалке) */
  resources?: unknown[] | undefined;
  /** Описание операции */
  description?: string | undefined;
  /** Дополнительные данные */
  config?: {
    style?: Record<string, string>;
    menu?: {
      operation_name?: string;
      [key: string]: unknown;
    };
  };
  /**
   * Уровень в строке «по заказу»: при пересечении операций во времени — разные lane.
   * orderLaneCount одинаков для всех строк (макс. полос среди заказов), чтобы высота строк совпадала.
   */
  orderLaneIndex?: number;
  orderLaneCount?: number;
}

/**
 * Строка диаграммы Ганта (группа или операции)
 */
export interface GanttChartRow {
  /** Уникальный ID строки */
  id: string;
  /** Название строки (заказ или ресурс) */
  name: string;
  /** Дополнительный ID для отображения */
  o_id?: string;
  /** Является ли группой */
  isGroup?: boolean;
  /** Массив блоков (операций) для этой строки */
  gtArray?: GanttChartBlock[] | string[];
  /** Время начала группы */
  time_border_left?: string;
  /** Время окончания группы */
  time_border_right?: string;
  /** ID клиентского заказа (для фильтрации) */
  clientOrderId?: string;
  /** Название клиентского заказа */
  clientOrderName?: string;
  /** Название производственного заказа */
  productionOrderName?: string;
}

/**
 * Полная структура данных для диаграммы Ганта
 */
export interface GanttChartData {
  /** Строки (rows) для левой панели с блоками внутри каждой строки */
  rows: GanttChartRow[];
  /**
   * Для режима «по заказам»: сколько вертикальных полос нужно (макс. по заказам).
   * Используется GanttChart для высоты строки.
   */
  orderRowMaxLanes?: number;
}

/**
 * Извлечь название производственного заказа и клиентского заказа из имени группы.
 * Ожидаемый формат: "ПЗ: Тесто (Заказ на булку 1)"
 * → productionOrderName = "ПЗ: Тесто", clientOrderName = "Заказ на булку 1"
 *
 * Если скобок нет — productionOrderName = всё имя, clientOrderName = null.
 */
function parseGroupName(groupName: string): {
  productionOrderName: string;
  clientOrderName: string | null;
} {
  const match = groupName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { productionOrderName: match[1]!.trim(), clientOrderName: match[2]!.trim() };
  }
  return { productionOrderName: groupName, clientOrderName: null };
}

/**
 * Имя объединённой группы после batching: «ПЗ A (Клиент1) + ПЗ B (Клиент2)».
 * Одиночное имя даёт один сегмент (как parseGroupName).
 */
function parseMergedOrderSegments(groupName: string): Array<{
  productionOrderName: string;
  clientOrderName: string | null;
}> {
  const parts = groupName
    .split(/\s+\+\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return [parseGroupName(groupName)];
  }
  return parts.map((p) => parseGroupName(p));
}

/**
 * Цветовая палитра для заказов
 */
const ORDER_COLORS = [
  '#21AE75', // Зеленый
  '#2196F3', // Синий
  '#FF9800', // Оранжевый
  '#9C27B0', // Фиолетовый
  '#00BCD4', // Голубой
  '#F44336', // Красный
  '#FFEB3B', // Желтый
  '#795548', // Коричневый
];

/**
 * Получить цвет для заказа по индексу
 */
function getOrderColor(index: number): string {
  return ORDER_COLORS[index % ORDER_COLORS.length] ?? '#9E9E9E';
}

/**
 * Возвращает true, если между сегментами есть хотя бы одна реальная пауза
 * (конец сегмента N не совпадает с началом сегмента N+1 с точностью до 1 секунды).
 */
function hasGapsBetweenSegments(segments: Array<{ startTime: string; endTime: string }>): boolean {
  for (let i = 0; i < segments.length - 1; i++) {
    const endMs = new Date(segments[i]!.endTime).getTime();
    const nextStartMs = new Date(segments[i + 1]!.startTime).getTime();
    // Допуск 1 секунда на погрешность округления
    if (nextStartMs - endMs > 1000) return true;
  }
  return false;
}

/**
 * Стиль для необеспеченного блока: полупрозрачный с диагональной штриховкой и чёрной рамкой.
 */
const NOT_PROVIDED_STYLE: Record<string, string> = {
  background:
    'repeating-linear-gradient(-45deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, rgba(200,200,200,0.35) 2px, rgba(200,200,200,0.35) 10px)',
  border: '2px solid #212121',
  opacity: '0.75',
};

/**
 * Строит массив блоков Ганта для одной операции.
 * Несколько блоков создаётся только если между сегментами есть реальные паузы.
 * Непрерывные сегменты отображаются как один сплошной блок.
 */
/**
 * @param blockIdSuffix — суффикс id блока (режим «Заказы»: одна операция в нескольких строках → уникальные ключи в DOM)
 */
function buildOperationBlocks(
  op: PlanOperation,
  color: string,
  blockIdSuffix = ''
): GanttChartBlock[] {
  const blockStyle = (notProvided: boolean) =>
    notProvided ? NOT_PROVIDED_STYLE : { background: color };

  const baseConfig = (start: string, end: string, notProvided: boolean) => ({
    style: blockStyle(notProvided),
    menu: { operation_name: op.operationName },
    start,
    end,
  });

  // Несколько сегментов с реальными паузами или с разными статусами обеспеченности
  const hasMultipleSegments = op.segments && op.segments.length > 1;
  const hasMixedProvided =
    hasMultipleSegments &&
    op.segments!.some((s) => s.not_provided) &&
    op.segments!.some((s) => !s.not_provided);

  if (hasMultipleSegments && (hasGapsBetweenSegments(op.segments!) || hasMixedProvided)) {
    return op.segments!.map((seg, idx) => {
      const isNotProvided = seg.not_provided ?? false;
      const segStart = formatDateForGantt(seg.startTime);
      const segEnd = formatDateForGantt(seg.endTime);
      const segDuration =
        (new Date(seg.endTime).getTime() - new Date(seg.startTime).getTime()) / 60000;
      return {
        id: `${op.id}_seg_${idx}${blockIdSuffix}`,
        parentId: op.id,
        name: op.operationName,
        start: segStart,
        end: segEnd,
        orderId: op.orderId,
        operationId: op.operationId,
        duration: segDuration,
        color,
        ...(isNotProvided ? { not_provided: true } : {}),
        resources: op.resources,
        description: op.description,
        config: baseConfig(segStart, segEnd, isNotProvided),
      } as GanttChartBlock;
    });
  }

  // Один блок — непрерывная операция (или сегменты без пауз)
  const isNotProvided = op.not_provided ?? false;
  const start = formatDateForGantt(op.startTime);
  const end = formatDateForGantt(op.endTime);
  return [
    {
      id: `${op.id}${blockIdSuffix}`,
      ...(blockIdSuffix ? { parentId: op.id } : {}),
      name: op.operationName,
      start,
      end,
      orderId: op.orderId,
      operationId: op.operationId,
      duration: op.duration,
      color,
      ...(isNotProvided ? { not_provided: true } : {}),
      resources: op.resources,
      description: op.description,
      config: baseConfig(start, end, isNotProvided),
    } as GanttChartBlock,
  ];
}

/**
 * Универсальный трансформер по ресурсу заданного типа.
 * Каждая строка = один ресурс, блоки = операции, в которых он участвует.
 * Цвет блока определяется заказом (orderId).
 */
function transformPlanDataByResourceType(
  operations: PlanOperation[],
  resourceType: string
): GanttChartData {
  const orderColorMap = new Map<string, string>();
  let colorIndex = 0;
  for (const op of operations) {
    if (!orderColorMap.has(op.orderId)) {
      orderColorMap.set(op.orderId, getOrderColor(colorIndex++));
    }
  }

  const resourceMap = new Map<string, { name: string; ops: PlanOperation[] }>();
  for (const op of operations) {
    const matched = (op.resources ?? []).filter(
      (r) => (r as { type: string }).type === resourceType
    );
    for (const res of matched) {
      const r = res as { id: string; name: string };
      if (!resourceMap.has(r.id)) {
        resourceMap.set(r.id, { name: r.name, ops: [] });
      }
      resourceMap.get(r.id)!.ops.push(op);
    }
  }

  const rows: GanttChartRow[] = [];
  for (const [resourceId, { name, ops }] of resourceMap) {
    rows.push({
      id: `${resourceType}_${resourceId}`,
      name,
      isGroup: false,
      gtArray: ops.flatMap((op) =>
        buildOperationBlocks(op, orderColorMap.get(op.orderId) ?? '#9E9E9E')
      ),
    });
  }

  return { rows };
}

/**
 * Преобразовать данные планирования в формат диаграммы Ганта, сгруппированный по сотрудникам.
 * Каждая строка = один сотрудник, блоки = операции, в которых участвует сотрудник.
 * Цвет блока определяется заказом (orderId).
 */
export function transformPlanDataToWorkerGantt(operations: PlanOperation[]): GanttChartData {
  return transformPlanDataByResourceType(operations, 'worker');
}

/**
 * Преобразовать данные планирования в формат диаграммы Ганта, сгруппированный по оборудованию.
 * Каждая строка = одна единица оборудования, блоки = операции, в которых оно участвует.
 * Цвет блока определяется заказом (orderId).
 */
export function transformPlanDataToEquipmentGantt(operations: PlanOperation[]): GanttChartData {
  return transformPlanDataByResourceType(operations, 'equipments');
}

/**
 * Преобразовать данные планирования в формат диаграммы Ганта, сгруппированный по материалам.
 * Каждая строка = один материал, блоки = операции, в которых он потребляется.
 * Цвет блока определяется заказом (orderId).
 */
export function transformPlanDataToMaterialGantt(operations: PlanOperation[]): GanttChartData {
  return transformPlanDataByResourceType(operations, 'material');
}

const PROD_ONLY_ROW_PREFIX = '__prod__';
/** Ключ строки по имени клиента из скобок в названии ПЗ (как в старой системе), если нет clientOrderId в API */
const CN_ROW_PREFIX = '__cn__';

const LANE_OVERLAP_TOLERANCE_MS = 1000;

/**
 * Полосы по пересечению во времени: параллельные операции — разные ряды (одна под другой),
 * непересекающиеся могут делить один ряд.
 */
function assignOperationLanes(ops: PlanOperation[]): {
  laneByOpId: Map<string, number>;
  laneCount: number;
} {
  if (ops.length === 0) {
    return { laneByOpId: new Map(), laneCount: 1 };
  }

  const items = ops
    .map((op) => ({
      op,
      start: new Date(op.startTime).getTime(),
      end: new Date(op.endTime).getTime(),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const laneEnds: number[] = [];
  const laneByOpId = new Map<string, number>();

  for (const { op, start, end } of items) {
    let lane = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i]! <= start + LANE_OVERLAP_TOLERANCE_MS) {
        lane = i;
        break;
      }
    }
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = Math.max(laneEnds[lane]!, end);
    }
    laneByOpId.set(op.id, lane);
  }

  return { laneByOpId, laneCount: Math.max(1, laneEnds.length) };
}

/**
 * Ключи строк вкладки «Заказы» для одной taskGroup.
 * После объединения партий в name несколько «… (Клиент) + … (Клиент)» — по строке на каждого клиента.
 */
function ordersGanttRowKeysFromTaskGroup(g: PlanTaskGroup): string[] {
  const segments = parseMergedOrderSegments(g.name);
  const clientLabels = [
    ...new Set(
      segments.map((s) => s.clientOrderName?.trim()).filter((n): n is string => Boolean(n))
    ),
  ];
  if (clientLabels.length > 1) {
    return clientLabels.map((n) => `${CN_ROW_PREFIX}${n}`);
  }
  if (g.clientOrderId) {
    return [g.clientOrderId];
  }
  if (clientLabels.length === 1) {
    return [`${CN_ROW_PREFIX}${clientLabels[0]}`];
  }
  const parsed = parseGroupName(g.name);
  if (parsed.clientOrderName) {
    return [`${CN_ROW_PREFIX}${parsed.clientOrderName}`];
  }
  return [`${PROD_ONLY_ROW_PREFIX}${g.orderId}`];
}

/**
 * Одна строка Ганта = один клиентский заказ: все операции связанных ПЗ (по clientOrderId или имени в скобках).
 * ПЗ без клиента — отдельная строка. Пересекающиеся по времени операции — разные полосы (друг под другом).
 */
export function transformPlanDataToOrdersGantt(
  operations: PlanOperation[],
  taskGroups: PlanTaskGroup[] = []
): GanttChartData {
  const groupsByProductionId = new Map<string, PlanTaskGroup>();
  for (const g of taskGroups) {
    groupsByProductionId.set(g.orderId, g);
  }

  /** rowKey → производственные orderId, чьи операции попадают в эту строку */
  const productionIdsByRowKey = new Map<string, Set<string>>();

  function addProductionToRow(rowKey: string, productionOrderId: string): void {
    let set = productionIdsByRowKey.get(rowKey);
    if (!set) {
      set = new Set<string>();
      productionIdsByRowKey.set(rowKey, set);
    }
    set.add(productionOrderId);
  }

  for (const g of taskGroups) {
    for (const rowKey of ordersGanttRowKeysFromTaskGroup(g)) {
      addProductionToRow(rowKey, g.orderId);
    }
  }

  for (const op of operations) {
    const g = groupsByProductionId.get(op.orderId);
    const keys = g ? ordersGanttRowKeysFromTaskGroup(g) : [`${PROD_ONLY_ROW_PREFIX}${op.orderId}`];
    for (const rowKey of keys) {
      addProductionToRow(rowKey, op.orderId);
    }
  }

  const orderedRowKeys: string[] = [];
  const seenKey = new Set<string>();
  for (const g of taskGroups) {
    for (const k of ordersGanttRowKeysFromTaskGroup(g)) {
      if (!seenKey.has(k)) {
        orderedRowKeys.push(k);
        seenKey.add(k);
      }
    }
  }
  for (const k of productionIdsByRowKey.keys()) {
    if (!seenKey.has(k)) {
      orderedRowKeys.push(k);
      seenKey.add(k);
    }
  }

  function resolveRowTitle(rowKey: string): {
    name: string;
    clientOrderId?: string;
    clientOrderName?: string;
    productionOrderName?: string;
    o_id?: string;
  } {
    if (rowKey.startsWith(PROD_ONLY_ROW_PREFIX)) {
      const prodId = rowKey.slice(PROD_ONLY_ROW_PREFIX.length);
      const g = groupsByProductionId.get(prodId);
      const name = g?.name ?? `Заказ ${prodId}`;
      const parsed = g
        ? parseGroupName(g.name)
        : { productionOrderName: name, clientOrderName: null as string | null };
      const clientOrderNameResolved = g?.clientOrderName ?? parsed.clientOrderName ?? null;
      return {
        name,
        ...(g?.clientOrderId ? { clientOrderId: g.clientOrderId } : {}),
        ...(clientOrderNameResolved ? { clientOrderName: clientOrderNameResolved } : {}),
        productionOrderName: parsed.productionOrderName,
        o_id: prodId,
      };
    }

    if (rowKey.startsWith(CN_ROW_PREFIX)) {
      const label = rowKey.slice(CN_ROW_PREFIX.length);
      return {
        name: label,
        clientOrderName: label,
        clientOrderId: rowKey,
        o_id: label,
      };
    }

    const sample = taskGroups.find((g) => g.clientOrderId === rowKey);
    const title = sample?.clientOrderName ?? `Клиентский заказ ${rowKey}`;
    return {
      name: title,
      clientOrderId: rowKey,
      clientOrderName: sample?.clientOrderName ?? title,
      o_id: rowKey,
    };
  }

  type RowMeta = {
    rowKey: string;
    name: string;
    ops: PlanOperation[];
    laneByOpId: Map<string, number>;
    laneCount: number;
    clientOrderId?: string;
    clientOrderName?: string;
    productionOrderName?: string;
    o_id?: string;
  };

  const metas: RowMeta[] = [];
  let globalMaxLanes = 1;

  for (const rowKey of orderedRowKeys) {
    const prodIds = productionIdsByRowKey.get(rowKey);
    if (!prodIds || prodIds.size === 0) {
      continue;
    }

    const rowOps = operations.filter((o) => prodIds.has(o.orderId));
    const { laneByOpId, laneCount } = assignOperationLanes(rowOps);
    globalMaxLanes = Math.max(globalMaxLanes, laneCount);

    const labels = resolveRowTitle(rowKey);
    metas.push({
      rowKey,
      name: labels.name,
      ops: rowOps,
      laneByOpId,
      laneCount,
      ...(labels.clientOrderId ? { clientOrderId: labels.clientOrderId } : {}),
      ...(labels.clientOrderName ? { clientOrderName: labels.clientOrderName } : {}),
      ...(labels.productionOrderName ? { productionOrderName: labels.productionOrderName } : {}),
      ...(labels.o_id ? { o_id: labels.o_id } : {}),
    });
  }

  const opColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const m of metas) {
    for (const op of m.ops) {
      if (!opColorMap.has(op.operationId)) {
        opColorMap.set(op.operationId, getOrderColor(colorIdx++));
      }
    }
  }

  const rows: GanttChartRow[] = [];
  for (let rowIdx = 0; rowIdx < metas.length; rowIdx++) {
    const meta = metas[rowIdx]!;
    const blocks: GanttChartBlock[] = [];
    const blockIdSuffix = `_or${rowIdx}`;
    for (const op of meta.ops) {
      const lane = meta.laneByOpId.get(op.id) ?? 0;
      const color = opColorMap.get(op.operationId) ?? '#9E9E9E';
      const built = buildOperationBlocks(op, color, blockIdSuffix);
      for (const b of built) {
        blocks.push({
          ...b,
          orderLaneIndex: lane,
          orderLaneCount: globalMaxLanes,
        });
      }
    }

    rows.push({
      id: `client_order_row_${meta.rowKey}`,
      name: meta.name,
      ...(meta.o_id ? { o_id: meta.o_id } : {}),
      isGroup: false,
      gtArray: blocks,
      ...(meta.clientOrderId ? { clientOrderId: meta.clientOrderId } : {}),
      ...(meta.clientOrderName ? { clientOrderName: meta.clientOrderName } : {}),
      ...(meta.productionOrderName ? { productionOrderName: meta.productionOrderName } : {}),
    });
  }

  return { rows, orderRowMaxLanes: globalMaxLanes };
}

// ─── Finished-Goods Gantt ─────────────────────────────────────────────────────

/**
 * Возвращает все materialId, которые операция ПРОИЗВОДИТ.
 * Источник — segments[].producedMaterials (при наличии), иначе resources.return > 0.
 */
function getProducedMaterialIds(op: PlanOperation): string[] {
  const ids: string[] = [];
  if (op.segments) {
    for (const seg of op.segments) {
      for (const pm of seg.producedMaterials ?? []) {
        ids.push(pm.materialId);
      }
    }
  }
  if (ids.length === 0 && op.resources) {
    for (const res of op.resources) {
      if (
        (res as { type: string; return?: number }).type === 'material' &&
        ((res as { type: string; return?: number }).return ?? 0) > 0
      ) {
        ids.push((res as { id: string }).id);
      }
    }
  }
  return ids;
}

/**
 * Возвращает все materialId, которые операция ПОТРЕБЛЯЕТ.
 * Источник — segments[].consumedMaterials (при наличии), иначе resources.take > 0.
 */
function getConsumedMaterialIds(op: PlanOperation): string[] {
  const ids: string[] = [];
  if (op.segments) {
    for (const seg of op.segments) {
      for (const cm of seg.consumedMaterials ?? []) {
        ids.push(cm.materialId);
      }
    }
  }
  if (ids.length === 0 && op.resources) {
    for (const res of op.resources) {
      if (
        (res as { type: string; take?: number }).type === 'material' &&
        ((res as { type: string; take?: number }).take ?? 0) > 0
      ) {
        ids.push((res as { id: string }).id);
      }
    }
  }
  return ids;
}

/**
 * Определяет «готовые изделия»: производственные заказы, чьи произведённые материалы
 * НЕ потребляются ни одной операцией другого производственного заказа в плане.
 *
 * Если ни одного такого заказа не найдено (например, нет данных о материалах),
 * возвращает все orderId из taskGroups с clientOrderId.
 */
function findFinishedGoodOrderIds(
  operations: PlanOperation[],
  taskGroups: PlanTaskGroup[],
): Set<string> {
  const opsByOrderId = new Map<string, PlanOperation[]>();
  for (const op of operations) {
    let arr = opsByOrderId.get(op.orderId);
    if (!arr) {
      arr = [];
      opsByOrderId.set(op.orderId, arr);
    }
    arr.push(op);
  }

  // producedByOrder: orderId → Set<materialId>
  const producedByOrder = new Map<string, Set<string>>();
  for (const [orderId, ops] of opsByOrderId) {
    const produced = new Set<string>();
    for (const op of ops) {
      for (const matId of getProducedMaterialIds(op)) {
        produced.add(matId);
      }
    }
    producedByOrder.set(orderId, produced);
  }

  // consumedByOrder: orderId → Set<materialId>
  const consumedByOrder = new Map<string, Set<string>>();
  for (const [orderId, ops] of opsByOrderId) {
    const consumed = new Set<string>();
    for (const op of ops) {
      for (const matId of getConsumedMaterialIds(op)) {
        consumed.add(matId);
      }
    }
    consumedByOrder.set(orderId, consumed);
  }

  // Готовые изделия: производимые материалы заказа не потребляются другими заказами
  const finishedGoodOrderIds = new Set<string>();
  for (const [orderId, produced] of producedByOrder) {
    let isConsumedByOther = false;
    for (const [otherOrderId, consumed] of consumedByOrder) {
      if (otherOrderId === orderId) continue;
      for (const matId of produced) {
        if (consumed.has(matId)) {
          isConsumedByOther = true;
          break;
        }
      }
      if (isConsumedByOther) break;
    }
    if (!isConsumedByOther) {
      finishedGoodOrderIds.add(orderId);
    }
  }

  // Фолбэк: если не нашли по материалам — берём все ПЗ с clientOrderId
  if (finishedGoodOrderIds.size === 0) {
    for (const tg of taskGroups) {
      if (tg.clientOrderId) finishedGoodOrderIds.add(tg.orderId);
    }
  }

  // Если всё ещё пусто — возвращаем все заказы
  if (finishedGoodOrderIds.size === 0) {
    for (const orderId of opsByOrderId.keys()) {
      finishedGoodOrderIds.add(orderId);
    }
  }

  return finishedGoodOrderIds;
}

/**
 * Рекурсивно собирает все операции «цепочки зависимостей» для заданного производственного заказа.
 * Включает операции самого заказа и всех «поставщиков» потребляемых им материалов.
 */
function collectDependencyChain(
  rootOrderId: string,
  opsByOrderId: Map<string, PlanOperation[]>,
  opsByProducedMaterial: Map<string, PlanOperation[]>,
  visited: Set<string>,
): PlanOperation[] {
  if (visited.has(rootOrderId)) return [];
  visited.add(rootOrderId);

  const ops = opsByOrderId.get(rootOrderId) ?? [];
  const result: PlanOperation[] = [...ops];

  for (const op of ops) {
    for (const matId of getConsumedMaterialIds(op)) {
      const producers = opsByProducedMaterial.get(matId) ?? [];
      for (const prodOp of producers) {
        if (!visited.has(prodOp.orderId)) {
          result.push(...collectDependencyChain(prodOp.orderId, opsByOrderId, opsByProducedMaterial, visited));
        }
      }
    }
  }

  return result;
}

/**
 * Сколько «логических» строк Ганта показать для готового ПЗ: при объединении партий
 * (orderBatchingPeriodDays) — по одной на клиентский заказ, с дублированием операций.
 */
function finishedGoodViewSpecs(tg: PlanTaskGroup | undefined): Array<{
  clientOrderId?: string;
  clientOrderName?: string;
}> {
  const splits = tg?.clientOrderSplits;
  if (splits && splits.length > 1) {
    return splits.map((s) => ({
      clientOrderId: `${CN_ROW_PREFIX}${s.clientOrderName}`,
      clientOrderName: s.clientOrderName,
    }));
  }
  if (tg) {
    const segments = parseMergedOrderSegments(tg.name);
    const labels = [
      ...new Set(
        segments.map((s) => s.clientOrderName?.trim()).filter((n): n is string => Boolean(n)),
      ),
    ];
    if (labels.length > 1) {
      return labels.map((name) => ({
        clientOrderId: `${CN_ROW_PREFIX}${name}`,
        clientOrderName: name,
      }));
    }
  }
  const parsed = tg ? parseGroupName(tg.name) : { productionOrderName: '', clientOrderName: null as string | null };
  const fallbackClientName = tg?.clientOrderName ?? parsed.clientOrderName ?? undefined;
  return [
    {
      ...(tg?.clientOrderId !== undefined ? { clientOrderId: tg.clientOrderId } : {}),
      ...(fallbackClientName !== undefined ? { clientOrderName: fallbackClientName } : {}),
    },
  ];
}

/**
 * Преобразовать данные планирования в формат Ганта для вкладки «Материалы».
 *
 * Каждая строка = одно готовое изделие (производственный заказ, чей конечный материал
 * не является входным ни для какого другого заказа).
 * В строке — все операции потока готового изделия и полной цепочки полуфабрикатов (как на вкладке «Производство» по составу).
 * При объединении ПЗ из разных клиентских заказов — отдельная строка на каждый клиент, операции (в т.ч. общие после merge) дублируются.
 * Параллельные операции — разные полосы (lanes), как на вкладке «Заказы».
 */
export function transformPlanDataToFinishedGoodsGantt(
  operations: PlanOperation[],
  taskGroups: PlanTaskGroup[] = [],
): GanttChartData {
  const taskGroupByOrderId = new Map<string, PlanTaskGroup>();
  for (const tg of taskGroups) {
    taskGroupByOrderId.set(tg.orderId, tg);
  }

  const opsByOrderId = new Map<string, PlanOperation[]>();
  for (const op of operations) {
    let arr = opsByOrderId.get(op.orderId);
    if (!arr) {
      arr = [];
      opsByOrderId.set(op.orderId, arr);
    }
    arr.push(op);
  }

  // materialId → операции, которые его производят
  const opsByProducedMaterial = new Map<string, PlanOperation[]>();
  for (const op of operations) {
    for (const matId of getProducedMaterialIds(op)) {
      let arr = opsByProducedMaterial.get(matId);
      if (!arr) {
        arr = [];
        opsByProducedMaterial.set(matId, arr);
      }
      arr.push(op);
    }
  }

  const finishedGoodOrderIds = findFinishedGoodOrderIds(operations, taskGroups);

  // Порядок строк: сначала по taskGroups, потом остальные
  const orderedFinishedGoods: string[] = [];
  const seen = new Set<string>();
  for (const tg of taskGroups) {
    if (finishedGoodOrderIds.has(tg.orderId) && !seen.has(tg.orderId)) {
      orderedFinishedGoods.push(tg.orderId);
      seen.add(tg.orderId);
    }
  }
  for (const orderId of finishedGoodOrderIds) {
    if (!seen.has(orderId)) {
      orderedFinishedGoods.push(orderId);
      seen.add(orderId);
    }
  }

  type RowMeta = {
    orderId: string;
    name: string;
    clientOrderId?: string;
    clientOrderName?: string;
    ops: PlanOperation[];
    laneByOpId: Map<string, number>;
    laneCount: number;
    viewIndex: number;
  };

  const rowMetas: RowMeta[] = [];
  let globalMaxLanes = 1;

  for (const orderId of orderedFinishedGoods) {
    const tg = taskGroupByOrderId.get(orderId);
    const visited = new Set<string>();
    const chainOps = collectDependencyChain(orderId, opsByOrderId, opsByProducedMaterial, visited);
    if (chainOps.length === 0) continue;

    const rawName = tg?.name ?? `Заказ ${orderId}`;
    const { productionOrderName } = parseGroupName(rawName);
    const baseProductTitle =
      productionOrderName.replace(/^ПЗ:\s*/i, '').trim() || productionOrderName;
    const viewSpecs = finishedGoodViewSpecs(tg);

    for (let v = 0; v < viewSpecs.length; v++) {
      const spec = viewSpecs[v]!;
      const { laneByOpId, laneCount } = assignOperationLanes(chainOps);
      globalMaxLanes = Math.max(globalMaxLanes, laneCount);

      rowMetas.push({
        orderId,
        name: baseProductTitle,
        ...(spec.clientOrderId !== undefined ? { clientOrderId: spec.clientOrderId } : {}),
        ...(spec.clientOrderName !== undefined ? { clientOrderName: spec.clientOrderName } : {}),
        ops: chainOps,
        laneByOpId,
        laneCount,
        viewIndex: v,
      });
    }
  }

  // Цвета по operationId (одна операция одного цвета во всех строках)
  const opColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const meta of rowMetas) {
    for (const op of meta.ops) {
      if (!opColorMap.has(op.operationId)) {
        opColorMap.set(op.operationId, getOrderColor(colorIdx++));
      }
    }
  }

  const rows: GanttChartRow[] = [];
  for (let rowIdx = 0; rowIdx < rowMetas.length; rowIdx++) {
    const meta = rowMetas[rowIdx]!;
    const blocks: GanttChartBlock[] = [];
    const blockIdSuffix = `_fg${rowIdx}`;

    for (const op of meta.ops) {
      const lane = meta.laneByOpId.get(op.id) ?? 0;
      const color = opColorMap.get(op.operationId) ?? '#9E9E9E';
      const built = buildOperationBlocks(op, color, blockIdSuffix);
      for (const b of built) {
        blocks.push({ ...b, orderLaneIndex: lane, orderLaneCount: globalMaxLanes });
      }
    }

    rows.push({
      id: `finished_good_row_${meta.orderId}_${meta.viewIndex}`,
      name: meta.name,
      isGroup: false,
      gtArray: blocks,
      ...(meta.clientOrderId ? { clientOrderId: meta.clientOrderId } : {}),
      ...(meta.clientOrderName ? { clientOrderName: meta.clientOrderName } : {}),
    });
  }

  return { rows, orderRowMaxLanes: globalMaxLanes };
}

// ─── Default Gantt ────────────────────────────────────────────────────────────

/**
 * Преобразовать данные планирования в формат диаграммы Ганта
 * @param operations - Операции из планирования
 * @param taskGroups - Группы задач (заказы)
 * @returns Данные для диаграммы Ганта
 */
export function transformPlanDataToGantt(
  operations: PlanOperation[],
  taskGroups: PlanTaskGroup[] = []
): GanttChartData {
  const rows: GanttChartRow[] = [];

  // Создаем Map для быстрого доступа к группам
  const groupsMap = new Map<string, PlanTaskGroup>();
  taskGroups.forEach((group) => {
    groupsMap.set(group.orderId, group);
  });

  // Группируем операции по заказам
  const operationsByOrder = new Map<string, PlanOperation[]>();
  operations.forEach((op) => {
    if (!operationsByOrder.has(op.orderId)) {
      operationsByOrder.set(op.orderId, []);
    }
    operationsByOrder.get(op.orderId)!.push(op);
  });

  // Создаем строки и блоки для каждого заказа
  let orderIndex = 0;
  operationsByOrder.forEach((orderOps, orderId) => {
    const group = groupsMap.get(orderId);
    const orderColor = getOrderColor(orderIndex);
    orderIndex++;

    // Создаем группу (заголовок заказа)
    if (group) {
      const groupRowId = `group_${orderId}`;
      const { productionOrderName, clientOrderName } = parseGroupName(group.name);
      // clientOrderId: предпочитаем явное поле от бэкенда, иначе — парсим из имени группы
      const clientOrderId = group.clientOrderId ?? clientOrderName ?? undefined;
      const resolvedClientOrderName = group.clientOrderName ?? clientOrderName ?? undefined;

      rows.push({
        id: groupRowId,
        name: group.name,
        o_id: orderId,
        isGroup: true,
        time_border_left: formatDateForGantt(group.startTime),
        time_border_right: formatDateForGantt(group.endTime),
        ...(clientOrderId ? { clientOrderId } : {}),
        ...(resolvedClientOrderName ? { clientOrderName: resolvedClientOrderName } : {}),
      });

      // Создаем строки и блоки для операций заказа
      orderOps.forEach((op) => {
        rows.push({
          id: `row_${op.id}`,
          name: op.operationName,
          o_id: op.operationId,
          isGroup: false,
          gtArray: buildOperationBlocks(op, orderColor),
          ...(clientOrderId ? { clientOrderId } : {}),
          ...(resolvedClientOrderName ? { clientOrderName: resolvedClientOrderName } : {}),
          productionOrderName,
        });
      });
    } else {
      // Если нет группы, создаем строки без группировки
      orderOps.forEach((op) => {
        rows.push({
          id: `row_${op.id}`,
          name: op.operationName,
          o_id: op.operationId,
          isGroup: false,
          gtArray: buildOperationBlocks(op, orderColor),
        });
      });
    }
  });

  console.log('🔄 transformPlanDataToGantt: результат', {
    totalRows: rows.length,
    rowsWithBlocks: rows.filter((r) => r.gtArray && r.gtArray.length > 0).length,
    sampleRow: rows[0],
  });

  return { rows };
}
