<template>
  <div class="equipment-list">
    <ListToolbar
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск оборудования'"
      :loading="isLoading"
      :add-disabled="addToolbarDisabled"
      :add-disabled-tooltip="addToolbarTooltip"
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    />

    <q-banner v-if="!productionUnitId" class="equipment-list__state" dense>
      Выберите производственную единицу, чтобы увидеть оборудование
    </q-banner>

    <q-banner
      v-else-if="error"
      class="equipment-list__state"
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
      class="equipment-list__table"
      :columns="columns"
      :rows="equipment"
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

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.createdAt) }}
      </template>

      <template #no-data>
        <div class="equipment-list__empty">
          <q-icon name="precision_manufacturing" size="32px" color="grey-5" />
          <div class="equipment-list__empty-text">
            <div>Оборудование не найдено</div>
            <div class="text-caption text-grey">Попробуйте изменить параметры поиска</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>

    <EquipmentFormDialog
      v-model="isCreateDialogOpen"
      :production-unit-id="productionUnitId"
      @created="handleEquipmentCreated"
    />
    <EquipmentFormDialog
      v-model="isEditDialogOpen"
      mode="edit"
      :equipment="editingEquipment"
      :production-unit-id="productionUnitId ?? editingEquipment?.p_id ?? null"
      @updated="handleEquipmentUpdated"
      @update:model-value="handleEditDialogToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { EquipmentFormDialog } from 'src/widgets';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { formatDate } from '../lib';
import { useEquipmentList } from '../model';
import type { EquipmentListEmits, EquipmentListProps } from '../model';
import { ListToolbar } from 'src/shared';

defineOptions({
  name: 'EquipmentList',
});

const props = withDefaults(defineProps<EquipmentListProps>(), {
  includeDescendants: true,
  entities: 'equipment',
});

const emit = defineEmits<EquipmentListEmits>();

const {
  equipment,
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
  detailsRouteName,
  isCreateDialogOpen,
  isEditDialogOpen,
  editingEquipment,
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
} = useEquipmentList(props, emit);
</script>

<style scoped lang="scss">
.equipment-list {
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
}
</style>
