import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useEquipmentStore,
  type EquipmentListItem,
  type CreateEquipmentResponse,
} from 'src/entities/equipment';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { RouteDialogTemplate } from 'src/shared/templates';
import { isEquipmentRow } from '../lib';
import type { EquipmentListEmits, EquipmentListProps } from './types';

const ADD_EQUIPMENT_DISABLED_TOOLTIP =
  'Оборудование можно добавлять к цеху, участку, линии, рабочему месту или группе оборудования; у предприятия и папок внутри ветки предприятия размещение не предусмотрено.';

export function useEquipmentList(props: EquipmentListProps, emit: EquipmentListEmits) {
  const $q = useQuasar();
  const router = useRouter();
  // === Store ===
  const equipmentStore = useEquipmentStore();
  const { equipmentList, isLoading, error, pagination, isDeleting } = storeToRefs(equipmentStore);

  // === State ===
  const isCreateDialogOpen = ref(false);
  const isFilterDialogOpen = ref(false);
  const isEditDialogOpen = ref(false);
  const editingEquipment = ref<EquipmentListItem | null>(null);
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
      filter: 'input',
      sortable: true,
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

  const detailsRouteName = computed(() => `${props.entities ?? 'equipment'}-details`);

  const addToolbarDisabled = computed(() => {
    if (!props.productionUnitId) {
      return true;
    }
    if (props.addEquipmentAllowed === false) {
      return true;
    }
    return false;
  });

  const addToolbarTooltip = computed(() =>
    props.addEquipmentAllowed === false ? ADD_EQUIPMENT_DISABLED_TOOLTIP : undefined
  );

  /**
   * Загрузить оборудование для выбранной производственной единицы
   */
  async function fetchEquipment(): Promise<void> {
    if (!props.productionUnitId) {
      equipmentStore.clearEquipment();
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

      const response = await equipmentStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        equipmentStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load equipment', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить оборудование',
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
  }): void {
    paginationState.value = {
      ...paginationState.value,
      page: requestProps.pagination.page,
      rowsPerPage: requestProps.pagination.rowsPerPage,
      sortBy: requestProps.pagination.sortBy,
      descending: requestProps.pagination.descending,
    };

    equipmentStore.setPagination(paginationState.value);
    void fetchEquipment();
  }

  /**
   * Обработка поиска
   */
  function handleSearch(): void {
    paginationState.value.page = 1;
    void fetchEquipment();
  }

  /**
   * Переключение включения дочерних
   */
  function handleToggleDescendants(): void {
    paginationState.value.page = 1;
    void fetchEquipment();
  }

  /**
   * Обновление данных
   */
  function handleRefresh(): void {
    void fetchEquipment();
  }

  /**
   * Открыть диалог создания оборудования
   */
  function handleOpenCreate(): void {
    if (addToolbarDisabled.value) {
      return;
    }
    isCreateDialogOpen.value = true;
  }
  /**
   * Открыть диалог фильтрации оборудования
   */
  function handleOpenFilter(): void {
    isFilterDialogOpen.value = true;
  }
  function handleFilterTable(query: string): void {
    filterQuery.value = query;
    paginationState.value.page = 1;
    void fetchEquipment();
  }
  /**
   * Нажатие "Изменить" в меню строки
   */
  function handleEditRow(row: TableRow): void {
    if (!isEquipmentRow(row)) return;
    editingEquipment.value = row;
    isEditDialogOpen.value = true;
    emit('edit', row);
    props.onEditRow?.(row);
  }

  /**
   * Нажатие "Удалить" в меню строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (!isEquipmentRow(row) || isDeleting.value) {
      return;
    }

    if (isDeleteDialogOpen.value) {
      return;
    }

    isDeleteDialogOpen.value = true;

    const equipment = row;

    $q.dialog({
      title: 'Удалить оборудование',
      message: `Удалить оборудование "${equipment.name}"? Действие нельзя отменить.`,
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
          const isLastRowOnPage = equipmentList.value.length <= 1 && paginationState.value.page > 1;

          try {
            await equipmentStore.deleteEquipment(equipment._id);

            if (isLastRowOnPage) {
              paginationState.value.page -= 1;
            }

            selectedRows.value = selectedRows.value.filter(
              (selected) => !isEquipmentRow(selected) || selected._id !== equipment._id
            );

            await fetchEquipment();

            $q.notify({
              type: 'positive',
              message: `Оборудование "${equipment.name}" удалено`,
            });

            emit('delete', row);
            props.onDeleteRow?.(row);
          } catch (e) {
            console.error('Failed to delete equipment', e);
            $q.notify({
              type: 'negative',
              message: 'Не удалось удалить оборудование',
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
   * После успешного создания оборудования перезагрузить список
   */
  async function handleEquipmentCreated(equipment: CreateEquipmentResponse): Promise<void> {
    paginationState.value.page = 1;
    await fetchEquipment();
    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        component: RouteDialogTemplate,
        componentProps: {
          item: equipment,
          persistent: true,
          show_dialog: true,
        },
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false));
    });
    if (confirmed) void router.push({ name: 'equipment-details', params: { id: equipment._id } });
  }

  async function handleEquipmentUpdated(): Promise<void> {
    await fetchEquipment();
    editingEquipment.value = null;
    isEditDialogOpen.value = false;
  }

  function handleEditDialogToggle(next: boolean): void {
    isEditDialogOpen.value = next;
    if (!next) {
      editingEquipment.value = null;
    }
  }

  // === Effects ===
  watch(
    () => props.productionUnitId,
    (nextId) => {
      paginationState.value.page = 1;
      if (!nextId) {
        equipmentStore.clearEquipment();
        isCreateDialogOpen.value = false;
        return;
      }
      void fetchEquipment();
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
    { deep: true }
  );

  onMounted(() => {
    if (props.productionUnitId) {
      void fetchEquipment();
    }
  });

  return {
    // state
    equipment: equipmentList,
    isLoading,
    error,
    addToolbarDisabled,
    addToolbarTooltip,
    columns,
    selectedRows,
    paginationState,
    includeDescendants,
    search,
    isFilterDialogOpen,
    isCreateDialogOpen,
    isEditDialogOpen,
    editingEquipment,
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
    handleEquipmentCreated,
    handleEquipmentUpdated,
    handleEditDialogToggle,
  };
}
