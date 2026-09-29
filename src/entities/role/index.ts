/**
 * Role Entity
 * Управление ролями пользователей
 */

// Model
export { useRoleStore } from './model/role.store';

// API
export { roleApi } from './api/role.api';

// Re-export types from permissions
export type {
  Role,
  RoleInfo,
  CreateRoleDto,
  UpdateRoleDto,
  Permissions,
  PermissionLevel,
  PermissionsMap,
  SystemResourcesResponse,
} from 'src/shared/types/permissions';

