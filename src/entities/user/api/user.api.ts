/**
 * API для работы с пользователями
 */

import { apiClient } from 'src/shared/api';
import type {
  UsersListResponse,
  UsersListParams,
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  ResetPasswordResponse,
} from '../model/user.types';

export const userApi = {
  /**
   * Получить всех пользователей с пагинацией
   */
  async getAll(params: UsersListParams = {}): Promise<UsersListResponse> {
    const response = await apiClient.get<UsersListResponse>('/users/all', {
      params: {
        page: params.page,
        rowsPerPage: params.rowsPerPage,
        sortBy: params.sortBy,
        descending: params.descending,
        search: params.search,
      },
    });
    return response.data;
  },

  /**
   * Создать пользователя
   */
  async create(data: CreateUserDto): Promise<{ user: CreateUserDto }> {
    const response = await apiClient.post<{ user: CreateUserDto }>('/users', {
      user: data,
    });
    return response.data;
  },

  /**
   * Обновить пользователя
   */
  async update(userId: string, data: Omit<UpdateUserDto, '_id'>): Promise<{ user: UpdateUserDto }> {
    const response = await apiClient.put<{ user: UpdateUserDto }>(`/users/${userId}`, {
      user: data,
    });
    return response.data;
  },

  /**
   * Сбросить пароль пользователя (только для администраторов)
   */
  async resetPassword(data: ResetPasswordDto): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/users/reset-password', data);
    return response.data;
  },

  /**
   * Удалить пользователя
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },
};
