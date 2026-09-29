/**
 * Типы для конструктора операций
 */

/** Позиция элемента на сетке [column, row] */
export type Position = [number, number];

/** Индекс точки подключения (0-верх, 1-право, 2-низ, 3-лево) */
export type PointIndex = 0 | 1 | 2 | 3;

/** Результат связи */
export type RelationResult = "ok" | "nok" | "skip";

/** Оператор условий */
export type ConditionOperator = "AND" | "OR";

/** Тип операции в конструкторе */
export type OperationType = "order" | "operation" | "start" | "template";

/** Статус операции */
export type OperationStatus = "active" | "complete" | "pending" | "cancelled";

/** Связь между операциями */
export interface ConstructorRelation {
  /** Уникальный ID связи */
  _id?: string;

  /** ID целевой операции */
  so_id: string;

  /** ID начальной операции */
  startId: string;

  /** Индекс первой точки подключения */
  firstPointIndex: PointIndex;

  /** Индекс второй точки подключения */
  secondPointIndex: PointIndex;

  /** Результат условия */
  result?: RelationResult;

  /** Функции/ресурсы связи */
  function?: unknown[];

  /** Условия перехода */
  condition?: unknown[];

  /** Оператор условий */
  condition_operator?: ConditionOperator;

  /** Флаг основного пути */
  default?: boolean;

  /** Цвет связи */
  bgr_color?: string;
}

/** Операция в конструкторе */
export interface ConstructorOperation {
  /** Уникальный ID операции */
  _id: string;

  /** Позиция на сетке */
  position: Position;

  /** Тип операции */
  type: OperationType;

  /** Статус операции */
  status?: OperationStatus;

  /** ID базовой операции (для type="operation") */
  o_id?: string;

  /** ID шаблона (для type="template") */
  s_id?: string;

  /** Количество работников */
  worker_count?: number;

  /** Связи с другими операциями */
  relation: ConstructorRelation[];
}

/** Координаты для отрисовки линии SVG */
export interface LineCoordinates {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
}

/** Данные для отрисовки связи */
export interface DrawnRelation {
  /** SVG path строка */
  d: string;

  /** ID начальной операции */
  startId: string;

  /** Индекс начальной точки */
  startPoint: PointIndex;

  /** ID конечной операции */
  endId: string;

  /** Индекс конечной точки */
  endPoint: PointIndex;

  /** ID связи */
  _id?: string;

  /** Результат */
  result?: RelationResult;

  /** Функции */
  function?: unknown[];

  /** Условия */
  condition?: unknown[];

  /** Оператор условий */
  condition_operator?: ConditionOperator;

  /** Основной путь */
  default?: boolean;

  /** Цвет линии */
  brg_Color?: string;

  /** Активна ли связь */
  active?: boolean;

  /** Центр линии (для кнопок) */
  center?: { x: number; y: number };

  /** Длина линии */
  length?: number;

  /** Координаты начала */
  startPointCoords?: { x: number; y: number };

  /** Координаты конца */
  finishPointCoords?: { x: number; y: number };
}

/** Пустая ячейка сетки */
export interface EmptyCell {
  position: Position;
  classActive: boolean;
}

/** Координаты родительского контейнера */
export interface ParentCoords {
  top: number;
  left: number;
}

/** Активная точка для создания связи */
export interface ActivePoint {
  index: number | string;
  point: PointIndex | string;
}

/** Имена операций по типам */
export interface OperationNames {
  order?: Array<{ label: string; value: string }>;
  operation?: Array<{ label: string; value: string }>;
  template?: Array<{ label: string; value: string }>;
}

