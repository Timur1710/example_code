/**
 * Типы для сущности Equipment
 */

/** Элемент PPR (План Производства и Ремонта) */
export interface EquipmentPprItem {
  /** Дата начала */
  dateStart?: string;

  /** Дата окончания */
  dateEnd?: string;

  /** Название */
  name?: string;
}

export interface EquipmentOperation {
  /** ID операции */
  _id: string;

  /** Статус операции */
  status: boolean;

  /** ID типа операции */
  o_id: string;

  /** Фактор операции */
  factor: string;

  /** Название операции */
  name: string;
}

export interface EquipmentValue {
  /** Информация о поставках и произвольных значениях */
  supply?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/** Элемент списка оборудования */
export interface EquipmentListItem {
  /** ID оборудования */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Аватар/изображение оборудования */
  avatar?: string | null;

  /** Название оборудования */
  name: string;

  /** Список операций */
  operation?: EquipmentOperation[];

  /** Статус занятости */
  occupied?: boolean;

  /** Количество (может быть строкой) */
  amount?: number | string;

  /** Единица измерения */
  measure?: string;

  /** Описание */
  description?: string | null;

  /** Спецификация/доп. поля */
  specification?: Record<string, unknown>;

  /** Дополнительные значения (например, поставки) */
  value?: EquipmentValue;

  /** План производства и ремонта */
  ppr?: EquipmentPprItem[];

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;

  /** Произвольные дополнительные поля */
  [key: string]: unknown;
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface EquipmentPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка оборудования с пагинацией */
export interface EquipmentListResponse {
  data: EquipmentListItem[];
  pagination: EquipmentPaginationMeta;
}

/** Ответ API /equipment_id */
export type EquipmentInfoResponse = EquipmentListItem[];

/** Параметры запроса списка оборудования */
export interface EquipmentListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/** Данные для создания оборудования */
export interface CreateEquipmentRequest {
  /** Название оборудования */
  name: string;

  /** ID производственной единицы */
  p_id: string;

  /** Аватар/изображение оборудования */
  avatar?: string | null;

  /** Описание оборудования */
  description?: string;

  /** Количество (может быть строкой) */
  amount?: number | string;

  /** Единица измерения */
  measure?: string;

  /** Признак занятости */
  occupied?: boolean;

  /** Операции/ресурсы */
  operation?: Array<Record<string, unknown>>;

  /** Дополнительная спецификация */
  specification?: Record<string, unknown>;

  /** Значения (например, поставки) */
  value?: EquipmentValue;

  /** План производства и ремонта */
  ppr?: EquipmentPprItem[];

  /** Дополнительные поля */
  [key: string]: unknown;
}

/** Ответ при создании оборудования */
export type CreateEquipmentResponse = EquipmentListItem;

/** Данные для обновления оборудования */
export interface UpdateEquipmentRequest {
  /** ID оборудования */
  _id: string;

  /** Название оборудования */
  name?: string;

  /** ID производственной единицы */
  p_id?: string;

  /** Аватар/изображение оборудования */
  avatar?: string | null;

  /** Описание оборудования */
  description?: string;

  /** Количество (может быть строкой) */
  amount?: number | string;

  /** Единица измерения */
  measure?: string;

  /** Признак занятости */
  occupied?: boolean;

  /** Операции/ресурсы */
  operation?: Array<Record<string, unknown>>;

  /** Дополнительная спецификация */
  specification?: Record<string, unknown>;

  /** Значения (например, поставки) */
  value?: EquipmentValue;

  /** План производства и ремонта */
  ppr?: EquipmentPprItem[];

  /** Дополнительные поля */
  [key: string]: unknown;
}

/** Ответ при обновлении оборудования */
export type UpdateEquipmentResponse = EquipmentListItem;

/** Данные для обновления альтернатив оборудования */
export interface UpdateEquipmentAlternativesRequest {
  /** ID оборудования, для которого задаются альтернативы */
  _id: string;

  /** Список ID оборудования, которые являются альтернативами */
  alternativeIds: string[];
}

/** Ответ при обновлении альтернатив оборудования */
export interface UpdateEquipmentAlternativesResponse {
  /** ID оборудования */
  _id: string;

  /** Список альтернатив оборудования (ID) */
  alternative?: string[];

  /** План производства и ремонта */
  ppr?: EquipmentPprItem[];

  /** Дополнительные поля оборудования */
  [key: string]: unknown;
}

/** Альтернативное оборудование */
export interface EquipmentAlternative {
  _id: string;
  name: string;
  p_id: string;
}

/** Ответ при получении оборудования с альтернативами */
export interface GetEquipmentAlternativesResponse {
  /** ID оборудования */
  _id: string;

  /** Название оборудования */
  name: string;  /** ID производственной единицы */
  p_id: string;

  /** Список альтернатив оборудования */
  alternative?: EquipmentAlternative[];

  /** План производства и ремонта */
  ppr?: EquipmentPprItem[];

  /** Дополнительные поля оборудования */
  [key: string]: unknown;
}

/** Ответ при поиске альтернатив оборудования */
export interface SearchEquipmentAlternativesResponse {
  /** Список альтернатив оборудования */
  alternatives: EquipmentAlternative[];
}