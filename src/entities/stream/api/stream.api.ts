/**
 * API для работы с потоками
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateStreamRequest,
  CreateStreamResponse,
  StreamsListParams,
  StreamsListResponse,
  UpdateStreamRequest,
  UpdateStreamResponse,
  StreamListItem,
  GetStreamResourcesResponse,
} from '../model/stream.types';

export const streamApi = {
  /**
   * Получить потоки по производственной единице с пагинацией
   */
  async getByProductionUnit(
    productionUnitId: string,
    params: StreamsListParams = {}
  ): Promise<StreamsListResponse> {
    const response = await apiClient.get<StreamsListResponse>(
      `/streams/production-unit/${productionUnitId}`,
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
   * Получить все потоки с пагинацией
   */
  async getAll(params: StreamsListParams = {}): Promise<StreamsListResponse> {
    const response = await apiClient.get<StreamsListResponse>('/streams/all', {
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
   * Создать новый поток
   */
  async create(data: CreateStreamRequest): Promise<CreateStreamResponse> {
    const response = await apiClient.post<CreateStreamResponse>('/stream', data);
    return response.data;
  },

  /**
   * Обновить поток
   */
  async update(data: UpdateStreamRequest): Promise<UpdateStreamResponse> {
    const response = await apiClient.put<UpdateStreamResponse>('/stream', data);
    return response.data;
  },

  /**
   * Удалить поток
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/stream/${id}`);
  },

  /**
   * Получить поток по ID
   */
  async getById(id: string): Promise<StreamListItem | null> {
    const response = await apiClient.get<StreamListItem>(`/stream/${id}`);
    return response.data || null;
  },

    /**
     * Получить детальную информацию о потоках по запросу
     */
    async getByQuery(query: string, params: StreamsListParams = {}): Promise<StreamsListResponse> {
      // Нет для потока API для query
      const response = await apiClient.get<StreamsListResponse>(`/streams_query/${encodeURIComponent(query)}`,
      {
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
   * Получить все ресурсы, используемые в операциях потока
   * Включает полную информацию о материалах, работниках и оборудовании
   * с дополнительными параметрами из условий
   */
  async getResources(streamId: string): Promise<GetStreamResourcesResponse> {
    const response = await apiClient.get<GetStreamResourcesResponse>(
      `/stream/${streamId}/resources`
    );
    return response.data;
  },
};