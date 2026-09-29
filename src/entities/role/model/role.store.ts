/**
 * Pinia store для ролей
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Role, RoleInfo } from 'src/shared/types/permissions';
import { roleApi } from '../api/role.api';

export const useRoleStore = defineStore('role', () => {
  // === State ===
  const roles = ref<RoleInfo[]>([]);
  const currentRole = ref<Role | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // === Getters ===
  const roleNames = computed(() => roles.value.map((r) => r.name));

  const getRoleById = computed(() => (id: string) =>
    roles.value.find((r) => r._id === id)
  );

  // === Actions ===

  /**
   * Загрузить все роли
   */
  async function fetchRoles(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      roles.value = await roleApi.getAll();
    } catch (e) {
      error.value = 'Ошибка загрузки ролей';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить роль по ID
   */
  async function fetchRoleById(id: string): Promise<Role> {
    isLoading.value = true;
    error.value = null;

    try {
      const role = await roleApi.getById(id);
      currentRole.value = role;
      return role;
    } catch (e) {
      error.value = 'Ошибка загрузки роли';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Очистить текущую роль
   */
  function clearCurrentRole(): void {
    currentRole.value = null;
  }

  return {
    // State
    roles,
    currentRole,
    isLoading,
    error,
    // Getters
    roleNames,
    getRoleById,
    // Actions
    fetchRoles,
    fetchRoleById,
    clearCurrentRole,
  };
});

