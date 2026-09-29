/**
 * Типы для универсального компонента дерева
 */

/**
 * Базовый интерфейс узла дерева (совместимый с Quasar q-tree)
 */
export interface TreeNode {
  /** Уникальный идентификатор узла */
  id: string;

  /** Ключ сущности-владельца дерева */
  entityKey?: string;

  /** Отображаемое название */
  label: string;

  /** Иконка узла */
  icon?: string;

  /** Код */
  code?: string;

  /** Тип */
  type?: string;

  /** Дочерние узлы */
  children?: TreeNode[];

  /** Есть ли дочерние элементы (для ленивой загрузки) */
  expandable?: boolean;

  /** Использовать ленивую загрузку */
  lazy?: boolean;

  /** Можно ли выбрать узел */
  selectable?: boolean;

  /** Заблокирован ли узел */
  disabled?: boolean;

  /** Заголовок для кастомного рендеринга */
  header?: string;

  /** Дополнительные свойства */
  [key: string]: unknown;

  path?: string,

  parentId?: string | null
}

/**
 * Функция загрузки корневых узлов
 */
export type FetchRootsFn<T extends TreeNode = TreeNode> = () => Promise<T[]>;

/**
 * Функция загрузки дочерних узлов
 */
export type FetchChildrenFn<T extends TreeNode = TreeNode> = (
  parentId: string,
) => Promise<T[]>;

/**
 * Опции для EntityTree компонента
 */
export interface EntityTreeOptions<T extends TreeNode = TreeNode> {
  /** Функция загрузки корневых элементов */
  fetchRoots: FetchRootsFn<T>;

  /** Функция загрузки дочерних элементов (для ленивой загрузки) */
  fetchChildren?: FetchChildrenFn<T>;

  /** Использовать ленивую загрузку */
  lazy?: boolean;

  /** Ключ для идентификации типа сущности */
  entityKey: string;

  /** Заголовок дерева */
  title?: string;

  /** Иконка по умолчанию для узлов */
  defaultIcon?: string;

  /** Показывать иконки */
  showIcons?: boolean;

  /** Разрешить множественный выбор */
  multiple?: boolean;

  /** Фильтрация по тексту */
  filterable?: boolean;
}

/**
 * События компонента EntityTree
 */
export interface EntityTreeEmits<T extends TreeNode = TreeNode> {
  /** Выбран узел */
  (e: 'select', node: T | null): void;

  /** Раскрыт узел */
  (e: 'expand', nodeId: string): void;

  /** Свёрнут узел */
  (e: 'collapse', nodeId: string): void;

  /** Двойной клик по узлу */
  (e: 'dblclick', node: T): void;
}

/**
 * Состояние дерева для синхронизации между компонентами
 */
export interface EntityTreeState<T extends TreeNode = TreeNode> {
  /** Текущие узлы */
  nodes: T[];

  /** Выбранный узел */
  selectedNode: T | null;

  /** ID развёрнутых узлов */
  expandedNodes: string[];

  /** Загрузка */
  isLoading: boolean;

  /** Ошибка */
  error: string | null;
}

