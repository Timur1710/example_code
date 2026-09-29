/**
 * Слой SHARED
 * Переиспользуемый код без привязки к бизнес-логике
 */

export * from './ui';
export * from './utils';
export * from './api';
export * from './config';
export * from './templates';
export * from './constants';
// Типы экспортируются отдельно чтобы избежать конфликта с config
export type {
  Role,
  RoleInfo,
  CreateRoleDto,
  UpdateRoleDto,
  Permissions,
  SystemResourcesResponse,
  RoutePermissionMeta,
} from './types';
