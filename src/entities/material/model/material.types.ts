/**
 * Типы для сущности Material
 */
import type { FeatureField } from 'src/shared/types';

// Тип для характеристик материала
export type MaterialFeature = FeatureField[];

export interface MaterialSupplyRecord {
  /** ID записи поставки */
  _id?: string;

  /** Дата поставки */
  date?: string;

  /** Количество */
  amount?: number;
}

export interface MaterialValue {
  /** Информация о поставках */
  supply?: MaterialSupplyRecord[];
}

/** Элемент списка материалов по производственной единице */
export interface MaterialListItem {
  /** ID материала */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** ID потока, к которому привязан материал */
  s_id?: string;

  /** Название материала */
  name: string;

  /** Тип материала */
  type: MaterialType;

  /** Общее количество материала (сумма всех партий) */
  totalQuantity?: number;

  /** Количество партий материала */
  batchCount?: number;

  /** Единица измерения */
  measure?: string;

  /** Срок поставки */
  delivery_term?: string;

  /** Описание материала */
  description?: string;

  /** Значение/поставки */
  value?: MaterialValue;

  /** Дополнительные характеристики материала */
  feature?: MaterialFeature;

  /** Список ID альтернативных материалов */
  alternative?: string[];

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface MaterialsPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка материалов с пагинацией */
export interface MaterialsListResponse {
  data: MaterialListItem[];
  pagination: MaterialsPaginationMeta;
}

/** Ответ API /material_info */
export type MaterialInfoResponse = MaterialListItem[];

/** Параметры запроса списка материалов */
export interface MaterialsListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;

  /** Фильтровать только материалы с назначенным потоком (s_id) */
  hasStream?: boolean;
}

/** Данные для создания материала */
export interface CreateMaterialRequest {
  /** ID производственной единицы */
  p_id: string;

  /** Название материала */
  name: string;

  /** Тип материала */
  type: string

  /** Начальное количество материала для первой партии */
  batchQuantity?: number;

  /** Единица измерения */
  measure?: string;

  /** Срок поставки */
  delivery_term?: string;

  /** Описание */
  description?: string;

  /** Дополнительные характеристики материала */
  feature?: MaterialFeature;
}

/** Ответ при создании материала */
export type CreateMaterialResponse = MaterialListItem;

/** Данные для обновления материала */
export interface UpdateMaterialRequest {
  /** ID материала */
  _id: string;

  /** ID производственной единицы */
  p_id?: string;

  /** ID потока, к которому относится материал */
  s_id?: string;

  /** Название */
  name?: string;

  /**Тип материала */
  type?: MaterialType;

  /** Количество */
  quantity?: number;

  /** Единица измерения */
  measure?: string;

  /** Срок поставки */
  delivery_term?: string;

  /** Описание */
  description?: string;

  /** Значение/поставки */
  value?: MaterialValue;

  /** Дополнительные характеристики материала */
  feature?: MaterialFeature;
}

export type MaterialType = 'finished_product' | 'semi_finished_product' | 'raw_material'

/** Ответ при обновлении материала */
export type UpdateMaterialResponse = MaterialListItem;

/** DTO для информации об альтернативном материале */
export interface MaterialAlternativeDto {
  /** ID материала */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Название материала */
  name: string;

  /** Единица измерения */
  measure?: string;

  /** Срок поставки */
  delivery_term?: string;

  /** Общее количество материала (сумма всех партий) */
  totalQuantity?: number;

  /** Количество партий материала */
  batchCount?: number;

  /** Значение/поставки */
  value?: MaterialValue;

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;
}

/** Ответ на получение альтернатив материала */
export interface GetMaterialAlternativesResponse {
  /** Основной материал */
  material: MaterialAlternativeDto;

  /** Список альтернативных материалов */
  alternatives: MaterialAlternativeDto[];
}

/** Данные для обновления альтернатив материала */
export interface UpdateMaterialAlternativesRequest {
  /** ID материала, для которого задаются альтернативы */
  _id: string;

  /** Список ID материалов, которые являются альтернативами */
  alternativeIds: string[];
}

/** Ответ при обновлении альтернатив материала */
export type UpdateMaterialAlternativesResponse = MaterialListItem;

/** Ответ на поиск альтернатив материала по имени */
export interface SearchMaterialAlternativesResponse {
  /** Список найденных альтернативных материалов */
  alternatives: MaterialAlternativeDto[];
}

/** Информация о производственной единице */
export interface ProductionUnitDto {
  /** ID производственной единицы */
  _id: string;

  /** Название производственной единицы */
  name: string;
}

/** DTO для операции потока, привязанной к материалу.
 *  Переименовано, чтобы избежать конфликта с типом из сущности Stream.
 */
export interface MaterialStreamOperationDto {
  /** ID операции в потоке */
  _id: string;

  /** ID базовой операции (из коллекции operation) */
  o_id?: string;

  /** Название операции (из коллекции operation) */
  name?: string;

  /** Описание операции */
  description?: string;

  /** Длительность операции */
  duration?: number;

  /** Количество работников */
  workers?: number;

  /** Количество работников (альтернативное поле) */
  workerCount?: number;

  /** Количество работников (поле из API) */
  worker_count?: number;

  /** Позиция операции на канвасе [x, y] */
  position?: number[];

  /** Тип операции (order, operation) */
  type?: string;

  /** Статус операции (active, complete, pending, cancelled) */
  status?: string;

  /** Связи операции */
  relation?: StreamOperationRelationDto[];
}

/** Связь операции потока */
export interface StreamOperationRelationDto {
  /** ID связи */
  _id: string;

  /** ID связанной операции */
  so_id: string;

  /** Функции связи */
  function: unknown[];

  /** Индекс первой точки */
  firstPointIndex: number;

  /** Индекс второй точки */
  secondPointIndex: number;

  /** Условия связи */
  condition: unknown[];

  /** По умолчанию */
  default: boolean;

  /** Результат */
  result: string;

  /** Оператор условия */
  condition_operator: string;

  /** Цвет фона */
  bgr_color: string;
}

/** Структура данных потока с агрегацией */
export interface StreamByMaterialDto {
  /** ID потока */
  _id: string;

  /** ID производственной единицы */
  p_id?: string;

  /** Информация о производственной единице */
  productionUnit?: ProductionUnitDto;

  /** Тип потока (stream, template, subprocess) */
  type?: string;

  /** Статус потока (active, inactive, draft, archived) */
  status?: string;

  /** Название потока */
  name?: string;

  /** Описание потока */
  description?: string;

  /** Массив операций потока с названиями */
  operation?: MaterialStreamOperationDto[];

  /** Комментарий к потоку */
  comment?: unknown;

  /** Массив материалов, привязанных к потоку */
  materials?: Array<{
    _id: string;
    name: string;
    measure?: string;
    delivery_term?: string;
    value?: MaterialValue;
    p_id?: string;
    s_id?: string;
    totalQuantity?: number;
    batchCount?: number;
  }>;
}

/** Ответ на получение данных потока по ID материала */
export type GetStreamByMaterialResponse = StreamByMaterialDto | null;

/** Узел дерева материалов для q-tree (BOM по потоку) */
export interface MaterialTreeNode {
  /** Метка узла (название материала) - обязательное поле для q-tree */
  label: string;

  /** ID материала */
  _id: string;

  /** ID производственной единицы */
  p_id?: string;

  /** ID потока */
  s_id?: string;

  /** Единица измерения */
  measure?: string;

  /** Срок поставки */
  delivery_term?: string;

  /** Общее количество из всех партий */
  totalQuantity?: number;

  /** Количество партий */
  batchCount?: number;

  /** Количество потребляемого материала для потока
   * Сумма всех quantity_consumed из условий ресурсов операций потока
   */
  quantity_consumed?: number;

  /** Дочерние материалы (вложенная иерархия) */
  children?: MaterialTreeNode[];

  /** Альтернативные материалы (IDs) */
  alternative?: string[];

  /** Дополнительные характеристики */
  feature?: MaterialFeature;

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;

  /** Тип узла (для кастомной стилизации в q-tree) */
  nodeType?: 'material' | 'root';

  /** Иконка для узла (опционально, для q-tree) */
  icon?: string;

  /** Флаг развернутости узла (для q-tree) */
  expanded?: boolean;
}

/**
 * Структура:
 * - Корень: текущий материал (m_id)
 * - children: материалы из ресурсов операций потока
 * - Рекурсивно раскрываются материалы с потоками
 * - Листья: материалы без потоков
 */
export type GetBomByStreamResponse = MaterialTreeNode;

