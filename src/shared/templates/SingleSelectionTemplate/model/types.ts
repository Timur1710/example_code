/**
 * Типы для универсального шаблона выбора одной позиции
 */

import type { SelectionItem, PaginationParams } from '../../AlternativesSelectionTemplate/model/types';

/** Пропсы для шаблона выбора одной позиции */
export interface SingleSelectionTemplateProps<T extends SelectionItem = SelectionItem> {
  /** Список элементов для выбора */
  items: T[];

  /** Выбранный элемент (ID) */
  selectedItem: string | null;

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

  /** Заголовок диалога/формы */
  title?: string;

  /** Показывать ли описание элементов */
  showDescription?: boolean;
}

/** Эмиты для шаблона выбора одной позиции */
export interface SingleSelectionTemplateEmits<T extends SelectionItem = SelectionItem> {
  /** Изменение поиска */
  search: [query: string];

  /** Изменение пагинации */
  pagination: [params: Omit<PaginationParams, 'filter'>];

  /** Выбор элемента */
  select: [item: T];

  /** Сброс выбора */
  reset: [];

  /** Подтверждение выбора */
  confirm: [selectedId: string | null];
}

