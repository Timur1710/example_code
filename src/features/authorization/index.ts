/**
 * Authorization Feature
 * Авторизация и проверка прав доступа
 */

// Composable
export { usePermissions } from './lib/usePermissions';

// Directives
export { vPermission, vPermissionDisabled } from './lib/permission.directive';

// Guards
export {
  checkRoutePermission,
  getAccessDeniedRedirect,
  createPermissionGuard,
} from './lib/permission.guard';

