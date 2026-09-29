/**
 * Pinia store для заказов
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { orderApi } from '../api/order.api';
import type {
  OrderListItem,
  OrdersListParams,
  OrdersListResponse,
  OrdersPaginationMeta,
  UpdateOrderRequest,
  UpdateOrderResponse,
} from './order.types';

export const useOrderStore = defineStore('order', () => {
  // === State ===
  const orders = ref<OrderListItem[]>([]);
  const selectedOrder = ref<OrderListItem | null>(null);
  const pagination = ref<OrdersPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isOrderDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const orderDetailsError = ref<string | null>(null);

  // === Getters ===
  const hasOrders = computed(() => orders.value.length > 0);

  // === Actions ===

  /**
   * Загрузить заказы по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: OrdersListParams = {},
  ): Promise<OrdersListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await orderApi.getByProductionUnit(productionUnitId, params);
      orders.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки заказов';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить все заказы
   */
  async function fetchAll(params: OrdersListParams = {}): Promise<OrdersListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await orderApi.getAll(params);
      orders.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки заказов';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить заказ по ID
   */
  async function fetchOrderById(id: string): Promise<OrderListItem | null> {
    isOrderDetailsLoading.value = true;
    orderDetailsError.value = null;

    try {
      const order = await orderApi.getById(id);
      selectedOrder.value = order;
      if (!order) {
        orderDetailsError.value = 'Заказ не найден';
      }
      return order;
    } catch (e) {
      orderDetailsError.value = 'Ошибка загрузки заказа';
      throw e;
    } finally {
      isOrderDetailsLoading.value = false;
    }
  }

  /**
   * Удалить заказ
   */
  async function deleteOrder(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await orderApi.delete(id);

      orders.value = orders.value.filter((order) => order._id !== id);

      if (selectedOrder.value?._id === id) {
        selectedOrder.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления заказа';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить заказ
   */
  async function updateOrder(
    payload: UpdateOrderRequest
  ): Promise<UpdateOrderResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await orderApi.update(payload);

      orders.value = orders.value.map((order) =>
        order._id === updated._id ? { ...order, ...updated } : order
      );

      if (selectedOrder.value?._id === updated._id) {
        selectedOrder.value = { ...selectedOrder.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления заказа';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<OrdersPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список заказов
   */
  function clearOrders(): void {
    orders.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранный заказ
   */
  function clearSelectedOrder(): void {
    selectedOrder.value = null;
    orderDetailsError.value = null;
  }

  return {
    // State
    orders,
    selectedOrder,
    pagination,
    isLoading,
    isOrderDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    orderDetailsError,
    // Getters
    hasOrders,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchOrderById,
    deleteOrder,
    updateOrder,
    setPagination,
    clearOrders,
    clearSelectedOrder,
  };
});

