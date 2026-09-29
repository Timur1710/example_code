/**
 * API для работы с производственными единицами
 */

import { apiClient } from 'src/shared/api';
import type {
  ProductionUnitTreeNode,
  ProductionUnitTree,
  ProductionUnitBreadcrumb,
  ProductionUnitDetail,
  CreateProductionUnitDto,
  CreateProductionUnitResponse,
  UpdateProductionUnitDto,
  ProductionUnitResponseDto,
  AllowedChildTypesDto,
} from '../model/production-unit.types';

export interface GetTreeParams {
  parentId?: string | null;
  maxDepth?: number;
  isActive?: boolean;
  entityKey?: string;
}

export const productionUnitApi = {
  /**
   * Получить дерево производственных единиц
   */
  async getTree(params?: GetTreeParams): Promise<ProductionUnitTree> {
    const response = await apiClient.get<ProductionUnitTree>(
      '/production-unit/tree',
      { params },
    );
    return response.data;
  },

  /**
   * Получить корневые элементы
   */
  async getRoots(entityKey: string, isActive?: boolean): Promise<ProductionUnitTreeNode[]> {
    const response = await apiClient.get<ProductionUnitTreeNode[]>(
      '/production-unit/roots',
      { params: { isActive, entityKey } },
    );
    return response.data;
  },

  /**
   * Получить дочерние элементы (для ленивой загрузки)
   */
  async getChildren(
    parentId: string,
    entityKey: string,
    isActive?: boolean,
  ): Promise<ProductionUnitTreeNode[]> {
    const response = await apiClient.get<ProductionUnitTreeNode[]>(
      `/production-unit/children/${parentId}`,
      { params: { isActive, entityKey } },
    );
    return response.data;
  },

  /**
   * Получить хлебные крошки
   */
  async getBreadcrumbs(unitId: string, entityKey?: string): Promise<ProductionUnitBreadcrumb[]> {
    const response = await apiClient.get<ProductionUnitBreadcrumb[]>(
      `/production-unit/breadcrumbs/${unitId}`,
      { params: { entityKey } },
    );
    return response.data;
  },

  /**
   * Получить детальную информацию о единице
   */
  async getDetail(unitId: string, entityKey?: string): Promise<ProductionUnitDetail> {
    const response = await apiClient.get<ProductionUnitDetail>(
      `/production-unit/${unitId}`,
      { params: { entityKey } },
    );
    return response.data;
  },

  /**
   * Поиск единиц по названию или коду
   */
  async search(
    query: string,
    entityKey: string,
    isActive?: boolean,
  ): Promise<ProductionUnitTreeNode[]> {
    const response = await apiClient.get<ProductionUnitTreeNode[]>(
      `/production-unit/search/${encodeURIComponent(query)}`,
      { params: { isActive, entityKey } },
    );
    return response.data;
  },

  /**
   * Получить все ID потомков
   */
  async getDescendantIds(unitId: string, entityKey?: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(
      `/production-unit/descendants/${unitId}`,
      { params: { entityKey } },
    );
    return response.data;
  },

  /**
   * Получить допустимые типы для создания дочернего узла
   */
  async getAllowedTypes(entityKey: string, parentId?: string | null): Promise<AllowedChildTypesDto> {
    const response = await apiClient.get<AllowedChildTypesDto>(
      '/production-unit/allowed-types',
      { params: { entityKey, parentId: parentId ?? undefined } },
    );
    return response.data;
  },

  /**
   * Создать производственную единицу
   */
  async create(data: CreateProductionUnitDto): Promise<CreateProductionUnitResponse> {
    const response = await apiClient.post<CreateProductionUnitResponse>(
      '/production-unit',
      data,
    );
    return response.data;
  },

  /**
   * Изменить производственную единицу
   */
  async update(data: UpdateProductionUnitDto): Promise<ProductionUnitResponseDto> {
    const {id, ...payload} = data
    const response = await apiClient.put<ProductionUnitResponseDto>(
      `/production-unit/${id}`,
      payload
    );
    return response.data
  },

  /**
   * Удалить производственную единицу
   */
  async delete(
    unitId: string,
    cascade?: boolean,
    entityKey?: string,
  ): Promise<{ deletedCount: number }> {
    const response = await apiClient.delete<{ deletedCount: number }>(
      `/production-unit/${unitId}`,
      { params: { cascade, entityKey } },
    );
    return response.data;
  },
};

