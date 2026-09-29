/**
 * API для аутентификации
 */

import { apiClient } from 'src/shared/api';
import type { LoginCredentials, LoginResponse } from 'src/shared/types/auth';

export const authApi = {
  /**
   * Вход в систему
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/users/login', {
      user: {
        name: credentials.name,
        password: credentials.password,
      },
    });
    return response.data;
  },

  /**
   * Выход из системы (если есть серверный endpoint)
   */
  async logout(): Promise<void> {
    // Если нужен серверный logout:
    // await apiClient.post('/users/logout');
  },
};

