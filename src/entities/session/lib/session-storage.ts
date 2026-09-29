/**
 * Работа с localStorage для сессии пользователя
 */

import {
  AUTH_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_KEY,
} from 'src/shared/config';
import type { User } from 'src/shared/types/auth';

export const sessionStorage = {
  /**
   * Получить токен доступа
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Получить refresh токен
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  },

  /**
   * Получить данные пользователя
   */
  getUser(): User | null {
    const json = localStorage.getItem(AUTH_USER_KEY);
    if (!json) return null;

    try {
      return JSON.parse(json) as User;
    } catch {
      return null;
    }
  },

  /**
   * Сохранить данные сессии
   */
  save(user: User): void {
    localStorage.setItem(AUTH_TOKEN_KEY, user.token);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, user.refresh_token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  /**
   * Очистить данные сессии
   */
  clear(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  /**
   * Проверить, истёк ли токен
   */
  isTokenExpired(user: User): boolean {
    const expiresAt = new Date(user.token_expires_at);
    return expiresAt <= new Date();
  },
};

