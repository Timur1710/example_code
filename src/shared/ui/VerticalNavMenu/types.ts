/**
 * Типы для компонента VerticalNavMenu
 */

/** Пункт вертикального навигационного меню */
export interface VerticalNavMenuItem<T extends string = string> {
  /** Уникальное значение пункта */
  value: T;
  /** Ключ локализации для названия */
  labelKey?: string;
  /** Название (используется если не задан labelKey) */
  label?: string;
  /** Название иконки Material Icons/Symbols */
  icon: string;
}

