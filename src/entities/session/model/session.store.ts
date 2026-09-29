/**
 * Pinia store для сессии пользователя
 * Содержит только состояние и простые мутации
 * Роль хранится в systemStore для персистентности
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from 'src/shared/types/auth';
import { UserRole } from 'src/shared/config';
import type { PermissionsMap } from 'src/shared/config/permissions';
import { useSystemStore } from 'src/stores/system-store';

export const useSessionStore = defineStore('session', () => {
  // === State ===
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  // === Getters ===
  const token = computed(() => user.value?.token ?? null);
  const refreshToken = computed(() => user.value?.refresh_token ?? null);
  const permissions = computed<PermissionsMap>(() => user.value?.role_permissions ?? {});

  /** Текущая роль (из system store для персистентности) */
  const role = computed(() => {
    const systemStore = useSystemStore();
    return systemStore.currentRole;
  });

  /** Является ли пользователь администратором */
  const isAdmin = computed(() => role.value === UserRole.ADMINISTRATOR);

  // === Mutations (простые, синхронные) ===

  /**
   * Установить данные сессии
   */
  function setSession(newUser: User, newRole: string): void {
    const systemStore = useSystemStore();

    user.value = newUser;
    systemStore.setRole(newRole);
    isAuthenticated.value = true;
  }

  /**
   * Очистить данные сессии
   */
  function clearSession(): void {
    const systemStore = useSystemStore();

    user.value = null;
    systemStore.clearRole();
    isAuthenticated.value = false;
  }

  /**
   * Проверить наличие разрешения
   */
  function hasPermission(section: string, level: 'view' | 'edit' = 'view'): boolean {
    // Администратор имеет все права
    if (role.value === UserRole.ADMINISTRATOR) return true;

    const perm = permissions.value[section];

    // Нет прав на раздел или явно запрещено
    if (!perm || perm === 'denied') return false;

    // Для просмотра достаточно 'view' или 'edit'
    if (level === 'view') {
      return perm === 'view' || perm === 'edit';
    }

    // Для редактирования нужен именно 'edit'
    return perm === 'edit';
  }

  return {
    // State
    user,
    isAuthenticated,
    // Getters
    role,
    token,
    refreshToken,
    permissions,
    isAdmin,
    // Mutations
    setSession,
    clearSession,
    hasPermission,
  };
});
