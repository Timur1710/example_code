/**
 * Типы для шаблона выбора альтернатив
 */

/** Базовый тип для элемента выбора */
export interface SelectionItem {
  /** ID элемента */
  _id: string;

  /** Название элемента */
  name: string;

  /** Описание элемента */
  description?: string;

  /** Дополнительные поля */
  [key: string]: unknown;
}

/** Параметры пагинации */
export interface PaginationParams {
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
}

/** Ответ с пагинацией */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
    pagesNumber: number;
    sortBy?: string;
    descending?: boolean;
  };
}

/** Пропсы для шаблона выбора альтернатив */
export interface AlternativesSelectionTemplateProps<T extends SelectionItem = SelectionItem> {
  /** Список элементов для выбора */
  items: T[];

  /** Выбранные элементы (массив ID) */
  selectedItems: string[];

  /** Параметры пагинации */
  pagination: {
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
    pagesNumber: number;
    sortBy?: string;
    descending?: boolean;
  };

  /** Признак загрузки */
  loading?: boolean;

  /** Признак загрузки поиска */
  searchLoading?: boolean;

  /** Ошибка поиска */
  searchError?: string | null;

  /** Placeholder для поля поиска */
  searchPlaceholder?: string;

  /** Текст кнопки выбора */
  selectButtonText?: string;
}

/** Эмиты для шаблона выбора альтернатив */
export interface AlternativesSelectionTemplateEmits<T extends SelectionItem = SelectionItem> {
  /** Изменение поиска */
  search: [query: string];

  /** Изменение пагинации */
  pagination: [params: Omit<PaginationParams, 'filter'>];

  /** Выбор/снятие выбора элемента */
  toggle: [item: T];

  /** Выбор всех элементов */
  selectAll: [selected: boolean];

  /** Сброс выбора */
  reset: [];

  /** Подтверждение выбора */
  confirm: [selectedIds: string[]];
}

/** Тип для обработчика загрузки элементов */
export type LoadItemsHandler<T extends SelectionItem = SelectionItem> = (
  params: PaginationParams
) => Promise<PaginatedResponse<T>> | void;
