/**
 * Pinia store для партий
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { batchApi } from '../api/batch.api';
import type {
  BatchListItem,
  BatchesListParams,
  BatchesListResponse,
  BatchesPaginationMeta,
  UpdateBatchRequest,
  UpdateBatchResponse,
} from './batch.types';

export const useBatchStore = defineStore('batch', () => {
  // === State ===
  const batches = ref<BatchListItem[]>([]);
  const filteredBatches = ref<BatchListItem[]>([]);
  const selectedBatch = ref<BatchListItem | null>(null);
  const searchQuery = ref('');
  const pagination = ref<BatchesPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isBatchDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const batchDetailsError = ref<string | null>(null);

  // === Getters ===
  const hasBatches = computed(() => batches.value.length > 0);

  // === Actions ===

  /**
   * Загрузить партии по ID сущности
   */
  async function fetchByEntityId(
    entityId: string,
    params: BatchesListParams = {},
  ): Promise<BatchesListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await batchApi.getByEntityId(entityId, params);
      batches.value = response.data;
      // Применяем текущий поисковый запрос к новым данным
      searchBatches(searchQuery.value);
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки партий';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить все партии
   */
  async function fetchAll(params: BatchesListParams = {}): Promise<BatchesListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await batchApi.getAll(params);
      batches.value = response.data;
      // Применяем текущий поисковый запрос к новым данным
      searchBatches(searchQuery.value);
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки партий';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить партию по ID
   */
  async function fetchBatchById(id: string): Promise<BatchListItem | null> {
    isBatchDetailsLoading.value = true;
    batchDetailsError.value = null;

    try {
      const batch = await batchApi.getById(id);
      selectedBatch.value = batch;
      if (!batch) {
        batchDetailsError.value = 'Партия не найдена';
      }
      return batch;
    } catch (e) {
      batchDetailsError.value = 'Ошибка загрузки партии';
      throw e;
    } finally {
      isBatchDetailsLoading.value = false;
    }
  }

  /**
   * Удалить партию
   */
  async function deleteBatch(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await batchApi.delete(id);

      batches.value = batches.value.filter((batch) => batch._id !== id);
      filteredBatches.value = filteredBatches.value.filter((batch) => batch._id !== id);

      if (selectedBatch.value?._id === id) {
        selectedBatch.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления партии';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить партию
   */
  async function updateBatch(
    payload: UpdateBatchRequest
  ): Promise<UpdateBatchResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await batchApi.update(payload);

      batches.value = batches.value.map((batch) =>
        batch._id === updated._id ? { ...batch, ...updated } : batch
      );

      filteredBatches.value = filteredBatches.value.map((batch) =>
        batch._id === updated._id ? { ...batch, ...updated } : batch
      );

      if (selectedBatch.value?._id === updated._id) {
        selectedBatch.value = { ...selectedBatch.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления партии';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Поиск партий по текстовому запросу
   */
  function searchBatches(query: string): void {
    searchQuery.value = query;

    if (!query.trim()) {
      filteredBatches.value = [...batches.value];
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredBatches.value = batches.value.filter((batch) => {
      // Поиск по основным полям
      const searchableFields = [
        batch.name,
        batch.description,
        batch.status,
        batch.quantity?.toString(),
        batch.feature?.['1'], // Особенность
        batch.createdAt ? new Date(batch.createdAt).toLocaleDateString('ru-RU') : '',
        batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString('ru-RU') : '',
      ].filter(Boolean);

      return searchableFields.some(field =>
        typeof field === 'string' && field.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<BatchesPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список партий
   */
  function clearBatches(): void {
    batches.value = [];
    filteredBatches.value = [];
    searchQuery.value = '';
    error.value = null;
  }

  /**
   * Очистить выбранную партию
   */
  function clearSelectedBatch(): void {
    selectedBatch.value = null;
    batchDetailsError.value = null;
  }

  return {
    // State
    batches,
    filteredBatches,
    selectedBatch,
    searchQuery,
    pagination,
    isLoading,
    isBatchDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    batchDetailsError,
    // Getters
    hasBatches,
    // Actions
    fetchByEntityId,
    fetchAll,
    fetchBatchById,
    deleteBatch,
    updateBatch,
    searchBatches,
    setPagination,
    clearBatches,
    clearSelectedBatch,
  };
});
