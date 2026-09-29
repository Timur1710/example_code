/**
 * Конфигурация виджета управления пользователями
 */

import type { UsersNavItem } from './users-management.types';

/** Конфигурация пунктов навигационного меню */
export const USERS_NAV_ITEMS: UsersNavItem[] = [
  {
    value: 'users',
    labelKey: 'users_page.user_management',
    icon: 'group',
  },
  {
    value: 'roles',
    labelKey: 'users_page.role_management',
    icon: 'admin_panel_settings',
  },
];
