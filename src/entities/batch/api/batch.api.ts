/**
 * API для работы с партиями
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateBatchRequest,
  CreateBatchResponse,
  UpdateBatchRequest,
  UpdateBatchResponse,
  BatchesListParams,
  BatchesListResponse,
  BatchListItem,
  BatchInfoResponse,
} from '../model/batch.types';

export const batchApi = {
  /**
   * Получить партии по ID сущности с пагинацией
   */
  async getByEntityId(
    entityId: string,
    params: BatchesListParams = {}
  ): Promise<BatchesListResponse> {
    const response = await apiClient.get<BatchesListResponse>(
      `/batches/entity/${entityId}`,
      {
        params: {
          includeDescendants: params.includeDescendants,
          page: params.page,
          rowsPerPage: params.rowsPerPage,
          sortBy: params.sortBy,
          descending: params.descending,
          search: params.search,
          filter: params.filter,
        },
      }
    );

    return response.data;
  },

  /**
   * Получить все партии с пагинацией
   */
  async getAll(params: BatchesListParams = {}): Promise<BatchesListResponse> {
    const response = await apiClient.get<BatchesListResponse>('/batches/all', {
      params: {
        page: params.page,
        rowsPerPage: params.rowsPerPage,
        sortBy: params.sortBy,
        descending: params.descending,
        search: params.search,
        filter: params.filter,
      },
    });

    return response.data;
  },

  /**
   * Создать новую партию
   */
  async create(data: CreateBatchRequest): Promise<CreateBatchResponse> {
    const response = await apiClient.post<CreateBatchResponse>('/batch', data);
    return response.data;
  },

  /**
   * Обновить партию
   */
  async update(data: UpdateBatchRequest): Promise<UpdateBatchResponse> {
    const response = await apiClient.put<UpdateBatchResponse>('/batch', data);
    return response.data;
  },

  /**
   * Удалить партию
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/batch/${id}`);
  },

  /**
   * Получить детальную информацию о партии
   */
  async getById(id: string): Promise<BatchListItem | null> {
    const response = await apiClient.get<BatchInfoResponse>(`/batch_info/${id}`);
    const batch = response.data?.[0];
    return batch || null;
  },
};
