/**
 * Composable для работы с правами доступа
 */

import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'src/entities/session';
import { SYSTEM_RESOURCES } from 'src/shared/config/permissions';
import type { PermissionLevel } from 'src/shared/config/permissions';

export function usePermissions() {
  const store = useSessionStore();
  const { role, permissions, isAdmin } = storeToRefs(store);

  /**
   * Проверить наличие прав на раздел
   */
  function hasPermission(section: string, level: 'view' | 'edit' = 'view'): boolean {
    return store.hasPermission(section, level);
  }

  /**
   * Проверить права на просмотр
   */
  function canView(section: string): boolean {
    return hasPermission(section, 'view');
  }

  /**
   * Проверить права на редактирование
   */
  function canEdit(section: string): boolean {
    return hasPermission(section, 'edit');
  }

  /**
   * Получить уровень доступа к разделу
   */
  function getPermissionLevel(section: string): PermissionLevel | null {
    if (isAdmin.value) return 'edit';
    const perm = permissions.value[section];
    return perm ?? null;
  }

  /**
   * Проверить, есть ли доступ хотя бы к одному разделу из списка
   */
  function hasAnyPermission(sections: string[], level: 'view' | 'edit' = 'view'): boolean {
    return sections.some((section) => hasPermission(section, level));
  }

  /**
   * Проверить, есть ли доступ ко всем разделам из списка
   */
  function hasAllPermissions(sections: string[], level: 'view' | 'edit' = 'view'): boolean {
    return sections.every((section) => hasPermission(section, level));
  }

  /**
   * Проверить, является ли пользователь супер-админом (может управлять пользователями)
   */
  const canManageUsers = computed(() => {
    return isAdmin.value || hasPermission(SYSTEM_RESOURCES.SYSTEM, 'edit');
  });

  /**
   * Проверить доступ к настройкам
   */
  const canAccessSettings = computed(() => {
    return hasPermission(SYSTEM_RESOURCES.SETTINGS, 'view');
  });

  return {
    // State
    role,
    permissions,
    isAdmin,
    // Computed
    canManageUsers,
    canAccessSettings,
    // Methods
    hasPermission,
    canView,
    canEdit,
    getPermissionLevel,
    hasAnyPermission,
    hasAllPermissions,
  };
}
