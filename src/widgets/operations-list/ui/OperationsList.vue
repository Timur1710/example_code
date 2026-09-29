<template>
  <div class="operations-list">
    <ListToolbar
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск операций'"
      :loading="isLoading"
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    />

    <q-banner v-if="!productionUnitId" class="operations-list__state" dense>
      Выберите производственную единицу, чтобы увидеть операции
    </q-banner>

    <q-banner
      v-else-if="error"
      class="operations-list__state"
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
      class="operations-list__table"
      :columns="columns"
      :rows="operations"
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
      @update:is-filter-dialog-open="isFilterDialogOpen=false"
    >
      <template #cell-description="{ props }">
        <span v-if="props.row.description">{{ props.row.description }}</span>
        <span v-else class="text-grey-6">—</span>
      </template>

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.createdAt) }}
      </template>

      <template #no-data>
        <div class="operations-list__empty">
          <q-icon name="settings" size="32px" color="grey-5" />
          <div class="operations-list__empty-text">
            <div>Операции не найдены</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>

    <OperationFormDialog
      v-model="isCreateDialogOpen"
      :production-unit-id="productionUnitId"
      @created="handleOperationCreated"
    />
    <OperationFormDialog
      v-model="isEditDialogOpen"
      mode="edit"
      :operation="editingOperation"
      :production-unit-id="productionUnitId ?? editingOperation?.p_id ?? null"
      @updated="handleOperationUpdated"
      @update:model-value="handleEditDialogToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { OperationFormDialog } from 'src/widgets';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { formatDate } from '../lib';
import { useOperationsList } from '../model';
import type { OperationsListEmits, OperationsListProps } from '../model';
import { ListToolbar } from 'src/shared';

defineOptions({
  name: 'OperationsList',
});

const props = withDefaults(defineProps<OperationsListProps>(), {
  includeDescendants: true,
  entities: 'operation',
});

const emit = defineEmits<OperationsListEmits>();

const {
  operations,
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
  isEditDialogOpen,
  editingOperation,
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
} = useOperationsList(props, emit);
</script>

<style scoped lang="scss">
.operations-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;

  &__table {
    flex: 1;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px 0;
    color: #777;
  }

  &__empty-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__state {
    background: #f5f5f5;
  }

  &__selection {
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  &__selection-json {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
