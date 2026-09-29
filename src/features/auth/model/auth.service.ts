/**
 * Auth Service
 * Оркестрирует API, Storage и Store
 * Можно использовать вне Vue компонентов (в axios interceptors)
 */

import { useSessionStore, sessionStorage, sessionApi } from 'src/entities/session';
import { authApi } from '../api/auth.api';
import type { LoginCredentials } from 'src/shared/types/auth';

export const authService = {
  /**
   * Вход в систему
   */
  async login(credentials: LoginCredentials): Promise<void> {
    const store = useSessionStore();

    const data = await authApi.login(credentials);

    sessionStorage.save(data.user);
    store.setSession(data.user, data.role);
  },

  /**
   * Выход из системы
   */
  logout(): void {
    const store = useSessionStore();

    sessionStorage.clear();
    store.clearSession();
  },

  /**
   * Обновление токена
   */
  async refreshToken(): Promise<boolean> {
    const store = useSessionStore();
    const storedRefreshToken = sessionStorage.getRefreshToken();

    if (!storedRefreshToken) {
      this.logout();
      return false;
    }

    try {
      const data = await sessionApi.refresh(storedRefreshToken);

      sessionStorage.save(data.user);
      store.setSession(data.user, data.role);

      return true;
    } catch {
      this.logout();
      return false;
    }
  },

  /**
   * Инициализация при старте приложения
   */
  initialize(): void {
    const store = useSessionStore();
    const user = sessionStorage.getUser();

    if (!user) return;

    if (sessionStorage.isTokenExpired(user)) {
      sessionStorage.clear();
      return;
    }

    store.setSession(user, user.access);
  },

  /**
   * Проверка авторизации (для route guards)
   */
  isAuthenticated(): boolean {
    const store = useSessionStore();
    return store.isAuthenticated;
  },

  /**
   * Получить текущий токен
   */
  getToken(): string | null {
    const store = useSessionStore();
    return store.token;
  },
};

