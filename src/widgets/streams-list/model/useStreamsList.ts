import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { storeToRefs } from 'pinia';
import { useStreamStore, type StreamListItem, type CreateStreamResponse} from 'src/entities/stream';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { isStreamRow } from '../lib';
import type { StreamsListEmits, StreamsListProps } from './types';

export function useStreamsList(props: StreamsListProps, emit: StreamsListEmits) {
  const $q = useQuasar();
  // === Store ===
  const streamStore = useStreamStore();
  const { streams, isLoading, error, pagination } = storeToRefs(streamStore);

  // === Dialog state ===
  const isCreateDialogOpen = ref(false);
  const isFilterDialogOpen = ref(false);
  const isDeleteDialogOpen = ref(false);

  // === State ===
  const search = ref('');
  const filterQuery = ref<string | undefined>(undefined);
  const selectedRows = ref<TableRow[]>([]);
  const includeDescendants = ref<boolean>(props.includeDescendants ?? true);
  const paginationState = ref({
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  //const isRouteDialogOpen = ref(true);
  // === Table columns ===
  const columns = computed<QTableColumn[]>(() => [
    {
      name: 'name',
      label: 'Наименование',
      field: 'name',
      align: 'left',
      filter:'input',
      sortable: true,
    },
    {
      name: 'updatedAt',
      label: 'Обновлено',
      field: 'updatedAt',
      align: 'left',
      filter:'input',
      sortable: true,
    },
  ]);

  const detailsRouteName = computed(() => `${props.entities ?? 'stream'}-details`);

  /**
   * Загрузить потоки для выбранной производственной единицы
   */
  async function fetchStreams(): Promise<void> {
    if (!props.productionUnitId) {
      streamStore.clearStreams();
      return;
    }

    try {
      const params = {
        page: paginationState.value.page,
        rowsPerPage: paginationState.value.rowsPerPage,
        sortBy: paginationState.value.sortBy,
        descending: paginationState.value.descending,
        includeDescendants: includeDescendants.value,
        ...(search.value ? { search: search.value } : {}),
        ...(filterQuery.value ? { filter: filterQuery.value } : {}),
      };

      const response = await streamStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        streamStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load streams', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить потоки',
      });
    }
  }

  /**
   * Обработчик изменения пагинации
   */
  function handleRequest(requestProps: {
    pagination: {
      page: number;
      rowsPerPage: number;
      sortBy: string;
      descending: boolean;
    };
  }): void {
    const { page, rowsPerPage, sortBy, descending } = requestProps.pagination;
    paginationState.value = { ...paginationState.value, page, rowsPerPage, sortBy, descending };
    void fetchStreams();
  }

  /**
   * Обработчик поиска
   */
  function handleSearch(value: string): void {
    search.value = value;
    paginationState.value.page = 1; // Сброс на первую страницу при поиске
    void fetchStreams();
  }

  /**
   * Обработчик переключения "включая дочерние"
   */
  function handleToggleDescendants(value: boolean): void {
    includeDescendants.value = value;
    paginationState.value.page = 1; // Сброс на первую страницу
    void fetchStreams();
  }

  /**
   * Обновить данные
   */
  function handleRefresh(): void {
    void fetchStreams();
  }

  /**
   * Открыть диалог создания
   */
  function handleOpenCreate(): void {
    isCreateDialogOpen.value = true;
  }  
  /**
   * Открыть диалог фильтрации
   */
  function handleOpenFilter(): void {
    isFilterDialogOpen.value = true;
  }
  function handleFilterTable(query: string): void {
    filterQuery.value = query;
    paginationState.value.page = 1;
    void fetchStreams();
  }
  /**
   * Обработчик редактирования строки
   */
  function handleEditRow(row: TableRow): void {
    if (isStreamRow(row)) {
      emit('edit', row);
    }
  }

  /**
   * Обработчик удаления строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (isDeleteDialogOpen.value) {
      return;
    }

    if (!isStreamRow(row)) {
      return;
    }

    isDeleteDialogOpen.value = true;

    const stream = row;

    $q.dialog({
      title: 'Удалить поток',
      message: `Удалить поток "${stream.name}"? Действие нельзя отменить.`,
      cancel: {
        flat: true,
        label: 'Отмена',
        color: 'primary',
      },
      ok: {
        label: 'Удалить',
        color: 'negative',
      },
      persistent: true,
    })
      .onOk(() => {
        void (async () => {
          const isLastRowOnPage = streams.value.length <= 1 && paginationState.value.page > 1;

          try {
            await streamStore.deleteStream(stream._id);

            if (isLastRowOnPage) {
              paginationState.value.page -= 1;
            }

            selectedRows.value = selectedRows.value.filter(
              (selected) => !isStreamRow(selected) || selected._id !== stream._id,
            );

            // Обновляем пагинацию из store
            if (pagination.value) {
              paginationState.value = {
                ...paginationState.value,
                rowsNumber: pagination.value.rowsNumber,
              };
            }

            // Перезагружаем данные для синхронизации с сервером
            await fetchStreams();

            $q.notify({
              type: 'positive',
              message: `Поток "${stream.name}" удален`,
            });

            emit('delete', row);
            props.onDeleteRow?.(row);
          } catch (e) {
            console.error('Failed to delete stream', e);
            $q.notify({
              type: 'negative',
              message: 'Не удалось удалить поток',
            });
          }
        })();
      })
      .onCancel(() => {
        isDeleteDialogOpen.value = false;
      })
      .onDismiss(() => {
        isDeleteDialogOpen.value = false;
      });
  }

  /**
   * Обработчик создания потока
   */
  function handleStreamCreated(createdStream: CreateStreamResponse): void {
    void fetchStreams();
    $q.notify({
      type: 'positive',
      message: `Поток "${createdStream.name}" успешно создан`,
    });
  }

  /**
   * Обработчик обновления потока
   */
  function handleStreamUpdated(updatedStream: StreamListItem): void {
    void fetchStreams();
    $q.notify({
      type: 'positive',
      message: `Поток "${updatedStream.name}" успешно обновлен`,
    });
  }

  /**
   * Обработчик закрытия диалога редактирования
   */
  function handleEditDialogToggle(): void {
    // TODO: Implement when StreamFormDialog is created
  }

  // === Watchers ===
  watch(
    () => props.productionUnitId,
    (newVal) => {
      if (newVal) {
        void fetchStreams();
      } else {
        streamStore.clearStreams();
      }
    }
  );

  watch(
    () => pagination.value,
    (meta) => {
      if (meta) {
        paginationState.value = {
          ...paginationState.value,
          ...meta,
        };
      }
    },
    { deep: true },
  );

  onMounted(() => {
    if (props.productionUnitId) {
      void fetchStreams();
    }
  });

  return {
    streams,
    isLoading,
    error,
    columns,
    selectedRows,
    paginationState,
    includeDescendants,
    search,
    isFilterDialogOpen,
    detailsRouteName,
    isCreateDialogOpen,
    handleRequest,
    handleSearch,
    handleToggleDescendants,
    handleRefresh,
    handleOpenCreate,
    handleOpenFilter,
    handleEditRow,
    handleDeleteRow,
    handleFilterTable,
    handleStreamCreated,
    handleStreamUpdated,
    handleEditDialogToggle,
  };
}