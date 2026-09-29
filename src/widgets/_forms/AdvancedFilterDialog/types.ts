/**
 * Интерфейс для фильтра в таблице
 * Содержит информацию об одном условии фильтрации
 */
export interface Filter {
  /** Уникальный идентификатор фильтра */
  id: number
  
  /** Название поля для фильтрации */
  key: string;
  /** Логическое выражение для фильтрации (например: 'AND', 'OR') */
  math_logical: string | undefined
  /** Условие фильтрации (например: 'равно', 'содержит', 'больше чем') */
  condition: { label: string; value: string } | undefined;
  
  /** Значение для сравнения */
  variable: string[]
}

/**
 * Интерфейс для опции выбора в select компонентах
 * Используется для отображения списка доступных ключей и условий фильтрации
 */
export interface KeyOption {
  /** Отображаемый текст опции */
  label: string
  
  /** Внутреннее значение опции */
  value: string,
  type: string
}
export interface ColumnMeta {
  name: string;
  label: string;
  field: string;
  sortable: boolean;
  filter?: 'input' | 'select' | 'date' | 'number';
};