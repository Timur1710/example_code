/**
 * Константы прав доступа к ресурсам
 * Синхронизированы с бэкендом (backend/src/constants/permissions.constants.ts)
 */

/**
 * Системные ресурсы - фиксированный набор ресурсов для permissions
 */
export const SYSTEM_RESOURCES = {
  /** Настройки системы */
  SETTINGS: 'Настройки',
  /** Системные - коллекция users и роли */
  SYSTEM: 'Системные',
  /** Заказы */
  ORDERS: 'Заказы',
  /** Материалы */
  MATERIALS: 'Материалы',
  /** Оборудование */
  EQUIPMENT: 'Оборудование',
  /** Сотрудники */
  WORKERS: 'Сотрудники',
  /** Операции */
  OPERATIONS: 'Операции',
  /** Потоки (производство) */
  STREAMS: 'Потоки',
  // /** Справочники */
  // DESKBOOK: 'Справочники',
} as const;

/**
 * Массив всех системных ресурсов
 */
export const SYSTEM_RESOURCES_LIST: string[] = Object.values(SYSTEM_RESOURCES);

/**
 * Типы прав доступа
 */
export const PERMISSION_LEVELS = {
  /** Только просмотр */
  VIEW: 'view',
  /** Полный доступ (просмотр + редактирование) */
  EDIT: 'edit',
  /** Доступ запрещён */
  DENIED: 'denied',
} as const;

/**
 * Массив всех уровней прав доступа
 */
export const PERMISSION_LEVELS_LIST: string[] = Object.values(PERMISSION_LEVELS);

/**
 * Типы
 */
export type SystemResource = (typeof SYSTEM_RESOURCES)[keyof typeof SYSTEM_RESOURCES];
export type PermissionLevel = (typeof PERMISSION_LEVELS)[keyof typeof PERMISSION_LEVELS];

/**
 * Permissions как Record<string, PermissionLevel> для гибкости
 */
export type PermissionsMap = Record<string, PermissionLevel>;

/**
 * @deprecated Используйте SYSTEM_RESOURCES вместо SectionPermissions
 */
export const SectionPermissions = SYSTEM_RESOURCES;

export type SectionPermission = SystemResource;
