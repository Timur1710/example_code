/**
 * API для работы с заказами
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateOrderRequest,
  UpdateOrderResponse,
  OrdersListParams,
  OrdersListResponse,
  OrderListItem,
  OrderInfoResponse,
  GenerateProductionOrdersResponse,
} from '../model/order.types';

export const orderApi = {
  /**
   * Получить заказы по производственной единице с пагинацией
   */
  async getByProductionUnit(
    productionUnitId: string,
    params: OrdersListParams = {}
  ): Promise<OrdersListResponse> {
    const response = await apiClient.get<OrdersListResponse>(
      `/orders/production-unit/${productionUnitId}`,
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
   * Получить все заказы с пагинацией
   */
  async getAll(params: OrdersListParams = {}): Promise<OrdersListResponse> {
    const response = await apiClient.get<OrdersListResponse>('/orders/all', {
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
   * Создать новый заказ
   *
   * Требования валидации:
   * - Массив materials ОБЯЗАТЕЛЬНО должен содержать минимум 1 материал
   * - Каждый материал должен иметь materialId и quantity > 0
   * - Если материалов нет, будет возвращена ошибка 400 Bad Request
   */
  async create(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>('/order', data);
    return response.data;
  },

  /**
   * Обновить заказ
   *
   * Требования валидации:
   * - _id: ОБЯЗАТЕЛЬНОЕ поле
   * - Если указан массив materials, он ОБЯЗАТЕЛЬНО должен содержать минимум 1 материал
   * - Каждый материал должен иметь materialId и quantity > 0
   * - Если передана пустая array materials, будет возвращена ошибка 400 Bad Request
   */
  async update(data: UpdateOrderRequest): Promise<UpdateOrderResponse> {
    const response = await apiClient.put<UpdateOrderResponse>('/order', data);
    return response.data;
  },

  /**
   * Удалить заказ
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/order/${id}`);
  },

  /**
   * Получить детальную информацию о заказе
   */
  async getById(id: string): Promise<OrderListItem | null> {
    const response = await apiClient.get<OrderInfoResponse>(`/order_info/${id}`);
    const order = response.data?.[0];
    return order || null;
  },

  /**
   * Генерировать производственные заказы из клиентского заказа
   *
   * Создает производственные заказы на основе материалов клиентского заказа.
   * Для каждого материала с потоком производства создается соответствующий
   * производственный заказ с рассчитанным количеством, операциями и ресурсами.
   *
   * @param clientOrderId - ID клиентского заказа
   * @returns Отчет о генерации с созданными заказами, предупреждениями и ошибками
   */
  async generateProductionOrders(
    clientOrderId: string
  ): Promise<GenerateProductionOrdersResponse> {
    const response = await apiClient.post<GenerateProductionOrdersResponse>(
      `/order/${clientOrderId}/generate-production`
    );
    return response.data;
  },
};

