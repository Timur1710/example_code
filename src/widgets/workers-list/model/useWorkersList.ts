import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { storeToRefs } from 'pinia';
import { useWorkerStore } from 'src/entities/worker';
import { RouteDialogTemplate } from 'src/shared/templates';
import type { WorkerListItem, CreateWorkerResponse } from 'src/entities/worker/model/worker.types';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { isWorkerRow } from '../lib';
import type { WorkersListEmits, WorkersListProps } from './types';

export function useWorkersList(props: WorkersListProps, emit: WorkersListEmits) {
  const $q = useQuasar();
  const router = useRouter();
  // === Store ===
  const workerStore = useWorkerStore();
  const { workers, isLoading, error, pagination } = storeToRefs(workerStore);

  // === State ===
  const isCreateDialogOpen = ref(false);
  const isFilterDialogOpen = ref(false);
  const isEditDialogOpen = ref(false);
  const editingWorker = ref<WorkerListItem | null>(null);
  const search = ref('');
  const filterQuery = ref<string | undefined>(undefined);
  const selectedRows = ref<TableRow[]>([]);
  const includeDescendants = ref<boolean>(props.includeDescendants ?? true);
  const paginationState = ref({
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0,
    sortBy: 'created',
    descending: true,
  });
  const isDeleteDialogOpen = ref(false);
  //const isRouteDialogOpen = ref(true);

  // === Table columns ===
  const columns = computed<QTableColumn[]>(() => [
    {
      name: 'name',
      label: 'Имя',
      field: 'name',
      align: 'left',
      filter: 'input',
      sortable: true,
    },
    {
      name: 'scheduleTemplateData',
      label: 'График',
      field: 'scheduleTemplateData',
      align: 'left',
      //filter:'select',
      sortable: false,
      type: 'object',
    },
    {
      name: 'updatedAt',
      label: 'Обновлено',
      field: 'updatedAt',
      align: 'left',
      filter: 'input',
      sortable: true,
    },
  ]);

  const detailsRouteName = computed(() => `${props.entities ?? 'worker'}-details`);

  /**
   * Загрузить работников для выбранной производственной единицы
   */
  async function fetchWorkers(): Promise<void> {
    if (!props.productionUnitId) {
      workerStore.clearWorkers();
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

      const response = await workerStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        workerStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load workers', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить работников',
      });
    }
  }

  /**
   * Обработка запроса на изменение страницы/сортировки
   */
  function handleRequest(requestProps: {
    pagination: {
      page: number;
      rowsPerPage: number;
      sortBy: string;
      descending: boolean;
    };
  }): void {
    paginationState.value = {
      ...paginationState.value,
      page: requestProps.pagination.page,
      rowsPerPage: requestProps.pagination.rowsPerPage,
      sortBy: requestProps.pagination.sortBy,
      descending: requestProps.pagination.descending,
    };

    void fetchWorkers();
  }
  function handleFilterTable(query: string): void {
    filterQuery.value = query;
    paginationState.value.page = 1;
    void fetchWorkers();
  }
  /**
   * Обработка поиска
   */
  async function handleSearch(): Promise<void> {
    paginationState.value.page = 1;
    await fetchWorkers();
  }

  /**
   * Обработка переключения "включая дочерние"
   */
  async function handleToggleDescendants(): Promise<void> {
    paginationState.value.page = 1;
    await fetchWorkers();
  }

  /**
   * Обработка открытия диалога создания
   */
  function handleOpenCreate(): void {
    isCreateDialogOpen.value = true;
  }

  /**
   * Обработка открытия диалога фильтрации
   */
  function handleOpenFilter(): void {
    isFilterDialogOpen.value = true;
  }

  /**
   * Обработка открытия диалога редактирования
   */
  function handleEditRow(row: TableRow): void {
    if (isWorkerRow(row)) {
      editingWorker.value = row;
      isEditDialogOpen.value = true;
      emit('edit', row);
    }
  }

  /**
   * Обработка удаления строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (isWorkerRow(row)) {
      emit('delete', row);
    }
  }

  /**
   * Обновление списка после создания/редактирования
   */
  async function handleRefresh(): Promise<void> {
    await fetchWorkers();
  }

  /**
   * Обработка успешного создания работника
   */
  async function handleCreateSuccess(worker: CreateWorkerResponse): Promise<void> {
    isCreateDialogOpen.value = false;
    await fetchWorkers();
    $q.notify({
      type: 'positive',
      message: 'Работник успешно создан',
    });
    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        component: RouteDialogTemplate,
        componentProps: {
          item: worker,
          persistent: true,
          show_dialog: false,
        },
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
    if (confirmed) void router.push({ name: 'worker-details', params: { id: worker._id } });
  }

  /**
   * Обработка успешного редактирования работника
   */
  async function handleEditSuccess(): Promise<void> {
    isEditDialogOpen.value = false;
    editingWorker.value = null;
    await fetchWorkers();
    $q.notify({
      type: 'positive',
      message: 'Работник успешно обновлен',
    });
  }

  /**
   * Обработка отмены создания
   */
  function handleCreateCancel(): void {
    isCreateDialogOpen.value = false;
  }

  /**
   * Обработка отмены редактирования
   */
  function handleEditCancel(): void {
    isEditDialogOpen.value = false;
    editingWorker.value = null;
  }

  /**
   * Обработка переключения состояния диалога создания
   */
  function handleCreateDialogToggle(next: boolean): void {
    isCreateDialogOpen.value = next;
  }

  /**
   * Обработка переключения состояния диалога редактирования
   */
  function handleEditDialogToggle(next: boolean): void {
    isEditDialogOpen.value = next;
    if (!next) {
      editingWorker.value = null;
    }
  }

  // === Watchers ===
  watch(
    () => props.productionUnitId,
    async (newId, oldId) => {
      if (newId !== oldId) {
        paginationState.value.page = 1;
        isCreateDialogOpen.value = false;
        isEditDialogOpen.value = false;
        editingWorker.value = null;
        await fetchWorkers();
      }
    },
    { immediate: true }
  );

  // === Lifecycle ===
  onMounted(async () => {
    await fetchWorkers();
  });

  return {
    // Store
    workers,
    isLoading,
    error,
    pagination,

    // State
    isCreateDialogOpen,
    isFilterDialogOpen,
    isEditDialogOpen,
    editingWorker,
    search,
    selectedRows,
    includeDescendants,
    paginationState,
    isDeleteDialogOpen,

    // Computed
    columns,
    detailsRouteName,

    // Methods
    fetchWorkers,
    handleRequest,
    handleFilterTable,
    handleSearch,
    handleToggleDescendants,
    handleOpenCreate,
    handleOpenFilter,
    handleEditRow,
    handleDeleteRow,
    handleRefresh,
    handleCreateSuccess,
    handleEditSuccess,
    handleCreateCancel,
    handleEditCancel,
    handleCreateDialogToggle,
    handleEditDialogToggle,
  };
}
