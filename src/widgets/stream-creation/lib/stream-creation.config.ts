/**
 * Конфигурация виджета создания потока
 */

import type { StreamCreationNavItem } from './stream-creation.types';

/** Конфигурация пунктов навигационного меню */
export const STREAM_CREATION_NAV_ITEMS: StreamCreationNavItem[] = [
  {
    value: 'management',
    label: 'Управление',
    icon: 'settings',
  },
  {
    value: 'parameters',
    label: 'Параметры',
    icon: 'list',
  },
];