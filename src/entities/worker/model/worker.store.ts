/**
 * Pinia store для работников
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { workerApi } from '../api/worker.api';

import type {
  WorkerListItem,
  WorkerOperation,
  WorkerDetail,
  WorkersListParams,
  WorkersListResponse,
  WorkersPaginationMeta,
  UpdateWorkerRequest,
  UpdateWorkerResponse,
  GetWorkerAlternativesResponse,
  WorkerAlternativeDto,
  WorkerFeature,
  UpdateWorkerAlternativesRequest,
  UpdateWorkerAlternativesResponse,
  SearchWorkerAlternativesResponse,
} from './worker.types';

export const useWorkerStore = defineStore('worker', () => {
  // === State ===
  const workers = ref<WorkerListItem[]>([]);
  const selectedWorker = ref<WorkerDetail | null>(null);
  const pagination = ref<WorkersPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isWorkerDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const workerDetailsError = ref<string | null>(null);

  // === Alternatives State ===
  const workerAlternatives = ref<WorkerAlternativeDto[] | null>(null);
  const isAlternativesLoading = ref(false);
  const alternativesError = ref<string | null>(null);

  // === Alternatives Cache ===
  const alternativesCache = ref<Map<string, WorkerAlternativeDto[]>>(new Map());

  // === Update Alternatives State ===
  const isUpdateAlternativesLoading = ref(false);
  const updateAlternativesError = ref<string | null>(null);

  // === Search Alternatives State ===
  const searchAlternativesResult = ref<{ alternatives: WorkerAlternativeDto[] } | null>(null);
  const isSearchAlternativesLoading = ref(false);
  const searchAlternativesError = ref<string | null>(null);

  // === Getters ===
  const hasWorkers = computed(() => workers.value.length > 0);

  // === Actions ===

  /**
   * Загрузить работников по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: WorkersListParams = {}
  ): Promise<WorkersListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await workerApi.getByProductionUnitPaginated(productionUnitId, params);
      workers.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки работников';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить всех работников
   */
  async function fetchAll(params: WorkersListParams = {}): Promise<WorkersListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await workerApi.getAll(params);

      workers.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки работников';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить детальную информацию о работнике по ID
   */
  async function fetchWorkerById(id: string): Promise<WorkerDetail | null> {
    isWorkerDetailsLoading.value = true;
    workerDetailsError.value = null;

    try {
      const response = await workerApi.getById(id);
      // API возвращает массив с одним элементом
      const worker: WorkerDetail | null =
        response && response.length > 0 ? (response[0] ?? null) : null;
      selectedWorker.value = worker;
      if (!worker) {
        workerDetailsError.value = 'Работник не найден';
      }
      return worker;
    } catch (e) {
      workerDetailsError.value = 'Ошибка загрузки работника';
      throw e;
    } finally {
      isWorkerDetailsLoading.value = false;
    }
  }

  /**
   * Удалить работника
   */
  async function deleteWorker(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await workerApi.delete(id);

      // Удаляем работника из списка
      workers.value = workers.value.filter((worker) => worker._id !== id);

      // Если удаляется выбранный работник, очищаем его
      if (selectedWorker.value?._id === id) {
        selectedWorker.value = null;
      }
    } catch (e) {
      error.value = 'Ошибка удаления работника';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить работника
   */
  async function updateWorker(payload: UpdateWorkerRequest): Promise<UpdateWorkerResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await workerApi.update(payload);
      const currentWorker = workers.value.find((worker) => worker._id === updated._id);

      // Приводим типы для совместимости с WorkerListItem
      const { dob, operation, ...updatedWithoutDobAndOperation } = updated;
      const normalizedOperation: WorkerListItem['operation'] = Array.isArray(operation)
        ? operation.map((op: Partial<WorkerOperation>) => {
            const existingOperation = currentWorker?.operation?.find(
              ({ o_id }) => o_id === op.o_id
            );

            return {
              ...existingOperation,
              ...op,
              // name может отсутствовать в ответе, сохраняем прежнее значение или ставим пустую строку
              name: existingOperation?.name ?? op.name ?? '',
              // гарантируем обязательный o_id для строгой типизации
              o_id: op.o_id ?? existingOperation?.o_id ?? '',
            };
          })
        : (currentWorker?.operation ?? []);
      const updatedWorker: WorkerListItem = {
        ...updatedWithoutDobAndOperation,
        operation: normalizedOperation,
        ...(dob ? { dob: new Date(dob).toISOString().split('T')[0] } : {}),
      };

      workers.value = workers.value.map((worker) =>
        worker._id === updated._id ? { ...worker, ...updatedWorker } : worker
      );

      // Не обновляем selectedWorker, поскольку он содержит детальную информацию
      // и может быть обновлен отдельно через fetchWorkerById

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления работника';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Обновить только характеристики работника
   */
  async function updateWorkerFeature(
    workerId: string,
    feature: WorkerFeature
  ): Promise<UpdateWorkerResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await workerApi.update({
        _id: workerId,
        feature,
      });

      const currentWorker = workers.value.find((worker) => worker._id === updated._id);

      // Приводим типы для совместимости с WorkerListItem
      const { dob, operation, ...updatedWithoutDobAndOperation } = updated;
      const normalizedOperation: WorkerListItem['operation'] = Array.isArray(operation)
        ? operation.map((op: Partial<WorkerOperation>) => {
            const existingOperation = currentWorker?.operation?.find(
              ({ o_id }) => o_id === op.o_id
            );

            return {
              ...existingOperation,
              ...op,
              name: existingOperation?.name ?? op.name ?? '',
              o_id: op.o_id ?? existingOperation?.o_id ?? '',
            };
          })
        : (currentWorker?.operation ?? []);
      const updatedWorker: WorkerListItem = {
        ...updatedWithoutDobAndOperation,
        operation: normalizedOperation,
        ...(dob ? { dob: new Date(dob).toISOString().split('T')[0] } : {}),
      };

      workers.value = workers.value.map((worker) =>
        worker._id === updated._id ? { ...worker, ...updatedWorker } : worker
      );

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления характеристик работника';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<WorkersPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список работников
   */
  function clearWorkers(): void {
    workers.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранного работника
   */
  function clearSelectedWorker(): void {
    selectedWorker.value = null;
    workerDetailsError.value = null;
  }

  /**
   * Получить работника с его альтернативами
   */
  async function fetchWorkerAlternatives(id: string): Promise<GetWorkerAlternativesResponse> {
    isAlternativesLoading.value = true;
    alternativesError.value = null;

    try {
      // Проверяем кэш
      if (alternativesCache.value.has(id)) {
        workerAlternatives.value = alternativesCache.value.get(id)!;
        return {
          worker: {} as WorkerAlternativeDto, // Заглушка, не используется в текущей логике
          alternatives: workerAlternatives.value,
        };
      }

      // Загружаем с сервера и сохраняем в кэш
      const response: GetWorkerAlternativesResponse = await workerApi.getWorkerAlternatives(id);
      alternativesCache.value.set(id, response.alternatives);
      workerAlternatives.value = response.alternatives;
      return response;
    } catch (e) {
      alternativesError.value = 'Ошибка загрузки альтернатив работника';
      throw e;
    } finally {
      isAlternativesLoading.value = false;
    }
  }

  /**
   * Очистить альтернативы работников
   */
  function clearWorkerAlternatives(): void {
    workerAlternatives.value = null;
    alternativesError.value = null;
  }

  /**
   * Очистить кэш альтернатив для конкретного работника
   */
  function clearAlternativesCache(workerId: string): void {
    alternativesCache.value.delete(workerId);
  }

  /**
   * Очистить весь кэш альтернатив
   */
  function clearAllAlternativesCache(): void {
    alternativesCache.value.clear();
  }

  /**
   * Обновить альтернативы работника
   */
  async function updateWorkerAlternatives(
    data: UpdateWorkerAlternativesRequest
  ): Promise<UpdateWorkerAlternativesResponse> {
    isUpdateAlternativesLoading.value = true;
    updateAlternativesError.value = null;

    try {
      const response = await workerApi.updateWorkerAlternatives(data);

      // Очищаем кэш для этого работника, чтобы при следующем запросе загрузить актуальные данные
      clearAlternativesCache(data._id);

      return response;
    } catch (e) {
      updateAlternativesError.value = 'Ошибка обновления альтернатив работника';
      throw e;
    } finally {
      isUpdateAlternativesLoading.value = false;
    }
  }

  /**
   * Поиск альтернатив работников по названию
   * При пустой строке возвращает всех работников
   */
  async function searchWorkerAlternatives(name: string): Promise<SearchWorkerAlternativesResponse> {
    isSearchAlternativesLoading.value = true;
    searchAlternativesError.value = null;

    try {
      let response: SearchWorkerAlternativesResponse;

      if (name.trim() === '') {
        // При пустом поиске получаем всех работников
        const allWorkersResponse = await workerApi.getAll({
          page: 1,
          rowsPerPage: 50,
          sortBy: 'name',
          descending: false,
        });

        // Преобразуем результат в формат поиска альтернатив
        const alternatives = allWorkersResponse.data.map((worker) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { description, feature, alternative, operation, ...alternativeFields } =
            worker;
          return {
            ...alternativeFields,
            operation: operation?.map((op) => ({ o_id: op.o_id, name: op.name })),
          } as WorkerAlternativeDto;
        });

        response = { alternatives };
      } else {
        // При непустом поиске используем обычный поиск
        response = await workerApi.searchWorkerAlternatives(name);
      }

      searchAlternativesResult.value = response;
      return response;
    } catch (e) {
      searchAlternativesError.value = 'Ошибка поиска альтернатив работников';
      throw e;
    } finally {
      isSearchAlternativesLoading.value = false;
    }
  }

  /**
   * Очистить результаты поиска альтернатив
   */
  function clearSearchAlternatives(): void {
    searchAlternativesResult.value = null;
    searchAlternativesError.value = null;
  }

  return {
    // State
    workers,
    selectedWorker,
    pagination,
    isLoading,
    isWorkerDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    workerDetailsError,
    workerAlternatives,
    isAlternativesLoading,
    alternativesError,
    alternativesCache,
    isUpdateAlternativesLoading,
    updateAlternativesError,
    searchAlternativesResult,
    isSearchAlternativesLoading,
    searchAlternativesError,
    // Getters
    hasWorkers,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchWorkerById,
    deleteWorker,
    updateWorker,
    updateWorkerFeature,
    setPagination,
    clearWorkers,
    clearSelectedWorker,
    fetchWorkerAlternatives,
    clearWorkerAlternatives,
    clearAlternativesCache,
    clearAllAlternativesCache,
    updateWorkerAlternatives,
    searchWorkerAlternatives,
    clearSearchAlternatives,
  };
});
