/**
 * API для работы с материалами
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateMaterialRequest,
  CreateMaterialResponse,
  GetMaterialAlternativesResponse,
  MaterialsListParams,
  MaterialsListResponse,
  MaterialInfoResponse,
  MaterialListItem,
  UpdateMaterialRequest,
  UpdateMaterialResponse,
  UpdateMaterialAlternativesRequest,
  UpdateMaterialAlternativesResponse,
  SearchMaterialAlternativesResponse,
  GetStreamByMaterialResponse,
  GetBomByStreamResponse,
} from '../model/material.types';

export const materialApi = {
  /**
   * Получить материалы по производственной единице с пагинацией
   */
  async getByProductionUnit(
    productionUnitId: string,
    params: MaterialsListParams = {}
  ): Promise<MaterialsListResponse> {
    const response = await apiClient.get<MaterialsListResponse>(
      `/materials/production-unit/${productionUnitId}`,
      {
        params: {
          includeDescendants: params.includeDescendants,
          page: params.page,
          rowsPerPage: params.rowsPerPage,
          sortBy: params.sortBy,
          descending: params.descending,
          search: params.search,
          filter: params.filter,
          hasStream: params.hasStream,
        },
      }
    );

    return response.data;
  },

  /**
   * Получить все материалы с пагинацией
   */
  async getAll(params: MaterialsListParams = {}): Promise<MaterialsListResponse> {
    const response = await apiClient.get<MaterialsListResponse>('/materials/all', {
      params: {
        page: params.page,
        rowsPerPage: params.rowsPerPage,
        sortBy: params.sortBy,
        descending: params.descending,
        search: params.search,
        filter: params.filter,
        hasStream: params.hasStream,
      },
    });

    return response.data;
  },

  /**
   * Создать новый материал
   */
  async create(data: CreateMaterialRequest): Promise<CreateMaterialResponse> {
    const response = await apiClient.post<CreateMaterialResponse>('/material', data);
    return response.data;
  },

  /**
   * Обновить материал
   */
  async update(data: UpdateMaterialRequest): Promise<UpdateMaterialResponse> {
    const response = await apiClient.put<UpdateMaterialResponse>('/material', data);
    return response.data;
  },

  /**
   * Удалить материал
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/material/${id}`);
  },

  /**
   * Получить детальную информацию о материале
   */
  async getById(id: string): Promise<MaterialListItem | null> {
    const response = await apiClient.get<MaterialInfoResponse>(`/material_info/${id}`);
    const material = response.data?.[0];
    return material || null;
  },

  /**
   * Получить материал с его альтернативами
   */
  async getMaterialAlternatives(id: string): Promise<GetMaterialAlternativesResponse> {
    const response = await apiClient.get<GetMaterialAlternativesResponse>(
      `/material/alternatives/${id}`
    );
    return response.data;
  },

  /**
   * Обновить альтернативы материала
   */
  async updateMaterialAlternatives(
    data: UpdateMaterialAlternativesRequest
  ): Promise<UpdateMaterialAlternativesResponse> {
    const response = await apiClient.put<UpdateMaterialAlternativesResponse>(
      '/material/alternatives',
      data
    );
    return response.data;
  },

  /**
   * Поиск альтернатив материалов по названию
   */
  async searchMaterialAlternatives(name: string): Promise<SearchMaterialAlternativesResponse> {
    const response = await apiClient.get<SearchMaterialAlternativesResponse>(
      `/material/alternatives/search/${encodeURIComponent(name)}`
    );
    return response.data;
  },

  /**
   * Получить данные потока по ID материала
   */
  async getStreamByMaterialId(materialId: string): Promise<GetStreamByMaterialResponse> {
    const response = await apiClient.get<GetStreamByMaterialResponse>(
      `/material/stream/${materialId}`
    );
    return response.data;
  },

  /**
   * Получить иерархическое BOM (Bill of Materials) дерево по материалу через потоки
   * 
   * ЛОГИКА (обновлено):
   * 1. Получает материал по materialId (становится корнем дерева)
   * 2. Извлекает s_id (поток) из материала
   * 3. Получает все операции из потока
   * 4. Извлекает материалы из ресурсов операций (type: "material")
   * 5. Рекурсивно строит дерево для каждого материала с потоком
   * 6. Останавливается на материалах без потоков (листовые узлы)
   * 
   * СТРУКТУРА ДЕРЕВА:
   * - Корень: текущий материал (materialId)
   * - children: материалы из ресурсов операций потока
   * - Вложенные children: материалы из потоков дочерних материалов (рекурсивно)
   * - Листья: материалы без потоков
   * 
   * @param materialId - ID материала (корень дерева)
   * @returns Корневой узел иерархического дерева материалов для q-tree
   * @throws {ApiError} 404 если материал не найден
   * 
   */
  async getBomByStream(materialId: string): Promise<GetBomByStreamResponse> {
    const response = await apiClient.get<GetBomByStreamResponse>(
      `/material/bom/stream/${materialId}`
    );
    return response.data;
  },
};
