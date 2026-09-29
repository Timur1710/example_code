<template>
  <div class="materials-list">
    <ListToolbar 
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск материалов'"
      :loading="isLoading"
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    />

    <q-banner v-if="!productionUnitId" class="materials-list__state" dense>
      Выберите производственную единицу, чтобы увидеть материалы
    </q-banner>

    <q-banner
      v-else-if="error"
      class="materials-list__state"
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
      class="materials-list__table"
      :columns="columns"
      :rows="materials"
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
      <template #cell-quantity="{ props }">
        <span>{{ props.row.totalQuantity ?? 0 }}</span>
        <span v-if="props.row.batchCount && props.row.batchCount > 1" class="text-grey-6 q-ml-xs">
          ({{ props.row.batchCount }} партий)
        </span>
        <span v-if="props.row.measure" class="text-grey-7 q-ml-xs">
          {{ t(`measurement_units.${props.row.measure}`) }}
        </span>
      </template>

      <template #cell-type="{ props }">
        <span>{{ t(`material_modal.${props.row.type}`) }}</span>
      </template>

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.updatedAt) }}
      </template>

      <template #no-data>
        <div class="materials-list__empty">
          <q-icon name="inventory_2" size="32px" color="grey-5" />
          <div class="materials-list__empty-text">
            <div>Материалы не найдены</div>
            <div class="text-caption text-grey">Попробуйте изменить параметры поиска</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>

    <MaterialFormDialog
      v-model="isCreateDialogOpen"
      :production-unit-id="productionUnitId"
      @created="handleMaterialCreated"
    />
    <MaterialFormDialog
      v-model="isEditDialogOpen"
      mode="edit"
      :material="editingMaterial"
      :production-unit-id="productionUnitId ?? editingMaterial?.p_id ?? null"
      @updated="handleMaterialUpdated"
      @update:model-value="handleEditDialogToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { MaterialFormDialog } from 'src/widgets';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { formatDate } from '../lib';
import { useMaterialsList } from '../model';
import type { MaterialsListEmits, MaterialsListProps } from '../model';
import { useI18n } from 'vue-i18n';
import { ListToolbar } from 'src/shared';

defineOptions({
  name: 'MaterialsList',
});

const props = withDefaults(defineProps<MaterialsListProps>(), {
  includeDescendants: true,
  entities: 'material',
});

const { t } = useI18n()

const emit = defineEmits<MaterialsListEmits>();

const {
  materials,
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
  editingMaterial,
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
} = useMaterialsList(props, emit);
</script>

<style scoped lang="scss">
.materials-list {
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
