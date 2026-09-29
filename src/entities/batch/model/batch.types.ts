/**
 * Типы для сущности Batch (Партии)
 */

/** Тип партии */
export type BatchType = 'material' | 'equipment' | 'tool';

/** Статус партии */
export type BatchStatus = 'available' | 'expended' | 'unknown';

/** Элемент списка партий */
export interface BatchListItem {
  /** ID партии */
  _id: string;

  /** Название партии */
  name: string;

  /** Тип партии */
  type: BatchType;

  /** Количество в партии */
  quantity: number;

  /** ID сущности */
  entityId: string;

  /** Тип сущности */
  entityType: string;

  /** Описание партии */
  description?: string;

  /** Статус партии */
  status?: BatchStatus;

  /** Строковый ID партии */
  stringId?: string;

  /** Дата поставки */
  deliveryDate?: string;

  /** Срок годности */
  expirationDate?: string;

  /** Дополнительные характеристики партии */
  feature?: Record<string, unknown>;

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface BatchesPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка партий с пагинацией */
export interface BatchesListResponse {
  data: BatchListItem[];
  pagination: BatchesPaginationMeta;
}

/** Ответ API /batch_info */
export type BatchInfoResponse = BatchListItem[];

/** Параметры запроса списка партий */
export interface BatchesListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/** Данные для создания партии */
export interface CreateBatchRequest {
  /** Название партии */
  name: string;

  /** Тип партии */
  type: BatchType;

  /** Количество в партии */
  quantity?: number;

  /** ID сущности, к которой привязана партия */
  entityId: string;

  /** Описание партии */
  description?: string;

  /** Статус партии */
  status?: BatchStatus;

  /** Строковый ID партии */
  stringId?: string;

  /** Дата поставки */
  deliveryDate?: string;

  /** Срок годности */
  expirationDate?: string;

  /** Дополнительные характеристики партии */
  feature?: Record<string, unknown>;
}

/** Ответ при создании партии */
export type CreateBatchResponse = BatchListItem;

/** Данные для обновления партии */
export interface UpdateBatchRequest {
  /** ID партии */
  _id: string;

  /** Название партии */
  name?: string;

  /** Тип партии */
  type?: BatchType;

  /** Количество в партии */
  quantity?: number;

  /** ID сущности */
  entityId?: string;

  /** Описание партии */
  description?: string;

  /** Статус партии */
  status?: BatchStatus;

  /** Строковый ID партии */
  stringId?: string;

  /** Дата поставки */
  deliveryDate?: string;

  /** Срок годности */
  expirationDate?: string;

  /** Дополнительные характеристики партии */
  feature?: Record<string, unknown>;
}

/** Ответ при обновлении партии */
export type UpdateBatchResponse = BatchListItem;
