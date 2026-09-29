/**
 * Типы для шаблона выбора производственной единицы
 */

export interface ProductionUnitSelectionTemplateProps {
  /** Ключ сущности для фильтрации дерева производственных единиц */
  entityKey: string;

  /** Показывать только активные единицы */
  isActive?: boolean;

  /** Текст для пустого дерева */
  emptyText?: string;

  /** Текст для отсутствия результатов поиска */
  noResultsText?: string;

  /** Загрузка */
  loading?: boolean;
}

export interface ProductionUnitSelectionTemplateEmits {
  /** Событие при выборе группы */
  (e: 'select', groupId: string, groupName: string): void;

  /** Событие при сохранении выбранной группы */
  (e: 'confirm', groupId: string, groupName: string): void;
}
