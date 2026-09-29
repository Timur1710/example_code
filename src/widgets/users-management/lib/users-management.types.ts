/**
 * Типы для виджета управления пользователями
 */

import type { TabsNavMenuItem } from 'src/shared/ui';

/** Доступные вкладки навигации */
export type UsersTab = 'users' | 'roles';

/** Конфигурация пункта меню (алиас для удобства) */
export type UsersNavItem = TabsNavMenuItem<UsersTab>;
