/**
 * API для работы с ролями
 */

import { apiClient } from 'src/shared/api';
import type {
  Role,
  RoleInfo,
  CreateRoleDto,
  UpdateRoleDto,
  SystemResourcesResponse,
} from 'src/shared/types/permissions';

export const roleApi = {
  /**
   * Получить список системных ресурсов и уровней доступа
   * Используется для построения UI формы создания/редактирования роли
   */
  async getResources(): Promise<SystemResourcesResponse> {
    const response =
      await apiClient.get<SystemResourcesResponse>('/roles/resources');
    return response.data;
  },

  /**
   * Получить все роли (краткая информация)
   */
  async getAll(): Promise<RoleInfo[]> {
    const response = await apiClient.get<RoleInfo[]>('/roles');
    return response.data;
  },

  /**
   * Получить все роли с полными данными (включая permissions)
   */
  async getAllFull(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles/full');
    return response.data;
  },

  /**
   * Получить роль по ID
   */
  async getById(id: string): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Создать роль
   */
  async create(data: CreateRoleDto): Promise<{ message: string; role: Role }> {
    const response = await apiClient.post<{ message: string; role: Role }>(
      '/roles',
      data,
    );
    return response.data;
  },

  /**
   * Обновить роль
   */
  async update(id: string, data: UpdateRoleDto): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(
      `/roles/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Удалить роль
   */
  async delete(id: string): Promise<{ message: string }> {
    const response =
      await apiClient.delete<{ message: string }>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Удалить несколько ролей
   */
  async deleteMany(ids: string[]): Promise<{ message: string; count: number }> {
    const response = await apiClient.post<{ message: string; count: number }>(
      '/roles/delete_many',
      ids,
    );
    return response.data;
  },
};
