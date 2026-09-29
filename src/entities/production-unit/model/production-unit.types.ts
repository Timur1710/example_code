/**
 * Типы для производственных единиц
 */

/**
 * Типы производственных единиц
 */
export enum ProductionUnitType {
  ENTERPRISE = 'enterprise',
  WORKSHOP = 'workshop',
  SECTION = 'section',
  LINE = 'line',
  WORKSTATION = 'workstation',
  /** Только дерево размещения оборудования: лист, к узлу крепится оборудование */
  EQUIPMENT_GROUP = 'equipment_group',
  FOLDER = 'folder',
  PROFESSION = 'profession',
}

/**
 * Узел дерева (формат Quasar q-tree)
 */
export interface ProductionUnitTreeNode {
  /** ID узла */
  id: string;

  /** Ключ сущности-владельца дерева */
  entityKey?: string;

  /** Название (label для q-tree) */
  label: string;

  /** Код */
  code?: string;

  /** Тип единицы */
  type?: ProductionUnitType | string;

  /** Иконка (для q-tree) */
  icon?: string;

  /** Уровень вложенности */
  level?: number;

  /** Есть ли дочерние элементы */
  expandable?: boolean;

  /** Отложенная загрузка (для q-tree) */
  lazy?: boolean;

  /** Выбираемый элемент */
  selectable?: boolean;

  /** Заблокированный элемент */
  disabled?: boolean;

  /** Заголовок (для кастомного рендеринга) */
  header?: string;

  /** Дочерние узлы */
  children?: ProductionUnitTreeNode[];

  /** Дополнительные данные */
  isActive?: boolean;
  parentId?: string | null;
  path?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;

  /** Индексная сигнатура для совместимости с TreeNode */
  [key: string]: unknown;
}

/**
 * Полное дерево производственных единиц
 */
export interface ProductionUnitTree {
  nodes: ProductionUnitTreeNode[];
  totalCount: number;
  entityKey?: string;
}

/**
 * Хлебные крошки
 */
export interface ProductionUnitBreadcrumb {
  id: string;
  label: string;
  type: string;
  level: number;
}

/**
 * Детальная информация о единице
 */
export interface ProductionUnitDetail {
  _id: string;
  name: string;
  code?: string;
  type: string;
  entityKey: string;
  parentId: string | null;
  ancestors: string[];
  path: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  parent?: {
    _id: string;
    name: string;
    type: string;
  } | null;
  children?: Array<{
    _id: string;
    name: string;
    type: string;
    isActive: boolean;
  }>;
  breadcrumbs?: ProductionUnitBreadcrumb[];
}

/**
 * Иконки для типов производственных единиц
 */
export const ProductionUnitIcons: Record<ProductionUnitType, string> = {
  [ProductionUnitType.ENTERPRISE]: 'business',
  [ProductionUnitType.WORKSHOP]: 'factory',
  [ProductionUnitType.SECTION]: 'grid_view',
  [ProductionUnitType.LINE]: 'linear_scale',
  [ProductionUnitType.WORKSTATION]: 'computer',
  [ProductionUnitType.EQUIPMENT_GROUP]: 'precision_manufacturing',
  [ProductionUnitType.FOLDER]: 'folder',
  [ProductionUnitType.PROFESSION]: 'engineering',
};

/**
 * Названия типов производственных единиц
 */
export const ProductionUnitTypeLabels: Record<ProductionUnitType, string> = {
  [ProductionUnitType.ENTERPRISE]: 'Предприятие',
  [ProductionUnitType.WORKSHOP]: 'Цех',
  [ProductionUnitType.SECTION]: 'Участок',
  [ProductionUnitType.LINE]: 'Линия',
  [ProductionUnitType.WORKSTATION]: 'Рабочее место',
  [ProductionUnitType.EQUIPMENT_GROUP]: 'Группа оборудования',
  [ProductionUnitType.FOLDER]: 'Папка',
  [ProductionUnitType.PROFESSION]: 'Профессия',
};

/**
 * Ответ API с допустимыми дочерними типами
 */
export interface AllowedChildTypesDto {
  allowedTypes: string[];
  entityKey: string;
  parentId: string | null;
}

/**
 * DTO для создания производственной единицы
 */
export interface CreateProductionUnitDto {
  /** Название */
  name: string;

  /** Ключ сущности-владельца дерева */
  entityKey?: string;

  /** Код/артикул */
  code?: string;

  /** Тип единицы */
  type: ProductionUnitType | string;

  /** ID родительской единицы (null для корневых) */
  parentId?: string | null;

  /** Порядок сортировки */
  sortOrder?: number;

  /** Активна ли единица */
  isActive?: boolean;

  /** Метаданные */
  metadata?: Record<string, unknown>;
}

/**
 * DTO для обновления производственной единицы
 */
export interface UpdateProductionUnitDto {
  id: string
  /** Название */
  name?: string;

  /** Код/артикул */
  code?: string;

  /** Тип единицы */
  type?: ProductionUnitType | string;

  /** Порядок сортировки */
  sortOrder?: number;

  /** Активна ли единица */
  isActive?: boolean;

  /** Метаданные */
  metadata?: Record<string, unknown>;
}

/**
 * Ответ при создании производственной единицы
 */
export interface CreateProductionUnitResponse {
  _id: string;
  name: string;
  code?: string;
  type: string;
  entityKey: string;
  parentId: string | null;
  ancestors: string[];
  path: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ответ при обновлении производственной единицы
 */
export interface ProductionUnitResponseDto {
  _id: string;
  name: string;
  code?: string;
  type: string;
  entityKey: string;
  parentId: string;
  ancestors: string[];
  path: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
