/**
 * Конфигурация пунктов меню навигации
 */

import { SYSTEM_RESOURCES } from 'src/shared/config/permissions';
import type { MenuItemData } from './navigation.types';

/** Базовый путь к иконкам меню */
const ICONS_BASE = '/img/admin-menu';

/** Путь к белым иконкам (для неактивного состояния) */
const WHITE_ICONS = `${ICONS_BASE}/white_icons`;

/** Путь к чёрным иконкам (для активного состояния) */
const BLACK_ICONS = `${ICONS_BASE}/black_icons`;

/**
 * Получить путь к иконке
 */
export function getIconPath(iconName: string, isActive = false): string {
  const folder = isActive ? BLACK_ICONS : WHITE_ICONS;
  return `${folder}/${iconName}.svg`;
}

/**
 * Конфигурация основного меню
 */
export const MENU_ITEMS: MenuItemData[] = [
  {
    key: 'streams',
    labelKey: 'nav.production',
    icon: getIconPath('streams'),
    permission: SYSTEM_RESOURCES.STREAMS,
  },
  {
    key: 'operations',
    labelKey: 'nav.operations',
    icon: getIconPath('operations'),
    permission: SYSTEM_RESOURCES.OPERATIONS,
  },
  {
    key: 'orders',
    labelKey: 'nav.orders',
    icon: getIconPath('orders'),
    permission: SYSTEM_RESOURCES.ORDERS,
  },
  {
    key: 'workers',
    labelKey: 'nav.workers',
    icon: getIconPath('workers'),
    permission: SYSTEM_RESOURCES.WORKERS,
  },
  {
    key: 'materials',
    labelKey: 'nav.materials',
    icon: getIconPath('materials'),
    permission: SYSTEM_RESOURCES.MATERIALS,
  },
  {
    key: 'equipments',
    labelKey: 'nav.equipments',
    icon: getIconPath('equipments'),
    permission: SYSTEM_RESOURCES.EQUIPMENT,
  },
  // {
  //   key: 'directories',
  //   labelKey: 'nav.directories',
  //   icon: getIconPath('directories'),
  //   permission: SYSTEM_RESOURCES.DESKBOOK,
  // },
];
