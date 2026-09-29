/**
 * Composable для использования в Vue компонентах
 * Добавляет интеграцию с роутером
 */

import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useSessionStore } from 'src/entities/session';
import { authService } from '../model/auth.service';
import type { LoginCredentials } from 'src/shared/types/auth';

export function useAuth() {
  const store = useSessionStore();
  const router = useRouter();

  // Реактивные refs для template
  const { user, role, isAuthenticated, isAdmin, permissions, token } = storeToRefs(store);

  /**
   * Вход в систему
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    await authService.login(credentials);
  }

  /**
   * Вход с редиректом
   */
  async function loginAndRedirect(
    credentials: LoginCredentials,
    redirectTo = '/'
  ): Promise<void> {
    await authService.login(credentials);
    await router.push(redirectTo);
  }

  /**
   * Выход из системы
   */
  function logout(): void {
    authService.logout();
  }

  /**
   * Выход с редиректом на страницу входа
   */
  function logoutAndRedirect(redirectTo = '/login'): void {
    authService.logout();
    void router.push(redirectTo);
  }

  /**
   * Проверка разрешения
   */
  function hasPermission(section: string, level: 'view' | 'edit' = 'view'): boolean {
    return store.hasPermission(section, level);
  }

  /**
   * Инициализация авторизации из localStorage
   */
  function initialize(): void {
    authService.initialize();
  }

  /**
   * Обновление токена
   */
  async function refreshToken(): Promise<boolean> {
    return authService.refreshToken();
  }

  return {
    // Reactive state
    user,
    role,
    isAuthenticated,
    isAdmin,
    permissions,
    token,
    // Actions
    login,
    loginAndRedirect,
    logout,
    logoutAndRedirect,
    hasPermission,
    initialize,
    refreshToken,
  };
}

