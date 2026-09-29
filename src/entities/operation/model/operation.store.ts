/**
 * Pinia store для операций
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { operationApi } from '../api/operation.api';
import { useQuasar } from 'quasar';

import type {
  OperationListItem,
  OperationInfoDto,
  OperationsListParams,
  OperationsListResponse,
  OperationsPaginationMeta,
  OperationInfoResponse,
  CreateOperationRequest,
  CreateOperationResponse,
  UpdateOperationRequest,
  UpdateOperationResponse,
} from './operation.types';

export const useOperationStore = defineStore('operation', () => {
  // === State ===
  const operations = ref<OperationListItem[]>([]);
  const selectedOperation = ref<OperationListItem | null>(null);
  const operationInfo = ref<OperationInfoDto | null>(null);
  const pagination = ref<OperationsPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const $q = useQuasar();
  const isLoading = ref(false);
  const isOperationInfoLoading = ref(false);
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);
  const operationInfoError = ref<string | null>(null);

  // === Getters ===
  const hasOperations = computed(() => operations.value.length > 0);

  // === Actions ===

  /**
   * Загрузить операции по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: OperationsListParams = {}
  ): Promise<OperationsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await operationApi.getByProductionUnit(productionUnitId, params);
      operations.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки операций';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить все операции
   */
  async function fetchAll(params: OperationsListParams = {}): Promise<OperationsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await operationApi.getAll(params);
      operations.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки операций';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить детальную информацию об операции по ID
   */
  async function fetchOperationInfo(id: string): Promise<OperationInfoDto | null> {
    isOperationInfoLoading.value = true;
    operationInfoError.value = null;

    try {
      const response: OperationInfoResponse = await operationApi.getInfoById(id);
      const info = response?.[0] || null;
      operationInfo.value = info;
      if (!info) {
        operationInfoError.value = 'Операция не найдена';
      }
      return info;
    } catch (e) {
      operationInfoError.value = 'Ошибка загрузки информации об операции';
      throw e;
    } finally {
      isOperationInfoLoading.value = false;
    }
  }

  /**
   * Получить операцию по ID
   */
  async function fetchOperationById(id: string): Promise<OperationListItem | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const operation = await operationApi.getById(id);
      selectedOperation.value = operation;
      if (!operation) {
        error.value = 'Операция не найдена';
      }
      return operation;
    } catch (e) {
      error.value = 'Ошибка загрузки операции';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

    /**
     * Получить детальную информацию об операции по запросу
     */
    async function fetchOperationsByQuery(query: string): Promise<OperationsListResponse> {
      isOperationInfoLoading.value = true;
      operationInfoError.value = null;
      try {
        const response = await operationApi.getByQuery(query);
        return response;
      } catch (e) {
        operationInfoError.value = 'По указанным фильтрам операции не найдены';
        $q.notify({
          type: 'negative',
          message: operationInfoError.value,
        });
        throw e;
      } finally {
        isOperationInfoLoading.value = false;
      }
    }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<OperationsPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список операций
   */
  function clearOperations(): void {
    operations.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранную операцию
   */
  function clearSelectedOperation(): void {
    selectedOperation.value = null;
  }

  /**
   * Очистить информацию об операции
   */
  function clearOperationInfo(): void {
    operationInfo.value = null;
    operationInfoError.value = null;
  }

  /**
   * Создать новую операцию
   */
  async function createOperation(
    payload: CreateOperationRequest
  ): Promise<CreateOperationResponse> {
    isCreating.value = true;
    error.value = null;

    try {
      const created = await operationApi.create(payload);

      // Добавляем созданную операцию в список
      operations.value = [created as unknown as OperationListItem, ...operations.value];

      // Обновляем пагинацию
      if (pagination.value.rowsNumber >= 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: pagination.value.rowsNumber + 1,
        };
      }

      return created;
    } catch (e) {
      error.value = 'Ошибка создания операции';
      throw e;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Обновить операцию
   */
  async function updateOperation(
    payload: UpdateOperationRequest
  ): Promise<UpdateOperationResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await operationApi.update(payload);

      // Обновляем операцию в списке
      operations.value = operations.value.map((operation) =>
        operation._id === updated._id ? { ...operation, ...updated } : operation
      );

      // Обновляем выбранную операцию, если она была изменена
      if (selectedOperation.value?._id === updated._id) {
        selectedOperation.value = { ...selectedOperation.value, ...updated };
      }

      // Обновляем информацию об операции, если она была изменена
      if (operationInfo.value?._id === updated._id) {
        operationInfo.value = { ...operationInfo.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления операции';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Обновить ресурсы операции
   */
  async function updateOperationResources(
    operationId: string,
    resources: Array<{ r_id: string; [key: string]: unknown }>
  ): Promise<UpdateOperationResponse> {
    return updateOperation({
      _id: operationId,
      resources,
    });
  }

  /**
   * Добавить ресурс к операции
   */
  async function addOperationResource(
    operationId: string,
    resource: { r_id: string; [key: string]: unknown }
  ): Promise<UpdateOperationResponse> {
    if (!operationInfo.value) {
      throw new Error('Operation info not loaded');
    }

    const currentResources = operationInfo.value.resources || [];
    const updatedResources = [...currentResources, resource];

    return updateOperationResources(operationId, updatedResources);
  }

  /**
   * Удалить ресурс из операции
   */
  async function removeOperationResource(
    operationId: string,
    resourceId: string
  ): Promise<UpdateOperationResponse> {
    if (!operationInfo.value) {
      throw new Error('Operation info not loaded');
    }

    const currentResources = operationInfo.value.resources || [];
    const updatedResources = currentResources.filter((r) => r.r_id !== resourceId);

    return updateOperationResources(operationId, updatedResources);
  }

  /**
   * Обновить ограничения операции
   */
  async function updateOperationConstraints(
    operationId: string,
    constraints: Record<string, unknown>
  ): Promise<UpdateOperationResponse> {
    return updateOperation({
      _id: operationId,
      constraints,
    });
  }

  /**
   * Удалить операцию
   */
  async function deleteOperation(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await operationApi.delete(id);

      // Удаляем операцию из списка
      operations.value = operations.value.filter((operation) => operation._id !== id);

      // Очищаем выбранную операцию, если она была удалена
      if (selectedOperation.value?._id === id) {
        selectedOperation.value = null;
      }

      // Очищаем информацию об операции, если она была удалена
      if (operationInfo.value?._id === id) {
        operationInfo.value = null;
      }

      // Обновляем пагинацию
      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления операции';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  return {
    // State
    operations,
    selectedOperation,
    operationInfo,
    pagination,
    isLoading,
    isOperationInfoLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    operationInfoError,
    // Getters
    hasOperations,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchOperationInfo,
    fetchOperationById,
    fetchOperationsByQuery,
    createOperation,
    updateOperation,
    updateOperationResources,
    addOperationResource,
    removeOperationResource,
    updateOperationConstraints,
    deleteOperation,
    setPagination,
    clearOperations,
    clearSelectedOperation,
    clearOperationInfo,
  };
});

