/**
 * Типы для шаблона списка альтернатив
 */

/** Базовый тип для альтернативного элемента */
export interface AlternativeItem {
  /** ID элемента */
  _id: string;

  /** Название элемента */
  name: string;

  /** Общее количество (сумма всех партий) */
  totalQuantity?: number;

  /** Количество партий */
  batchCount?: number;

  /** Единица измерения */
  measure?: string;

  /** Дополнительные поля */
  [key: string]: unknown;
}

/** Пропсы для шаблона списка альтернатив */
export interface AlternativesListTemplateProps<T extends AlternativeItem = AlternativeItem> {
  /** Список альтернатив */
  alternatives: T[];

  /** Признак загрузки */
  loading?: boolean;

  /** Placeholder для поля поиска */
  searchPlaceholder?: string;

  /** Текст кнопки "Добавить альтернативу" */
  addButtonText?: string;

  /** Показывать ли количество партий */
  showBatchCount?: boolean;

  /** Тип сущности для формирования ссылок (materials, workers, equipments и т.д.) */
  entityType?: string;

  /** Ошибка поиска */
  searchError?: string | null;

  /** Результаты поиска */
  searchResults?: T[] | null;

  /** Признак загрузки поиска */
  searchLoading?: boolean;
}

/** Эмиты для шаблона списка альтернатив */
export interface AlternativesListTemplateEmits<T extends AlternativeItem = AlternativeItem> {
  /** Добавить альтернативу */
  add: [];

  /** Удалить альтернативу */
  remove: [alternative: T];

  /** Поиск альтернатив */
  search: [query: string];

  /** Выбор альтернативы из поиска */
  select: [alternative: T];
}

/** Тип для обработчика поиска альтернатив */
export type SearchAlternativesHandler = (query: string) => Promise<void> | void;

/** Тип для обработчика обновления альтернатив */
export type UpdateAlternativesHandler = (
  alternativeIds: string[]
) => Promise<void> | void;
