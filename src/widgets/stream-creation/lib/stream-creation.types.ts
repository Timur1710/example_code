/**
 * Типы для виджета создания потока
 */

import type { TabsNavMenuItem } from 'src/shared/ui';

/** Доступные вкладки навигации */
export type StreamCreationTab = 'management' | 'parameters';

/** Конфигурация пункта меню для стандартных табов */
export type StreamCreationNavItem = TabsNavMenuItem<StreamCreationTab>;

/** Конфигурация пункта меню для дополнительных табов (может быть любая строка) */
export type AdditionalStreamNavItem = TabsNavMenuItem<string>;