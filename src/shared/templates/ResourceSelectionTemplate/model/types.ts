/**
 * Типы для шаблона выбора ресурсов
 */

import type { SelectionItem, PaginationParams } from '../../AlternativesSelectionTemplate/model/types';

/** Тип ресурса */
export type ResourceType = 'material' | 'worker' | 'equipment';

/** Пропсы для шаблона выбора ресурсов */
export interface ResourceSelectionTemplateProps {
  /** Тип ресурса для выбора */
  resourceType: ResourceType;

  /** Список элементов для выбора */
  items: SelectionItem[];

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

/** Эмиты для шаблона выбора ресурсов */
export interface ResourceSelectionTemplateEmits {
  /** Изменение поиска */
  search: [query: string];

  /** Изменение пагинации */
  pagination: [params: Omit<PaginationParams, 'filter'>];

  /** Выбор/снятие выбора элемента */
  toggle: [item: SelectionItem];

  /** Выбор всех элементов */
  selectAll: [selected: boolean];

  /** Подтверждение выбора */
  confirm: [selectedIds: string[]];
}

