/**
 * Типы для сущности Stream
 */

// Типы операций в потоке
export interface StreamRelationDto {
  /** ID целевой операции */
  so_id: string;

  /** Функции/ресурсы связи */
  function?: unknown[];

  /** Первая точка подключения (визуализация) */
  firstPointIndex?: number;

  /** Вторая точка подключения (визуализация) */
  secondPointIndex?: number;

  /** Условия перехода */
  condition?: unknown[];

  /** Флаг основного пути */
  default?: boolean;

  /** Результат условия */
  result?: "ok" | "nok" | "skip";

  /** Оператор условий */
  condition_operator?: "AND" | "OR";

  /** Цвет связи */
  bgr_color?: string;
}

export interface StreamOperationDto {
  /** ID операции */
  _id?: string;

  /** ID базовой операции (только для типа "operation") */
  o_id?: string;

  /** Позиция [x, y] */
  position?: number[];

  /** Тип операции */
  type?: "order" | "operation";

  /** Статус операции */
  status?: "active" | "complete" | "pending" | "cancelled";

  /** Количество работников */
  worker_count?: number;

  /** Связи с другими операциями */
  relation?: StreamRelationDto[];

  /** Другие поля операции */
  [key: string]: unknown;
}

/** Тип потока */
export type StreamType = "stream" | "template" | "subprocess";

/** Статус потока */
export type StreamStatus = "active" | "inactive" | "draft" | "archived";

/** Материал в потоке */
export interface StreamMaterial {
  /** ID материала */
  _id: string;

  /** Название материала */
  name: string;

  /** Единица измерения */
  measure?: string;

  /** Значение материала */
  value?: unknown;

  /** ID производственной единицы */
  p_id?: string;

  /** ID потока */
  s_id?: string;

  /** Общее количество по партиям */
  totalQuantity?: number;

  /** Количество партий */
  batchCount?: number;
}

/** Элемент списка потоков */
export interface StreamListItem {
  /** ID потока */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Название потока */
  name: string;

  /** Описание потока */
  description?: string;

  /** Тип потока */
  type?: StreamType;

  /** Статус потока */
  status?: StreamStatus;

  /** Количество операций в потоке */
  operationCount?: number;

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;

  /** Материалы потока */
  materials?: StreamMaterial[];

  /** Операции потока (возвращаются при детальном запросе) */
  operation?: StreamOperationDto[];

  /** Комментарии к потоку (возвращаются при детальном запросе) */
  comment?: unknown[];
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface StreamsPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка потоков с пагинацией */
export interface StreamsListResponse {
  data: StreamListItem[];
  pagination: StreamsPaginationMeta;
}

/** Параметры запроса списка потоков */
export interface StreamsListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/** Данные для создания потока */
export interface CreateStreamRequest {
  /** Название потока */
  name: string;

  /** Описание потока */
  description?: string;

  /** ID производственной единицы */
  p_id: string;

  /** Тип потока */
  type?: StreamType;

  /** Статус потока */
  status?: StreamStatus;

  /** Операции потока */
  operation?: StreamOperationDto[];

  /** Комментарии */
  comment?: unknown[];

  /** Массив ID материалов для привязки к потоку */
  materialIds?: string[];
}

/** Ответ при создании потока */
export type CreateStreamResponse = StreamListItem;

/** Данные для обновления потока */
export interface UpdateStreamRequest {
  /** ID потока */
  _id: string;

  /** Название потока */
  name?: string;

  /** Описание потока */
  description?: string;

  /** ID производственной единицы */
  p_id?: string;

  /** Тип потока */
  type?: StreamType;

  /** Статус потока */
  status?: StreamStatus;

  /** Операции потока */
  operation?: StreamOperationDto[];

  /** Комментарии */
  comment?: unknown[];

  /** Массив ID материалов для привязки к потоку */
  materialIds?: string[];
}

/** Ответ при обновлении потока */
export type UpdateStreamResponse = StreamListItem;

/** Параметры условий ресурса с дополнительными параметрами (для потоков) */
export interface StreamResourceConditionDto {
  /** ID ресурса в условиях */
  a_id: string;

  /** Название ресурса */
  name: string;

  /** Единица измерения */
  measure?: string;

  /** Признак группировки */
  group: boolean;

  /** Индекс ресурса */
  r_index: number;

  /** Тип поведения ресурса */
  behavior_type?: string;

  /** Параметры материала */
  material_params?: {
    quantity_required?: number;
    quantity_consumed?: number;
    quantity_returned?: number;
    waste_percentage?: number;
    alternative_materials?: string[];
  };

  /** Параметры работника */
  worker_params?: {
    can_multitask?: boolean;
    worker_count?: number;
  };

  /** Параметры оборудования */
  equipment_params?: {
    setup_time?: number;
    operation_time?: number;
    cooldown_time?: number;
  };

  /** Дополнительные параметры */
  parameters?: Record<string, unknown>;

  /** Ограничения */
  constraints?: {
    min_quantity?: number;
    max_quantity?: number;
    time_window?: {
      start?: Date | string;
      end?: Date | string;
    };
    dependencies?: string[];
  };
}

/** Информация о ресурсе в потоке */
export interface StreamResourceDto {
  /** ID ресурса */
  r_id: string;

  /** Название ресурса */
  name: string;

  /** Тип ресурса */
  type: "material" | "equipments" | "worker" | "directory";

  /** Признак сорта */
  grade?: boolean;

  /** Статус ресурса */
  status?: boolean;

  /** Условия использования ресурса */
  condition?: StreamResourceConditionDto;

  /** Детальная информация о ресурсе (материал, работник, оборудование или справочник) */
  details?: unknown;
}

/** Элемент ответа с ресурсами потока */
export interface StreamResourceItemDto {
  /** ID потока */
  stream_id: string;

  /** Название потока */
  stream_name: string;

  /** Описание потока */
  stream_description?: string;

  /** ID операции */
  operation_id: string;

  /** Название операции */
  operation_name: string;

  /** Описание операции */
  operation_description?: string;

  /** Ресурс */
  resource: StreamResourceDto;
}

/** Ответ с ресурсами потока */
export type GetStreamResourcesResponse = StreamResourceItemDto[];