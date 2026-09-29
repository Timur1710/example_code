<template>
  <div class="workers-list">
    <ListToolbar
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск сотрудников'"
      :loading="isLoading"
      :add-disabled="!isProfessionNode"
      :add-disabled-tooltip="
        !isProfessionNode
          ? 'Добавлять новых сотрудников можно только в папке с типом профессия'
          : ''
      "
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    />
    <q-banner v-if="!productionUnitId" class="workers-list__state" dense>
      Выберите производственную единицу, чтобы увидеть сотрудников
    </q-banner>

    <q-banner
      v-else-if="error"
      class="workers-list__state"
      dense
      rounded
      color="negative"
      text-color="white"
      icon="warning"
    >
      {{ error }}
    </q-banner>
    <BaseTableTemplate
      v-else
      class="workers-list__table"
      :columns="columns"
      :rows="workers"
      v-model:selected="selectedRows"
      v-model:pagination="paginationState"
      :rows-per-page-options="[10, 25, 50]"
      :loading="isLoading"
      :rows-number="paginationState.rowsNumber"
      :binary-state-sort="true"
      :isFilterDialogOpen="isFilterDialogOpen"
      row-key="_id"
      selection-mode="none"
      navigate-on-row-click
      :details-route-name="detailsRouteName"
      @request="handleRequest"
      @edit-row="handleEditRow"
      @delete-row="handleDeleteRow"
      @get_filter_query="handleFilterTable"
      @update:is-filter-dialog-open="isFilterDialogOpen = false"
    >
      <template #cell-scheduleTemplateData="{ props }">
        {{ props.row.scheduleTemplateData?.name ?? '—' }}
      </template>

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.createdAt) }}
      </template>

      <template #no-data>
        <div class="workers-list__empty">
          <q-icon name="people" size="32px" color="grey-5" />
          <div class="workers-list__empty-text">
            <div>Сотрудники не найдены</div>
            <div class="text-caption text-grey">Попробуйте изменить параметры поиска</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>
    <WorkerFormDialog
      v-model="isCreateDialogOpen"
      :production-unit-id="productionUnitId"
      @created="handleCreateSuccess"
      @update:model-value="handleCreateDialogToggle"
    />
    <WorkerFormDialog
      v-model="isEditDialogOpen"
      mode="edit"
      :worker="editingWorker"
      :production-unit-id="productionUnitId ?? editingWorker?.p_id ?? null"
      @updated="handleEditSuccess"
      @update:model-value="handleEditDialogToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WorkerFormDialog } from 'src/widgets';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { formatDate } from '../lib';
import { useWorkersList } from '../model';
import type { WorkersListEmits, WorkersListProps } from '../model';
import { ListToolbar } from 'src/shared';

defineOptions({
  name: 'WorkersList',
});

const props = withDefaults(defineProps<WorkersListProps>(), {
  includeDescendants: true,
  entities: 'worker',
  selectedNodeType: null,
});

const isProfessionNode = computed(() => props.selectedNodeType === 'profession');

const emit = defineEmits<WorkersListEmits>();

const {
  // Store
  workers,
  isLoading,
  error,

  // State
  search,
  selectedRows,
  includeDescendants,
  paginationState,

  // Computed
  columns,
  detailsRouteName,

  // Methods
  handleRequest,
  handleSearch,
  handleToggleDescendants,
  handleOpenCreate,
  handleOpenFilter,
  handleEditRow,
  handleFilterTable,
  handleDeleteRow,
  handleRefresh,
  handleCreateSuccess,
  handleEditSuccess,
  handleCreateDialogToggle,
  handleEditDialogToggle,

  // Dialog state
  isCreateDialogOpen,
  isFilterDialogOpen,
  isEditDialogOpen,
  editingWorker,
} = useWorkersList(props, emit);
</script>

<style lang="scss" scoped>
.workers-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__state {
    margin-bottom: 16px;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px;
    text-align: center;
  }

  &__empty-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
