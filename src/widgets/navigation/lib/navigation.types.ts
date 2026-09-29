/**
 * Типы для виджета навигации
 */

import type { SectionPermission } from 'src/shared/config/permissions';

export interface MenuItemData {
  /** Уникальный идентификатор (используется как имя роута) */
  key: string;
  /** Ключ перевода для label */
  labelKey: string;
  /** Путь к иконке (SVG) */
  icon?: string | undefined;
  /** Material icon name */
  materialIcon?: string | undefined;
  /** Права доступа (название раздела для проверки) */
  permission: SectionPermission;
  /** Вложенные пункты меню */
  children?: MenuItemData[] | undefined;
  /** Ключ родительского элемента для раскрытия при выборе */
  parentKey?: string | undefined;
}

export interface NavigationConfig {
  /** Ширина развёрнутого меню */
  expandedWidth: number;
  /** Ширина свёрнутого меню */
  collapsedWidth: number;
  /** Breakpoint для автоматического сворачивания (px) */
  autoCollapseBreakpoint: number;
}

export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  expandedWidth: 220,
  collapsedWidth: 90,
  autoCollapseBreakpoint: 863,
};

