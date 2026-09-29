import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { storeToRefs } from 'pinia';
import { useOperationStore, type OperationListItem, type CreateOperationResponse } from 'src/entities/operation';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { RouteDialogTemplate } from 'src/shared/templates';
import { isOperationRow } from '../lib';
import type { OperationsListEmits, OperationsListProps } from './types';

export function useOperationsList(props: OperationsListProps, emit: OperationsListEmits) {
  const $q = useQuasar();
  const router = useRouter();
  // === Store ===
  const operationStore = useOperationStore();
  const { operations, isLoading, error, pagination } = storeToRefs(operationStore);

  // === State ===
  const isCreateDialogOpen = ref(false);
  const isFilterDialogOpen = ref(false);
  const isEditDialogOpen = ref(false);
  const editingOperation = ref<OperationListItem | null>(null);
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
  const isDeleteDialogOpen = ref(false);
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
      name: 'description',
      label: 'Описание',
      field: 'description',
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

  const detailsRouteName = computed(() => `${props.entities ?? 'operation'}-details`);

  /**
   * Загрузить операции для выбранной производственной единицы
   */
  async function fetchOperations(): Promise<void> {
    if (!props.productionUnitId) {
      operationStore.clearOperations();
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

      const response = await operationStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        operationStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load operations', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить операции',
      });
    }
  }

  /**
   * Обработка серверной пагинации/сортировки таблицы
   */
  function handleRequest(requestProps: {
    pagination: {
      page: number;
      rowsPerPage: number;
      sortBy: string;
      descending: boolean;
    };
  }) {
    paginationState.value = {
      ...paginationState.value,
      page: requestProps.pagination.page,
      rowsPerPage: requestProps.pagination.rowsPerPage,
      sortBy: requestProps.pagination.sortBy,
      descending: requestProps.pagination.descending,
    };

    operationStore.setPagination(paginationState.value);
    void fetchOperations();
  }

  /**
   * Обработка поиска
   */
  function handleSearch(): void {
    paginationState.value.page = 1;
    void fetchOperations();
  }

  /**
   * Переключение включения дочерних
   */
  function handleToggleDescendants(): void {
    paginationState.value.page = 1;
    void fetchOperations();
  }

  /**
   * Обновление данных
   */
  function handleRefresh(): void {
    void fetchOperations();
  }

  /**
   * Открыть диалог создания операции
   */
  function handleOpenCreate(): void {
    isCreateDialogOpen.value = true;
  }  
  /**
   * Открыть диалог фильтрации операций
   */
  function handleOpenFilter(): void {
    isFilterDialogOpen.value = true;
  }
  function handleFilterTable(query: string): void {
    filterQuery.value = query;
    paginationState.value.page = 1;
    void fetchOperations();
  }
  /**
   * Нажатие "Изменить" в меню строки
   */
  function handleEditRow(row: TableRow): void {
    if (!isOperationRow(row)) return;
    editingOperation.value = row;
    isEditDialogOpen.value = true;
    emit('edit', row);
  }

  /**
   * Нажатие "Удалить" в меню строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (isDeleteDialogOpen.value) {
      return;
    }

    if (!isOperationRow(row)) {
      return;
    }

    isDeleteDialogOpen.value = true;

    const operation = row;

    $q.dialog({
      title: 'Удалить операцию',
      message: `Удалить операцию "${operation.name}"? Действие нельзя отменить.`,
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
          const isLastRowOnPage = operations.value.length <= 1 && paginationState.value.page > 1;

          try {
            await operationStore.deleteOperation(operation._id);

            if (isLastRowOnPage) {
              paginationState.value.page -= 1;
            }

            selectedRows.value = selectedRows.value.filter(
              (selected) => !isOperationRow(selected) || selected._id !== operation._id,
            );

            // Обновляем пагинацию из store
            if (pagination.value) {
              paginationState.value = {
                ...paginationState.value,
                rowsNumber: pagination.value.rowsNumber,
              };
            }

            // Перезагружаем данные для синхронизации с сервером
            await fetchOperations();

            $q.notify({
              type: 'positive',
              message: `Операция "${operation.name}" удалена`,
            });

            emit('delete', row);
            props.onDeleteRow?.(row);
          } catch (e) {
            console.error('Failed to delete operation', e);
            $q.notify({
              type: 'negative',
              message: 'Не удалось удалить операцию',
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
   * После успешного создания операции перезагрузить список
   */
  async function handleOperationCreated(operation: CreateOperationResponse): Promise<void> {
    paginationState.value.page = 1;
    await fetchOperations();
      const confirmed = await new Promise<boolean>((resolve) => {
        $q.dialog({
          component: RouteDialogTemplate,
          componentProps: {
            item: operation,
            persistent: true,
            show_dialog: true,
          }
        }).onOk(() => resolve(true)).onCancel(() => resolve(false));
      });
      if (confirmed) void router.push({ name: 'operation-details', params: { id: operation._id } });
  }

  async function handleOperationUpdated(): Promise<void> {
    await fetchOperations();
    editingOperation.value = null;
    isEditDialogOpen.value = false;
  }

  function handleEditDialogToggle(next: boolean): void {
    isEditDialogOpen.value = next;
    if (!next) {
      editingOperation.value = null;
    }
  }

  // === Effects ===
  watch(
    () => props.productionUnitId,
    (nextId) => {
      paginationState.value.page = 1;
      if (!nextId) {
        operationStore.clearOperations();
        isCreateDialogOpen.value = false;
        return;
      }
      void fetchOperations();
    },
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
      void fetchOperations();
    }
  });

  return {
    // state
    operations,
    isLoading,
    error,
    columns,
    selectedRows,
    paginationState,
    includeDescendants,
    search,
    isFilterDialogOpen,
    isCreateDialogOpen,
    isEditDialogOpen,
    editingOperation,
    detailsRouteName,
    // handlers
    handleRequest,
    handleSearch,
    handleToggleDescendants,
    handleRefresh,
    handleOpenCreate,
    handleOpenFilter,
    handleEditRow,
    handleDeleteRow,
    handleFilterTable,
    handleOperationCreated,
    handleOperationUpdated,
    handleEditDialogToggle,
  };
}

