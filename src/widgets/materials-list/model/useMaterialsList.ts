import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { storeToRefs } from 'pinia';
import { useMaterialStore, type MaterialListItem, type CreateMaterialResponse} from 'src/entities/material';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { RouteDialogTemplate } from 'src/shared/templates';
import { isMaterialRow } from '../lib';
import type { MaterialsListEmits, MaterialsListProps } from './types';

export function useMaterialsList(props: MaterialsListProps, emit: MaterialsListEmits) {
  const $q = useQuasar();
  const router = useRouter();
  // === Store ===
  const materialStore = useMaterialStore();
  const { materials, isLoading, error, pagination, isDeleting } = storeToRefs(materialStore);

  // === State ===
  const isCreateDialogOpen = ref(false);
  const isFilterDialogOpen = ref(false);
  const isEditDialogOpen = ref(false);
  const editingMaterial = ref<MaterialListItem | null>(null);
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
      name: 'quantity',
      label: 'Кол-во',
      field: 'totalQuantity',
      align: 'left',
      filter: 'input',
      sortable: true,
    },
    {
      name: 'type',
      label: 'Тип',
      field: 'type',
      align: 'left',
      filter:'select',
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

  const detailsRouteName = computed(() => `${props.entities ?? 'material'}-details`);

  /**
   * Загрузить материалы для выбранной производственной единицы
   */
  async function fetchMaterials(): Promise<void> {
    if (!props.productionUnitId) {
      materialStore.clearMaterials();
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

      const response = await materialStore.fetchByProductionUnit(props.productionUnitId, params);
      if (response.pagination) {
        paginationState.value = {
          ...paginationState.value,
          ...response.pagination,
        };
        materialStore.setPagination(response.pagination);
      }
    } catch (e) {
      console.error('Failed to load materials', e);
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить материалы',
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

    materialStore.setPagination(paginationState.value);
    void fetchMaterials();
  }

  /**
   * Обработка поиска
   */
  function handleSearch(): void {
    paginationState.value.page = 1;
    void fetchMaterials();
  }

  /**
   * Переключение включения дочерних
   */
  function handleToggleDescendants(): void {
    paginationState.value.page = 1;
    void fetchMaterials();
  }

  /**
   * Обновление данных
   */
  function handleRefresh(): void {
    void fetchMaterials();
  }

  /**
   * Открыть диалог создания материала
   */
  function handleOpenCreate(): void {
    isCreateDialogOpen.value = true;
  }

  /**
   * Открыть диалог фильтрации материалов
   */
  function handleOpenFilter(): void {
    isFilterDialogOpen.value = true;
  }
  
  function handleFilterTable(query: string): void {
    filterQuery.value = query;
    paginationState.value.page = 1;
    void fetchMaterials();
  }
  
  /**
   * Нажатие "Изменить" в меню строки
   */
  function handleEditRow(row: TableRow): void {
    if (!isMaterialRow(row)) return;
    editingMaterial.value = row;
    isEditDialogOpen.value = true;
    emit('edit', row);
  }

  /**
   * Нажатие "Удалить" в меню строки
   */
  function handleDeleteRow(row: TableRow): void {
    if (!isMaterialRow(row) || isDeleting.value) {
      return;
    }

    if (isDeleteDialogOpen.value) {
      return;
    }

    isDeleteDialogOpen.value = true;

    const material = row;

    $q.dialog({
      title: 'Удалить материал',
      message: `Удалить материал "${material.name}"? Действие нельзя отменить.`,
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
          const isLastRowOnPage = materials.value.length <= 1 && paginationState.value.page > 1;

          try {
            await materialStore.deleteMaterial(material._id);

            if (isLastRowOnPage) {
              paginationState.value.page -= 1;
            }

            selectedRows.value = selectedRows.value.filter(
              (selected) => !isMaterialRow(selected) || selected._id !== material._id,
            );

            await fetchMaterials();

            $q.notify({
              type: 'positive',
              message: `Материал "${material.name}" удалён`,
            });

            emit('delete', row);
            props.onDeleteRow?.(row);
          } catch (e) {
            console.error('Failed to delete material', e);
            $q.notify({
              type: 'negative',
              message: 'Не удалось удалить материал',
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
   * После успешного создания материала перезагрузить список
   */
  async function handleMaterialCreated(material: CreateMaterialResponse): Promise<void> {
    paginationState.value.page = 1;
    await fetchMaterials();
      const confirmed = await new Promise<boolean>((resolve) => {
        $q.dialog({
          component: RouteDialogTemplate,
          componentProps: {
            item: material,
            persistent: true,
            show_dialog: true,
          }
        }).onOk(() => resolve(true)).onCancel(() => resolve(false));
      });
      if (confirmed) void router.push({ name: 'material-details', params: { id: material._id } });
  }

  async function handleMaterialUpdated(): Promise<void> {
    await fetchMaterials();
    editingMaterial.value = null;
    isEditDialogOpen.value = false;
  }

  function handleEditDialogToggle(next: boolean): void {
    isEditDialogOpen.value = next;
    if (!next) {
      editingMaterial.value = null;
    }
  }

  // === Effects ===
  watch(
    () => props.productionUnitId,
    (nextId) => {
      paginationState.value.page = 1;
      if (!nextId) {
        materialStore.clearMaterials();
        isCreateDialogOpen.value = false;
        return;
      }
      void fetchMaterials();
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
      void fetchMaterials();
    }
  });

  return {
    // state
    materials,
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
    editingMaterial,
    detailsRouteName,
    // handlers
    handleRequest,
    handleSearch,
    handleToggleDescendants,
    handleRefresh,
    handleOpenCreate,
    handleOpenFilter,
    handleFilterTable,
    handleEditRow,
    handleDeleteRow,
    handleMaterialCreated,
    handleMaterialUpdated,
    handleEditDialogToggle,
  };
}

