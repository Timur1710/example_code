/**
 * Composable для управления потоком
 */

import { ref, computed, watch } from 'vue';
import {
  useStreamStore,
  type UpdateStreamRequest,
  type StreamStatus,
  type StreamOperationDto,
  type StreamListItem,
} from 'src/entities/stream';
import type {
  ManagementStreamData,
  ManagementStreamProps,
  ManagementStreamState,
  StreamComment,
} from './management-stream.types';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ObjectId } from 'bson';

/** Генерация уникального ID в формате MongoDB ObjectId */
function getUniqueId(): string {
  return new ObjectId().toHexString();
}

export function useManagementStream(props: Readonly<ManagementStreamProps & { streamId?: string | undefined }>) {
  const streamStore = useStreamStore();
  const $q = useQuasar();
  const { t } = useI18n();

  // === State ===
  const state = ref<ManagementStreamState>({
    stream: null,
    defaultStream: null,
    isLoading: false,
    isSaving: false,
    saved: false,
    error: null,
  });

  // === Computed ===
  
  /** Проверка наличия изменений */
  const isChanged = computed(() => {
    if (!state.value.stream || !state.value.defaultStream) return false;

    return (
      JSON.stringify(state.value.stream.operation) !==
        JSON.stringify(state.value.defaultStream.operation) ||
      state.value.stream.status !== state.value.defaultStream.status ||
      JSON.stringify(state.value.stream.comment) !==
        JSON.stringify(state.value.defaultStream.comment)
    );
  });

  /** Режим редактирования */
  const isEditMode = computed(() => !props.readonly);

  /** Есть ли данные потока */
  const hasStreamData = computed(() => state.value.stream !== null);

  // === Methods ===

  /**
   * Создать новый поток с начальными операциями
   */
  function buildNewStream(): ManagementStreamData {
    const operation: StreamOperationDto[] = [
      {
        position: [0, 0],
        relation: [],
        _id: getUniqueId(),
        type: 'order',
      },
      {
        position: [1, 0],
        relation: [],
        _id: getUniqueId(),
        type: 'order',
      },
    ];

    // Устанавливаем типы операций в зависимости от типа потока
    if (props.streamType !== 'template') {
      if (operation[0]) {
        operation[0].status = 'active';
      }
      if (operation[1]) {
        operation[1].status = 'complete';
      }
    }

    return {
      name: streamStore.streamFormData.name || '',
      description: '',
      type: props.streamType || 'stream',
      status: 'inactive',
      operation,
      comment: [],
      g_id: props.productionUnitId,
    };
  }

  /**
   * Загрузить данные потока
   */
  async function loadStream(): Promise<void> {
    if (!props.streamId) return;

    state.value.isLoading = true;
    state.value.error = null;

    try {
      const streamData = await streamStore.fetchStreamById(props.streamId);
      if (streamData) {
        const streamWithDetails = streamData as StreamListItem & {
          operation?: StreamOperationDto[];
          comment?: unknown[];
        };
        state.value.stream = {
          _id: streamData._id,
          g_id: streamData.p_id,
          name: streamData.name,
          description: streamData.description || '',
          type: streamData.type || 'stream',
          status: streamData.status || 'inactive',
          operation: streamWithDetails.operation || [],
          comment: (streamWithDetails.comment || []) as StreamComment[],
        };
        state.value.defaultStream = JSON.parse(JSON.stringify(state.value.stream));
      }
    } catch (error) {
      state.value.error = t('management_stream.load_error');
      console.error('Failed to load stream:', error);
      $q.notify({
        type: 'negative',
        message: t('management_stream.load_error'),
      });
    } finally {
      state.value.isLoading = false;
    }
  }

  /**
   * Инициализация потока (загрузка или создание нового)
   */
  async function initStream(): Promise<void> {
    // Используем расширенный интерфейс стора с методами для конструктора
    type StoreWithConstructor = typeof streamStore & {
      getConstructorState: (productionUnitId: string | null) => StreamOperationDto[] | null;
      setConstructorState: (operations: StreamOperationDto[], productionUnitId: string | null) => void;
    };
    const storeWithConstructor = streamStore as StoreWithConstructor;
    const savedOperations = storeWithConstructor.getConstructorState(props.productionUnitId);

    if (props.isNew) {
      if (savedOperations && savedOperations.length > 0) {
        // Восстанавливаем состояние из store
        const restoredStream = buildNewStream();
        restoredStream.operation = savedOperations;
        state.value.stream = restoredStream;
        state.value.defaultStream = JSON.parse(JSON.stringify(state.value.stream));
      } else {
        // Создаем новый поток
        state.value.stream = buildNewStream();
        state.value.defaultStream = JSON.parse(JSON.stringify(state.value.stream));
        // Сохраняем начальное состояние в store
        if (state.value.stream.operation) {
          storeWithConstructor.setConstructorState(state.value.stream.operation, props.productionUnitId);
        }
      }
    } else if (props.streamId) {
      // В режиме редактирования сначала загружаем поток
      await loadStream();

      // Если в store есть сохраненное состояние конструктора (например, после
      // переключения вкладок на странице деталей потока), то восстанавливаем его
      if (savedOperations && savedOperations.length > 0 && state.value.stream) {
        state.value.stream.operation = savedOperations;
        state.value.defaultStream = JSON.parse(JSON.stringify(state.value.stream));
      }
    }
  }

  /**
   * Подготовить данные потока для сохранения
   */
  function prepareStreamForSave(stream: ManagementStreamData): UpdateStreamRequest {
    const streamCopy = JSON.parse(JSON.stringify(stream)) as ManagementStreamData;

    // Очистка служебных данных из relations
    streamCopy.operation.forEach((item) => {
      if (item.relation && item.relation.length) {
        item.relation.forEach((rel) => {
          const relRecord = rel as unknown as Record<string, unknown>;
          // Удаляем временные поля из relations
          if ('startId' in relRecord) {
            delete relRecord.startId;
          }
          // Удаляем _id из relations (не должно быть в DTO)
          if ('_id' in relRecord) {
            delete relRecord._id;
          }
          // Удаляем _id из conditions
          if (rel.condition && rel.condition.length) {
            rel.condition.forEach((cond) => {
              if (cond && typeof cond === 'object' && '_id' in cond) {
                delete (cond as Record<string, unknown>)._id;
              }
            });
          }
        });
      }
    });

    const result: UpdateStreamRequest = {
      _id: streamCopy._id!,
      type: streamCopy.type,
      status: streamCopy.status,
      operation: streamCopy.operation,
      comment: streamCopy.comment,
    };

    if (streamCopy.name) {
      result.name = streamCopy.name;
    }

    if (streamCopy.description) {
      result.description = streamCopy.description;
    }

    if (streamCopy.g_id) {
      result.p_id = streamCopy.g_id;
    }

    return result;
  }

  /**
   * Сохранить изменения потока
   */
  async function saveStream(): Promise<void> {
    if (!state.value.stream) return;

    state.value.isSaving = true;
    state.value.error = null;

    try {
      const preparedData = prepareStreamForSave(state.value.stream);
      await streamStore.updateStream(preparedData);

      // Обновляем резервную копию
      state.value.defaultStream = JSON.parse(JSON.stringify(state.value.stream));

      // Показываем уведомление об успешном сохранении
      state.value.saved = true;
      setTimeout(() => {
        state.value.saved = false;
      }, 1000);

      $q.notify({
        type: 'positive',
        message: t('management_stream.save_success'),
      });
    } catch (error) {
      state.value.error = t('management_stream.save_error');
      console.error('Failed to save stream:', error);
      $q.notify({
        type: 'negative',
        message: t('management_stream.save_error'),
      });
    } finally {
      state.value.isSaving = false;
    }
  }

  /**
   * Отменить изменения
   */
  function revertChanges(): void {
    if (state.value.defaultStream) {
      state.value.stream = JSON.parse(JSON.stringify(state.value.defaultStream));
    }
  }

  /**
   * Изменить статус потока
   */
  function changeStatus(status: string): void {
    if (state.value.stream) {
      // Валидация статуса
      const validStatuses: StreamStatus[] = ['active', 'inactive', 'draft', 'archived'];
      if (validStatuses.includes(status as StreamStatus)) {
        state.value.stream.status = status as StreamStatus;
      }
    }
  }

  /**
   * Экспортировать поток в JSON
   */
  function exportStream(): void {
    if (!state.value.stream) return;

    const dataStr = JSON.stringify(state.value.stream, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stream-${state.value.stream.name || 'export'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    $q.notify({
      type: 'positive',
      message: t('management_stream.export_success'),
    });
  }

  /**
   * Обновить операции потока
   */
  function updateOperations(operations: StreamOperationDto[]): void {
    if (state.value.stream) {
      state.value.stream.operation = operations;
    }
  }

  /**
   * Обновить комментарии потока
   */
  function updateComments(comments: StreamComment[]): void {
    if (state.value.stream) {
      state.value.stream.comment = comments;
    }
  }

  // === Lifecycle ===
  
  // Инициализация при монтировании
  watch(
    () => [props.streamId, props.isNew],
    () => {
      void initStream();
    },
    { immediate: true }
  );

  return {
    // State
    state,
    // Computed
    isChanged,
    isEditMode,
    hasStreamData,
    // Methods
    saveStream,
    revertChanges,
    changeStatus,
    exportStream,
    updateOperations,
    updateComments,
    initStream,
  };
}
