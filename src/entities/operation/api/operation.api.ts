/**
 * API для работы с операциями
 */

import { apiClient } from 'src/shared/api';
import type {
  OperationsListParams,
  OperationsListResponse,
  OperationInfoResponse,
  OperationListItem,
  CreateOperationRequest,
  CreateOperationResponse,
  UpdateOperationRequest,
  UpdateOperationResponse,
} from '../model/operation.types';

export const operationApi = {
  /**
   * Получить операции по производственной единице с пагинацией
   */
  async getByProductionUnit(
    productionUnitId: string,
    params: OperationsListParams = {}
  ): Promise<OperationsListResponse> {
    const response = await apiClient.get<OperationsListResponse>(
      `/operations/production-unit/${productionUnitId}`,
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
   * Получить все операции с пагинацией
   */
  async getAll(params: OperationsListParams = {}): Promise<OperationsListResponse> {
    const response = await apiClient.get<OperationsListResponse>('/operations/all', {
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
   * Получить детальную информацию об операции
   */
  async getInfoById(id: string): Promise<OperationInfoResponse> {
    const response = await apiClient.get<OperationInfoResponse>(`/operation_info/${id}`);
    return response.data;
  },

  /**
   * Получить операцию по ID
   */
  async getById(id: string): Promise<OperationListItem | null> {
    const response = await apiClient.get<OperationInfoResponse>(`/operation_info/${id}`);
    const operation = response.data?.[0];
    if (!operation) return null;
    
    // Преобразуем OperationInfoDto в OperationListItem
    const result: OperationListItem = {
      _id: operation._id,
      name: operation.name,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
    
    if (operation.description) {
      result.description = operation.description;
    }
    
    return result;
  },

  /**
   * Получить детальную информацию о операциях по запросу
   */
  async getByQuery(query: string, params: OperationsListParams = {}): Promise<OperationsListResponse> {
    // Нет для операции API для query
    const response = await apiClient.get<OperationsListResponse>(`/operations_query/${encodeURIComponent(query)}`,
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
   * Создать новую операцию
   */
  async create(data: CreateOperationRequest): Promise<CreateOperationResponse> {
    const response = await apiClient.post<CreateOperationResponse>('/operation', data);
    return response.data;
  },

  /**
   * Обновить операцию
   */
  async update(data: UpdateOperationRequest): Promise<UpdateOperationResponse> {
    const response = await apiClient.put<UpdateOperationResponse>('/operation', data);
    return response.data;
  },

  /**
   * Удалить операцию
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/operation/${id}`);
  },
};

