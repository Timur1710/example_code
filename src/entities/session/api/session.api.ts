/**
 * API для работы с сессией (refresh token)
 */

import { apiClient } from 'src/shared/api';
import type { LoginResponse } from 'src/shared/types/auth';

export const sessionApi = {
  /**
   * Обновить токен
   */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/users/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

