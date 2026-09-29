/**
 * Типы для сущности Operation (Операция)
 */

/** Параметры условий материала */
export interface MaterialConditionParams {
  quantity_required?: number;
  quantity_consumed?: number|'';
  quantity_returned?: number|'';
  waste_percentage?: number;
  alternative_materials?: string[];
}

/** Параметры условий работника */
export interface WorkerConditionParams {
  can_multitask?: boolean;
  worker_count?: number;
}

/** Параметры условий оборудования */
export interface EquipmentConditionParams {
  setup_time?: number;
  operation_time?: number;
  cooldown_time?: number;
}

/** Ограничения ресурса */
export interface ResourceConstraints {
  min_quantity?: number;
  max_quantity?: number;
  time_window?: {
    start?: string | Date;
    end?: string | Date;
  };
  dependencies?: string[];
}

/** Условие ресурса */
export interface ResourceCondition {
  a_id: string;
  name: string;
  measure: string;
  group: boolean;
  r_index: number;
  behavior_type?: 'consume' | 'reserve' | 'transform' | 'utilize' | 'parallel' | 'sequential' | 'custom';
  material_params?: MaterialConditionParams;
  worker_params?: WorkerConditionParams;
  equipment_params?: EquipmentConditionParams;
  parameters?: Record<string, unknown>;
  constraints?: ResourceConstraints;
}

/** Ресурс операции с полной структурой */
export interface OperationResource {
  r_id: string;
  name: string;
  type: 'material' | 'equipments' | 'worker' | 'directory';
  grade?: boolean;
  status?: boolean;
  conditions: ResourceCondition[];
}

/** Ресурс операции (упрощенная версия для обратной совместимости) */
export interface OperationResourceDto {
  /** ID ресурса (ссылка на Equipment) */
  r_id: string;
}

/** Скрипты операции */
export interface OperationScriptsDto {
  /**
   * Скрипты уровня заказа
   */
  order_level?: {
    script?: string;
  };

  /**
   * Скрипты уровня операции
   */
  operation_level?: {
    script?: string;
  };

  /**
   * Скрипты уровня ресурса
   */
  resource_level?: {
    script?: string;
    add_script?: string;
  };
}

/** Временные ограничения */
export interface TimeConstraints {
  min_duration?: number;
  max_duration?: number;
}

/** Ограничения операции для планирования */
export interface OperationConstraints {
  required_qualifications?: string[];
  equipment_compatibility?: string[];
  time_constraints?: TimeConstraints;
  priority?: number;
  requires_continuous_execution?: boolean;
}

/** Техническая карта */
export interface TechnicalMap {
  file_url: string;
  file_name?: string;
  file_size?: number;
}

/** Элемент списка операций по производственной единице */
export interface OperationListItem {
  /** ID операции */
  _id: string;

  /** ID производственной единицы */
  p_id?: string;

  /** Название операции */
  name: string;

  /** Описание операции */
  description?: string;

  /** Стоимость */
  cost?: string;

  /** Процент соответствия */
  compliance_rate?: string;

  /** Флаг партии производства */
  batch_prod?: boolean;

  /** Минимальный размер партии производства */
  batch_prod_min?: number;

  /** Максимальный размер партии производства */
  batch_prod_max?: number;

  /** Время подготовки к операции (минуты) */
  preparation_time?: number;

  /** Время завершения операции (минуты) */
  completion_time?: number;

  /** Ресурсы */
  resources?: Array<{
    r_id: string;
    name: string;
    type: string;
    grade?: boolean;
    status?: boolean;
    conditions?: unknown[];
  }>;

  /** Дата создания */
  createdAt?: Date | string;

  /** Дата обновления */
  updatedAt?: Date | string;
}

/** Детальная информация об операции */
export interface OperationInfoDto {
  /** ID операции */
  _id: string;

  /** Название операции */
  name: string;

  /** Описание операции */
  description?: string;

  /** Стоимость операции */
  cost?: string;

  /** Норма выработки (в миллисекундах) */
  compliance_rate?: string;

  /** Флаг партии производства */
  batch_prod?: boolean;

  /** Минимальный размер партии производства */
  batch_prod_min?: number;

  /** Максимальный размер партии производства */
  batch_prod_max?: number;

  /** Время подготовки к операции (минуты) */
  preparation_time?: number;

  /** Время завершения операции (минуты) */
  completion_time?: number;

  /** Скрипты операции */
  scripts?: OperationScriptsDto;

  /** Список ресурсов операции (полная структура) */
  resources: OperationResource[];

  /** Технические карты */
  technical_maps?: TechnicalMap[];

  /** Ограничения операции для планирования */
  constraints?: OperationConstraints;

  /** Дата создания */
  createdAt: string;

  /** Дата последнего обновления */
  updatedAt: string;
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface OperationsPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка операций с пагинацией */
export interface OperationsListResponse {
  data: OperationListItem[];
  pagination: OperationsPaginationMeta;
}

/** Ответ API /operation_info */
export type OperationInfoResponse = OperationInfoDto[];

/** Параметры запроса списка операций */
export interface OperationsListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/** Данные для создания операции */
export interface CreateOperationRequest {
  /** Название операции */
  name: string;

  /** Описание операции (опционально) */
  description?: string;

  /** Скрипты операции */
  scripts: OperationScriptsDto;

  /** Стоимость операции */
  cost: string;

  /** Норма выработки (в миллисекундах) */
  compliance_rate: string;

  /** Флаг партии производства */
  batch_prod?: boolean;

  /** Минимальный размер партии производства */
  batch_prod_min?: number;

  /** Максимальный размер партии производства */
  batch_prod_max?: number;

  /** Время подготовки к операции (минуты) */
  preparation_time?: number;

  /** Время завершения операции (минуты) */
  completion_time?: number;

  /** Список ресурсов операции */
  resources: Array<{
    r_id: string;
    [key: string]: unknown;
  }>;

  /** Технические карты (опционально) */
  technical_maps?: Array<Record<string, unknown>>;

  /** Ограничения операции для планирования (опционально) */
  constraints?: Record<string, unknown>;

  [key: string]: unknown;
}

/** Ответ при создании операции */
export interface CreateOperationResponse {
  _id: string;
  name: string;
  [key: string]: unknown;
}

/** Данные для обновления операции */
export interface UpdateOperationRequest {
  /** ID операции для обновления */
  _id: string;

  /** Название операции (опционально) */
  name?: string;

  /** Описание операции (опционально) */
  description?: string;

  /** Скрипты операции (опционально) */
  scripts?: OperationScriptsDto;

  /** Стоимость операции (опционально) */
  cost?: string;

  /** Норма выработки (в миллисекундах) (опционально) */
  compliance_rate?: string;

  /** Флаг партии производства (опционально) */
  batch_prod?: boolean;

  /** Минимальный размер партии производства (опционально, null для очистки) */
  batch_prod_min?: number | null;

  /** Максимальный размер партии производства (опционально, null для очистки) */
  batch_prod_max?: number | null;

  /** Время подготовки к операции (минуты) (опционально) */
  preparation_time?: number;

  /** Время завершения операции (минуты) (опционально) */
  completion_time?: number;

  /** Список ресурсов операции (опционально) */
  resources?: Array<{
    r_id: string;
    [key: string]: unknown;
  }>;

  /** Технические карты (опционально) */
  technical_maps?: Array<Record<string, unknown>>;

  /** Ограничения операции для планирования (опционально) */
  constraints?: Record<string, unknown>;

  [key: string]: unknown;
}

/** Ответ при обновлении операции */
export interface UpdateOperationResponse {
  _id: string;
  name: string;
  [key: string]: unknown;
}

