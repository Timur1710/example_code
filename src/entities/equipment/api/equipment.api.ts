/**
 * API для работы с оборудованием
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateEquipmentRequest,
  CreateEquipmentResponse,
  EquipmentInfoResponse,
  EquipmentListItem,
  EquipmentListParams,
  EquipmentListResponse,
  UpdateEquipmentRequest,
  UpdateEquipmentResponse,
  UpdateEquipmentAlternativesRequest,
  UpdateEquipmentAlternativesResponse,
  GetEquipmentAlternativesResponse,
  SearchEquipmentAlternativesResponse,
} from '../model/equipment.types';

export const equipmentApi = {
  /**
   * Получить оборудование по производственной единице с пагинацией
   */
  async getByProductionUnit(
    productionUnitId: string,
    params: EquipmentListParams = {}
  ): Promise<EquipmentListResponse> {
    const response = await apiClient.get<EquipmentListResponse>(
      `/equipment/production-unit/${productionUnitId}`,
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
   * Получить всё оборудование с пагинацией
   */
  async getAll(params: EquipmentListParams = {}): Promise<EquipmentListResponse> {
    const response = await apiClient.get<EquipmentListResponse>('/equipment/all', {
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
   * Создать новое оборудование
   */
  async create(data: CreateEquipmentRequest): Promise<CreateEquipmentResponse> {
    const response = await apiClient.post<CreateEquipmentResponse>('/equipment', data);
    return response.data;
  },

  /**
   * Обновить оборудование
   */
  async update(data: UpdateEquipmentRequest): Promise<UpdateEquipmentResponse> {
    const response = await apiClient.put<UpdateEquipmentResponse>('/equipment', data);
    return response.data;
  },

  /**
   * Удалить оборудование
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/equipment/${id}`);
  },

  /**
   * Получить оборудование по ID
   */
  async getById(id: string): Promise<EquipmentListItem | null> {
    const response = await apiClient.get<EquipmentInfoResponse>(`/equipment_id/${id}`);
    const equipment = response.data?.[0];
    return equipment || null;
  },

  /**
   * Получить оборудование с его альтернативами
   */
  async getEquipmentAlternatives(id: string): Promise<GetEquipmentAlternativesResponse> {
    const response = await apiClient.get<GetEquipmentAlternativesResponse>(
      `/equipment/alternatives/${id}`
    );
    return response.data;
  },

  /**
   * Обновить список альтернатив оборудования
   */
  async updateEquipmentAlternatives(
    data: UpdateEquipmentAlternativesRequest
  ): Promise<UpdateEquipmentAlternativesResponse> {
    const response = await apiClient.put<UpdateEquipmentAlternativesResponse>(
      '/equipment/alternatives',
      data
    );
    return response.data;
  },

  /**
   * Поиск альтернативного оборудования по названию
   */
  async searchEquipmentAlternatives(name: string): Promise<SearchEquipmentAlternativesResponse> {
    const response = await apiClient.get<SearchEquipmentAlternativesResponse>(
      `/equipment/alternatives/search/${encodeURIComponent(name)}`
    );
    return response.data;
  },
};
