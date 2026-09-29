/**
 * API для работы с сотрудниками
 */

import { apiClient } from 'src/shared/api';
import type {
  WorkersSelectorResponse,
  WorkersListParams,
  WorkersListResponse,
  WorkerListItem,
  WorkerDetailResponse,
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  UpdateWorkerResponse,
  GetWorkerAlternativesResponse,
  UpdateWorkerAlternativesRequest,
  UpdateWorkerAlternativesResponse,
  SearchWorkerAlternativesResponse,
} from '../model/worker.types';

export const workerApi = {
  /**
   * Получить всех сотрудников для селектора
   */
  async getAllForSelector(): Promise<WorkersSelectorResponse> {
    const response = await apiClient.get<WorkersSelectorResponse>('/worker');
    return response.data;
  },

  /**
   * Получить работников по производственной единице с операциями
   */
  async getByProductionUnit(productionUnitId: string): Promise<WorkerListItem[]> {
    const response = await apiClient.get<WorkerListItem[]>(
      `/worker/production-unit/${productionUnitId}`
    );
    return response.data;
  },

  /**
   * Получить работников по производственной единице с пагинацией
   */
  async getByProductionUnitPaginated(
    productionUnitId: string,
    params: WorkersListParams = {}
  ): Promise<WorkersListResponse> {
    const response = await apiClient.get<WorkersListResponse>(
      `/workers/production-unit/${productionUnitId}`,
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
   * Получить всех работников с пагинацией
   */
  async getAll(params: WorkersListParams = {}): Promise<WorkersListResponse> {
    const response = await apiClient.get<WorkersListResponse>('/workers/all', {
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
   * Создать нового работника
   */
  async create(data: CreateWorkerRequest): Promise<CreateWorkerResponse> {
    const response = await apiClient.post<CreateWorkerResponse>('/worker', data);
    return response.data;
  },

  /**
   * Получить детальную информацию о работнике по ID
   */
  async getById(id: string): Promise<WorkerDetailResponse> {
    const response = await apiClient.get<WorkerDetailResponse>(`/worker_id/${id}`);
    return response.data;
  },

  /**
   * Обновить работника
   */
  async update(data: UpdateWorkerRequest): Promise<UpdateWorkerResponse> {
    const response = await apiClient.put<UpdateWorkerResponse>('/worker', data);
    return response.data;
  },

  /**
   * Удалить работника
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/worker/${id}`);
  },

  /**
   * Получить работника с его альтернативами
   */
  async getWorkerAlternatives(id: string): Promise<GetWorkerAlternativesResponse> {
    const response = await apiClient.get<GetWorkerAlternativesResponse>(
      `/worker/alternatives/${id}`
    );
    return response.data;
  },

  /**
   * Обновить альтернативы работника
   */
  async updateWorkerAlternatives(
    data: UpdateWorkerAlternativesRequest
  ): Promise<UpdateWorkerAlternativesResponse> {
    const response = await apiClient.put<UpdateWorkerAlternativesResponse>(
      '/worker/alternatives',
      data
    );
    return response.data;
  },

  /**
   * Поиск альтернатив работников по названию
   */
  async searchWorkerAlternatives(name: string): Promise<SearchWorkerAlternativesResponse> {
    const response = await apiClient.get<SearchWorkerAlternativesResponse>(
      `/worker/alternatives/search/${encodeURIComponent(name)}`
    );
    return response.data;
  },
};
