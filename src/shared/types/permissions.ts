/**
 * Типы для системы прав доступа
 * Синхронизированы с бэкендом (backend/src/constants/permissions.constants.ts)
 */

import type { PermissionsMap } from '../config/permissions';

// Re-export PermissionLevel из config (единственный источник)
export type { PermissionLevel, PermissionsMap } from '../config/permissions';

/**
 * Права доступа — объект { resource: level }
 */
export type Permissions = PermissionsMap;

/**
 * Роль пользователя
 */
export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permissions;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Краткая информация о роли (для списков)
 */
export interface RoleInfo {
  _id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

/**
 * Данные для создания роли
 */
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: Permissions;
}

/**
 * Данные для обновления роли
 */
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: Permissions;
}

/**
 * Ответ с системными ресурсами
 */
export interface SystemResourcesResponse {
  resources: string[];
  permissionLevels: string[];
}

/**
 * Проверка требований к правам для маршрута
 */
export interface RoutePermissionMeta {
  /** Требуемый ресурс */
  resource: string;
  /** Требуемый уровень доступа (по умолчанию 'view') */
  level?: 'view' | 'edit';
}

