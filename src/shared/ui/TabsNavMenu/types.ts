/**
 * Типы для компонента TabsNavMenu
 */

/** Пункт горизонтального навигационного меню (табы) */
export interface TabsNavMenuItem<T extends string = string> {
  /** Уникальное значение пункта */
  value: T;
  /** Ключ локализации для названия */
  labelKey?: string;
  /** Название (используется если не задан labelKey) */
  label?: string;
  /** Название иконки Material Icons/Symbols */
  icon?: string;
}

