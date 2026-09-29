import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useOrderStore } from 'src/entities/order';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { isOrderRow } from '../lib';
import type { OrdersListEmits, OrdersListProps } from './types';
import { usePlanningSelectionStore } from 'src/stores/planning-selection.store';

export function useOrdersList(props: OrdersListProps, emit: OrdersListEmits) {
  const $q = useQuasar();
  const router = useRouter();
  
  // === Store ===
  const orderStore = useOrderStore();
  const { orders, isLoading, error, pagination, isDeleting } = storeToRefs(orderStore);

  // === State ===
  const isFilterDialogOpen = ref(false);
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

  // === Planning mode helpers ===
  const getTomorrowDateString = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // === Planning mode state ===
  const isPlanningMode = ref(false);
  const planningTypeModel = ref('direct');
  const planningStartDate = ref<string | null>(getTomorrowDateString());
  const planningTypeOptions = [
    { label: 'Прямое планирование', value: 'direct' }
  ];

  // === Table columns ===
  const columns = computed<QTableColumn[]>(() => [
    {
      name: 'name',
      label: 'Название заказа',
      field: 'name',
      align: 'left',
      filter: 'input',
      sortable: true,
    },
    {
      name: 'type',
      label: 'Тип',
      field: 'type',
      align: 'left',
      filter: 'select',
      sortable: true,
    },
    {
      name: 'orderDate',
      label: 'Дата заказа',
      field: 'orderDate',
      align: 'left',
      filter:'input',
      sortable: true,
    },
    {
      name: 'shipmentDate',
      label: 'Дата отгрузки',
      field: 'shipmentDate',
      align: 'left',
      filter:'input',
      sortable: true,
    },
    {
      name: 'materialsCount',
      label: 'Материалов',
      field: 'materialsCount',
      align: 'left',
      sortable: false,
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

  const detailsRouteName = computed(() => `${props.entities ?? 'order'}-details`);

  /**
   * Dynamic selection mode based on planning mode
   */
  const selectionMode = computed(() => {
    return isPlanningMode.value ? 'multiple' : 'none';
  });

  /**
   * Загрузить заказы для выбранной производственной единицы
   */
  async function fetchOrders(): Promise<void> {
    if (!props.productionUnitId) {
      orderStore.clearOrders();
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

      const response = await orderStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        orderStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить заказы',
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

    orderStore.setPagination(paginationState.value);
    void fetchOrders();
  }

  /**
   * Обработка поиска
   */
  function handleSearch(): void {
    paginationState.value.page = 1;
    void fetchOrders();
  }

  /**
   * Переключение включения дочерних
   */
  function handleToggleDescendants(): void {
    paginationState.value.page = 1;
    void fetchOrders();
  }

  /**
   * Обновление данных
   */
  function handleRefresh(): void {
    void fetchOrders();
  }

  /**
   * Открыть диалог создания заказа
   */
  function handleOpenCreate(): void {
    void router.push({
      name: 'create-order',
      query: props.productionUnitId ? { productionUnitId: props.productionUnitId } : {},
    });
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
    void fetchOrders();
  }

  /**
   * Нажатие "Изменить" в меню строки
   */
  function handleEditRow(row: TableRow): void {
    if (!isOrderRow(row)) return;
    // TODO: Реализовать редактирование когда будут созданы формы
    emit('edit', row);
  }

  /**
   * Нажатие "Удалить" в меню строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (!isOrderRow(row) || isDeleting.value) {
      return;
    }

    if (isDeleteDialogOpen.value) {
      return;
    }

    isDeleteDialogOpen.value = true;

    const order = row;

    $q.dialog({
      title: 'Удалить заказ',
      message: `Удалить заказ "${order.name}"? Действие нельзя отменить.`,
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
          const isLastRowOnPage = orders.value.length <= 1 && paginationState.value.page > 1;

          try {
            await orderStore.deleteOrder(order._id);

            if (isLastRowOnPage) {
              paginationState.value.page -= 1;
            }

            selectedRows.value = selectedRows.value.filter(
              (selected) => !isOrderRow(selected) || selected._id !== order._id,
            );

            await fetchOrders();

            $q.notify({
              type: 'positive',
              message: `Заказ "${order.name}" удалён`,
            });

            emit('delete', row);
            props.onDeleteRow?.(row);
          } catch (e) {
            console.error('Failed to delete order', e);
            $q.notify({
              type: 'negative',
              message: 'Не удалось удалить заказ',
            });
          }
        })();
        isDeleteDialogOpen.value = false;
      })
      .onCancel(() => {
        isDeleteDialogOpen.value = false;
      })
      .onDismiss(() => {
        isDeleteDialogOpen.value = false;
      });
  }

  /**
   * Enter planning mode
   */
  function handleEnterPlanningMode(): void {
    isPlanningMode.value = true;
    selectedRows.value = [];
    planningStartDate.value = getTomorrowDateString();
  }

  /**
   * Cancel planning mode
   */
  function handleCancelPlanning(): void {
    isPlanningMode.value = false;
    selectedRows.value = [];
  }

  /**
   * Build plan and navigate to order-plan page
   */
  function handleBuildPlan(): void {
    const planningStore = usePlanningSelectionStore();

    // Extract order IDs from selected rows
    const orderIds = selectedRows.value
      .filter(isOrderRow)
      .map(order => order._id);

    if (orderIds.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Выберите хотя бы один заказ для планирования',
      });
      return;
    }

    // Save to store
    planningStore.setSelectedOrders(orderIds);
    planningStore.setPlanningType(planningTypeModel.value);
    planningStore.setStartFrom(planningStartDate.value);

    // Navigate to order-plan page
    void router.push({ name: 'order-plan' });
  }

  // === Effects ===
  watch(
    () => props.productionUnitId,
    (nextId) => {
      paginationState.value.page = 1;
      if (!nextId) {
        orderStore.clearOrders();
        return;
      }
      void fetchOrders();
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
      void fetchOrders();
    }
  });

  return {
    // state
    orders,
    isLoading,
    error,
    columns,
    selectedRows,
    paginationState,
    includeDescendants,
    search,
    isFilterDialogOpen,
    detailsRouteName,
    // planning mode state
    isPlanningMode,
    planningTypeModel,
    planningStartDate,
    planningTypeOptions,
    selectionMode,
    // handlers
    handleRequest,
    handleSearch,
    handleToggleDescendants,
    handleRefresh,
    handleOpenFilter,
    handleOpenCreate,
    handleEditRow,
    handleFilterTable,
    handleDeleteRow,
    // planning handlers
    handleEnterPlanningMode,
    handleCancelPlanning,
    handleBuildPlan,
  };
}

