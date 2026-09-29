/**
 * Route guard для проверки прав доступа
 */

import type { RouteLocationNormalized } from 'vue-router';
import { useSessionStore } from 'src/entities/session';

/**
 * Проверить права доступа для маршрута
 */
export function checkRoutePermission(to: RouteLocationNormalized): boolean {
  const store = useSessionStore();

  // Ищем meta.permission в маршруте или его родителях
  const permissionMeta = to.matched
    .map((record) => record.meta.permission)
    .filter(Boolean)
    .pop();

  // Если нет требований к правам — разрешаем
  if (!permissionMeta) {
    return true;
  }

  // Проверяем права
  return store.hasPermission(
    permissionMeta.resource,
    permissionMeta.level ?? 'view'
  );
}

/**
 * Получить URL для редиректа при отсутствии прав
 */
export function getAccessDeniedRedirect(): string {
  return '/access-denied';
}

/**
 * Создать navigation guard для проверки прав
 */
export function createPermissionGuard() {
  return (to: RouteLocationNormalized) => {
    if (!checkRoutePermission(to)) {
      return { path: getAccessDeniedRedirect(), query: { from: to.fullPath } };
    }
    return true;
  };
}
