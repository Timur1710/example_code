/**
 * Pinia store для потоков
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { streamApi } from '../api/stream.api';
import { useQuasar } from 'quasar';

import type {
  StreamListItem,
  StreamMaterial,
  StreamOperationDto,
  StreamsListParams,
  StreamsListResponse,
  StreamsPaginationMeta,
  UpdateStreamRequest,
  UpdateStreamResponse,
} from './stream.types';

/** Данные формы создания потока */
export interface StreamFormData {
  name: string;
  materialIds: string[];
}

/** Расширенный интерфейс store с методами для работы с конструктором */
export interface StreamStoreWithConstructor {
  setConstructorState: (operations: StreamOperationDto[], productionUnitId: string | null) => void;
  getConstructorState: (productionUnitId: string | null) => StreamOperationDto[] | null;
  clearConstructorState: () => void;
}

export const useStreamStore = defineStore('stream', () => {
  // === State ===
  const streams = ref<StreamListItem[]>([]);
  const selectedStream = ref<StreamListItem | null>(null);
  const pagination = ref<StreamsPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const $q = useQuasar();
  const isLoading = ref(false);
  const isStreamDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const streamDetailsError = ref<string | null>(null);

  // Форма создания потока
  const streamFormData = ref<StreamFormData>({
    name: '',
    materialIds: [],
  });

  // Временное состояние конструктора при создании нового потока
  const constructorState = ref<{
    operations: StreamOperationDto[];
    productionUnitId: string | null;
  } | null>(null);

  // === Getters ===
  const hasStreams = computed(() => streams.value.length > 0);

  // === Actions ===

  /**
   * Загрузить потоки по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: StreamsListParams = {},
  ): Promise<StreamsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await streamApi.getByProductionUnit(productionUnitId, params);
      streams.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки потоков';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить все потоки
   */
  async function fetchAll(params: StreamsListParams = {}): Promise<StreamsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await streamApi.getAll(params);
      streams.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки потоков';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить поток по ID
   */
  async function fetchStreamById(id: string): Promise<StreamListItem | null> {
    isStreamDetailsLoading.value = true;
    streamDetailsError.value = null;

    try {
      const raw = await streamApi.getById(id);
      const stream = Array.isArray(raw) ? (raw[0] ?? null) : raw;

      selectedStream.value = stream;
      if (!stream) {
        streamDetailsError.value = 'Поток не найден';
      } else {
        // Автоматически заполняем streamFormData при загрузке потока
        const materialIds = stream.materials?.map((m: StreamMaterial) => m._id) || [];
        streamFormData.value = {
          name: stream.name || '',
          materialIds,
        };
      }
      return stream;
    } catch (e) {
      streamDetailsError.value = 'Ошибка загрузки потока';
      throw e;
    } finally {
      isStreamDetailsLoading.value = false;
    }
  }

  /**
   * Получить детальную информацию о потоке по запросу
   */
  async function fetchStreamsByQuery(query: string): Promise<StreamsListResponse> {
    isStreamDetailsLoading.value = true;
    streamDetailsError.value = null;
    try {
      const response = await streamApi.getByQuery(query);
      return response;
    } catch (e) {
      streamDetailsError.value = 'По указанным фильтрам потоки не найдены';
      $q.notify({
        type: 'negative',
        message: streamDetailsError.value,
      });
      throw e;
    } finally {
      isStreamDetailsLoading.value = false;
    }
  }

  /**
   * Удалить поток
   */
  async function deleteStream(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await streamApi.delete(id);

      streams.value = streams.value.filter((stream) => stream._id !== id);

      if (selectedStream.value?._id === id) {
        selectedStream.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления потока';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить поток
   */
  async function updateStream(
    payload: UpdateStreamRequest
  ): Promise<UpdateStreamResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await streamApi.update(payload);

      streams.value = streams.value.map((stream) =>
        stream._id === updated._id ? { ...stream, ...updated } : stream
      );

      if (selectedStream.value?._id === updated._id) {
        selectedStream.value = { ...selectedStream.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления потока';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<StreamsPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список потоков
   */
  function clearStreams(): void {
    streams.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранный поток
   */
  function clearSelectedStream(): void {
    selectedStream.value = null;
    streamDetailsError.value = null;
  }

  /**
   * Установить данные формы создания потока
   */
  function setStreamFormData(data: { name: string; materialIds: string[] }): void {
    streamFormData.value = { ...data };
  }

  /**
   * Очистить данные формы создания потока
   */
  function clearStreamFormData(): void {
    streamFormData.value = {
      name: '',
      materialIds: [],
    };
    constructorState.value = null;
  }

  /**
   * Сохранить состояние конструктора
   */
  function setConstructorState(operations: StreamOperationDto[], productionUnitId: string | null): void {
    constructorState.value = {
      operations: JSON.parse(JSON.stringify(operations)),
      productionUnitId,
    };
  }

  /**
   * Получить сохраненное состояние конструктора
   */
  function getConstructorState(productionUnitId: string | null): StreamOperationDto[] | null {
    if (constructorState.value && constructorState.value.productionUnitId === productionUnitId) {
      return JSON.parse(JSON.stringify(constructorState.value.operations));
    }
    return null;
  }

  /**
   * Очистить состояние конструктора
   */
  function clearConstructorState(): void {
    constructorState.value = null;
  }

  return {
    // State
    streams,
    selectedStream,
    pagination,
    isLoading,
    isStreamDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    streamDetailsError,
    streamFormData,
    constructorState,
    // Getters
    hasStreams,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchStreamById,
    fetchStreamsByQuery,
    deleteStream,
    updateStream,
    setPagination,
    clearStreams,
    clearSelectedStream,
    setStreamFormData,
    clearStreamFormData,
    setConstructorState,
    getConstructorState,
    clearConstructorState,
  };
});