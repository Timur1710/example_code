/**
 * Типы для сущности Order (Заказы)
 */

/**
 * Тип заказа
 */
export type OrderType = 'client' | 'production';

/**
 * Статус заказа
 */
export type OrderStatus = 'new' | 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'resource_shortage';

/**
 * Конфигурация партий для производственного заказа
 */
export interface OrderBatchConfig {
  /**
   * Минимальный размер партии
   */
  minBatchSize: number;

  /**
   * Максимальный размер партии (необязательно)
   */
  maxBatchSize?: number;

  /**
   * Единица измерения партии
   */
  batchUnit: string;
}

/**
 * Данные материала (в ответах)
 */
export interface MaterialData {
  /**
   * ID материала
   */
  _id: string;

  /**
   * Название материала
   */
  name: string;

  /**
   * Единица измерения (необязательно)
   */
  measure?: string;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Данные производственной единицы (в ответах)
 */
export interface ProductionUnitData {
  /**
   * ID производственной единицы
   */
  _id: string;

  /**
   * Название производственной единицы
   */
  name: string;

  /**
   * Тип производственной единицы
   */
  type: string;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Краткая информация о производственном заказе в списке
 */
export interface ProductionOrderItem {
  /**
   * ID производственного заказа
   */
  _id: string;

  /**
   * Тип заказа (всегда "production")
   */
  type: 'production';

  /**
   * Дата заказа
   */
  orderDate: Date | string;

  /**
   * Дата отгрузки
   */
  shipmentDate?: Date | string | null;

  /**
   * Название производственного заказа
   */
  name: string;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Элемент материала в заказе
 */
export interface OrderMaterialDto {
  /**
   * ID материала
   */
  materialId: string;

  /**
   * Количество материала
   */
  quantity: number;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Элемент материала в ответе с полными данными
 */
export interface OrderMaterialResponse extends OrderMaterialDto {
  /**
   * Полные данные материала
   */
  materialData?: MaterialData;
}

/**
 * Элемент списка заказов
 */
export interface OrderListItem {
  /**
   * ID заказа
   */
  _id: string;

  /**
   * ID производственной единицы
   */
  p_id: string;

  /**
   * Тип заказа: "client" или "production"
   */
  type: OrderType;

  /**
   * Дата заказа
   */
  orderDate: Date | string;

  /**
   * Дата отгрузки
   */
  shipmentDate?: Date | string;

  /**
   * Название заказа
   */
  name: string;

  /**
   * Массив материалов с полными данными
   */
  materials: OrderMaterialResponse[];

  /**
   * Массив производственных заказов (только для type="client")
   * Может содержать как ID (string[]), так и полные объекты (ProductionOrderItem[])
   */
  productionOrders?: string[] | ProductionOrderItem[];

  /**
   * Данные производственной единицы
   */
  productionUnitData?: ProductionUnitData;

  // === ПОЛЯ ДЛЯ ПРОИЗВОДСТВЕННЫХ ЗАКАЗОВ (type="production") ===

  /**
   * ID потока производства (ТОЛЬКО для type="production")
   */
  s_id?: string;

  /**
   * ID клиентского заказа (ТОЛЬКО для type="production")
   */
  clientOrderId?: string;

  /**
   * ID материала, который производится (ТОЛЬКО для type="production")
   */
  materialId?: string;

  /**
   * Количество к производству (ТОЛЬКО для type="production")
   */
  quantity?: number;

  /**
   * Срочность/приоритет (0-10)
   */
  urgency?: number;

  /**
   * Статус заказа
   */
  status?: OrderStatus;

  /**
   * Конфигурация партий производства (ТОЛЬКО для type="production")
   */
  batchConfig?: OrderBatchConfig;

  /**
   * Обособленный заказ (необязательное поле)
   */
  isolatedOrder?: boolean;

  /**
   * Дата создания
   */
  createdAt?: Date | string;

  /**
   * Дата обновления
   */
  updatedAt?: Date | string;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Мета-информация пагинации (совместима с Quasar)
 */
export interface OrdersPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/**
 * Ответ списка заказов с пагинацией
 */
export interface OrdersListResponse {
  data: OrderListItem[];
  pagination: OrdersPaginationMeta;
}

/**
 * Ответ API /order_info
 */
export type OrderInfoResponse = OrderListItem[];

/**
 * Параметры запроса списка заказов
 */
export interface OrdersListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/**
 * Данные для создания заказа
 *
 * Требования валидации:
 * - name: минимум 2 символа, не должна быть пустой
 * - type: должна быть 'client' или 'production'
 * - orderDate: валидная дата
 * - materials: ОБЯЗАТЕЛЬНО минимум 1 материал, не может быть пустым массивом
 * - каждый материал должен иметь materialId и quantity > 0
 */
export interface CreateOrderRequest {
  /**
   * ID производственной единицы
   */
  p_id: string;

  /**
   * Тип заказа: "client" или "production"
   */
  type: OrderType;

  /**
   * Дата заказа
   */
  orderDate: string | Date;

  /**
   * Дата отгрузки
   */
  shipmentDate?: string | Date;

  /**
   * Название заказа
   */
  name: string;

  /**
   * Массив материалов с количеством
   * ВАЖНО: Массив ОБЯЗАТЕЛЬНО должен содержать минимум 1 материал
   * каждый материал должен иметь materialId и quantity > 0
   */
  materials: OrderMaterialDto[];

  /**
   * Массив ID production заказов (только для type="client")
   */
  productionOrders?: string[];

  // === ПОЛЯ ДЛЯ ПРОИЗВОДСТВЕННЫХ ЗАКАЗОВ (type="production") ===

  /**
   * ID потока производства (ТОЛЬКО для type="production")
   */
  s_id?: string;

  /**
   * ID клиентского заказа (ТОЛЬКО для type="production")
   */
  clientOrderId?: string;

  /**
   * ID материала, который производится (ТОЛЬКО для type="production")
   */
  materialId?: string;

  /**
   * Количество к производству (ТОЛЬКО для type="production")
   */
  quantity?: number;

  /**
   * Срочность/приоритет (0-10)
   */
  urgency?: number;

  /**
   * Статус заказа
   */
  status?: OrderStatus;

  /**
   * Конфигурация партий производства (ТОЛЬКО для type="production")
   */
  batchConfig?: OrderBatchConfig;

  /**
   * Обособленный заказ (необязательное поле)
   */
  isolatedOrder?: boolean;

  // === УПРАВЛЕНИЕ ГЕНЕРАЦИЕЙ ===

  /**
   * Автоматически создавать производственные заказы при создании клиентского заказа
   * По умолчанию: true
   * Установите false, чтобы создать только клиентский заказ без производственных
   */
  autoGenerateProduction?: boolean;

  /**
   * Любые дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Ответ при создании заказа
 */
export interface CreateOrderResponse {
  /**
   * ID созданного заказа
   */
  _id: string;

  /**
   * ID производственной единицы
   */
  p_id: string;

  /**
   * Тип заказа
   */
  type: OrderType;

  /**
   * Дата заказа
   */
  orderDate: Date | string;

  /**
   * Дата отгрузки
   */
  shipmentDate?: Date | string;

  /**
   * Название заказа
   */
  name: string;

  /**
   * Массив материалов с полными данными
   */
  materials: OrderMaterialResponse[];

  /**
   * Массив ID production заказов
   */
  productionOrders?: string[];

  // === ПОЛЯ ДЛЯ ПРОИЗВОДСТВЕННЫХ ЗАКАЗОВ ===

  /**
   * ID потока производства (ТОЛЬКО для type="production")
   */
  s_id?: string;

  /**
   * ID клиентского заказа (ТОЛЬКО для type="production")
   */
  clientOrderId?: string;

  /**
   * ID материала, который производится (ТОЛЬКО для type="production")
   */
  materialId?: string;

  /**
   * Количество к производству (ТОЛЬКО для type="production")
   */
  quantity?: number;

  /**
   * Срочность/приоритет (0-10)
   */
  urgency?: number;

  /**
   * Статус заказа
   */
  status?: OrderStatus;

  /**
   * Конфигурация партий производства (ТОЛЬКО для type="production")
   */
  batchConfig?: OrderBatchConfig;

  /**
   * Обособленный заказ (необязательное поле)
   */
  isolatedOrder?: boolean;

  /**
   * Дата создания
   */
  createdAt: Date;

  /**
   * Дата обновления
   */
  updatedAt: Date;
}

/**
 * Данные для обновления заказа
 *
 * Требования валидации:
 * - _id: обязательное поле, должна быть валидная ID
 * - name: если указана, должна быть минимум 2 символа
 * - type: если указана, должна быть 'client' или 'production'
 * - orderDate: если указана, должна быть валидная дата
 * - materials: если указана, ОБЯЗАТЕЛЬНО должна содержать минимум 1 материал
 * - каждый материал должен иметь materialId и quantity > 0
 */
export interface UpdateOrderRequest {
  /**
   * ID заказа для обновления
   */
  _id: string;

  /**
   * ID производственной единицы
   */
  p_id?: string;

  /**
   * Тип заказа: "client" или "production"
   */
  type?: OrderType;

  /**
   * Дата заказа
   */
  orderDate?: string | Date;

  /**
   * Дата отгрузки
   */
  shipmentDate?: string | Date | null;

  /**
   * Название заказа
   */
  name?: string;

  /**
   * Массив материалов с количеством
   * ВАЖНО: Если указана, массив ОБЯЗАТЕЛЬНО должен содержать минимум 1 материал
   * каждый материал должен иметь materialId и quantity > 0
   */
  materials?: OrderMaterialDto[];

  /**
   * Массив ID production заказов (только для type="client")
   */
  productionOrders?: string[];

  // === ПОЛЯ ДЛЯ ПРОИЗВОДСТВЕННЫХ ЗАКАЗОВ (type="production") ===

  /**
   * ID потока производства (ТОЛЬКО для type="production")
   */
  s_id?: string;

  /**
   * ID клиентского заказа (ТОЛЬКО для type="production")
   */
  clientOrderId?: string;

  /**
   * ID материала, который производится (ТОЛЬКО для type="production")
   */
  materialId?: string;

  /**
   * Количество к производству (ТОЛЬКО для type="production")
   */
  quantity?: number;

  /**
   * Срочность/приоритет (0-10)
   */
  urgency?: number;

  /**
   * Статус заказа
   */
  status?: OrderStatus;

  /**
   * Конфигурация партий производства (ТОЛЬКО для type="production")
   */
  batchConfig?: OrderBatchConfig;

  /**
   * Обособленный заказ (необязательное поле)
   */
  isolatedOrder?: boolean;

  /**
   * Дата создания (readonly, но фронт может отправлять)
   */
  createdAt?: string | Date;

  /**
   * Дата обновления (readonly, но фронт может отправлять)
   */
  updatedAt?: string | Date;

  /**
   * Любые дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Ответ при обновлении заказа
 */
export interface UpdateOrderResponse {
  /**
   * ID обновленного заказа
   */
  _id: string;

  /**
   * ID производственной единицы
   */
  p_id: string;

  /**
   * Тип заказа
   */
  type: OrderType;

  /**
   * Дата заказа
   */
  orderDate: Date | string;

  /**
   * Дата отгрузки
   */
  shipmentDate?: Date | string;

  /**
   * Название заказа
   */
  name: string;

  /**
   * Массив материалов с полными данными
   */
  materials: OrderMaterialResponse[];

  /**
   * Массив ID production заказов
   */
  productionOrders?: string[];

  // === ПОЛЯ ДЛЯ ПРОИЗВОДСТВЕННЫХ ЗАКАЗОВ ===

  /**
   * ID потока производства (ТОЛЬКО для type="production")
   */
  s_id?: string;

  /**
   * ID клиентского заказа (ТОЛЬКО для type="production")
   */
  clientOrderId?: string;

  /**
   * ID материала, который производится (ТОЛЬКО для type="production")
   */
  materialId?: string;

  /**
   * Количество к производству (ТОЛЬКО для type="production")
   */
  quantity?: number;

  /**
   * Срочность/приоритет (0-10)
   */
  urgency?: number;

  /**
   * Статус заказа
   */
  status?: OrderStatus;

  /**
   * Конфигурация партий производства (ТОЛЬКО для type="production")
   */
  batchConfig?: OrderBatchConfig;

  /**
   * Обособленный заказ (необязательное поле)
   */
  isolatedOrder?: boolean;

  /**
   * Дата создания
   */
  createdAt?: Date | string;

  /**
   * Дата обновления
   */
  updatedAt?: Date | string;

  /**
   * Дополнительные поля
   */
  [key: string]: unknown;
}

/**
 * Режим запуска планирования
 */
export type PlanningMode = 'standard' | 'purchase_assessment' | 'actual_availability';

/**
 * Информация о нехватке материалов для заказа (режим actual_availability)
 */
export interface MaterialShortageInfo {
  orderId: string;
  orderName: string;
  missingMaterials: Array<{
    materialId: string;
    materialName: string;
    required: number;
    available: number;
    shortage: number;
  }>;
}

/**
 * Информация о закупаемом материале (не требующем производства)
 */
export interface PurchasableMaterial {
  /**
   * ID материала
   */
  materialId: string;

  /**
   * Название материала
   */
  materialName: string;

  /**
   * Требуемое количество
   */
  quantity: number;

  /**
   * Причина, почему материал закупаемый
   */
  reason: string;
}

/**
 * Ответ на генерацию производственных заказов
 */
export interface GenerateProductionOrdersResponse {
  /**
   * Обновлённый клиентский заказ с productionOrders
   */
  clientOrder: OrderListItem;

  /**
   * Массив созданных производственных заказов (включая вложенные для ПФ)
   */
  productionOrders: OrderListItem[];

  /**
   * Закупаемые материалы (не требующие производства)
   */
  purchasableMaterials: PurchasableMaterial[];

  /**
   * Предупреждения (не критичные проблемы)
   */
  warnings: string[];

  /**
   * Ошибки (критичные проблемы)
   */
  errors: string[];

  /**
   * Сводная статистика
   */
  summary: {
    /**
     * Всего создано производственных заказов
     */
    totalProductionOrders: number;

    /**
     * Всего закупаемых материалов
     */
    totalPurchasableMaterials: number;

    /**
     * Есть ли ошибки
     */
    hasErrors: boolean;

    /**
     * Есть ли предупреждения
     */
    hasWarnings: boolean;
  };
}

