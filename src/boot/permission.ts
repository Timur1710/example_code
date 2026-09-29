/**
 * Boot file для регистрации директив авторизации
 */

import { defineBoot } from '#q-app/wrappers';
import { vPermission, vPermissionDisabled } from 'src/features/authorization';

export default defineBoot(({ app }) => {
  // Регистрируем директивы глобально
  app.directive('permission', vPermission);
  app.directive('permission-disabled', vPermissionDisabled);
});

