<template>
  <div class="orders-list">
    <ListToolbar
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск заказов'"
      :loading="isLoading"
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    >
      <template #custom-elements>
        <q-btn
          v-if="!isPlanningMode"
          color="secondary"
          dense
          unelevated
          icon="playlist_add_check"
          label="Построение плана"
          no-caps
          @click="handleEnterPlanningMode"
        />
      </template>
    </ListToolbar>

    <!-- Planning mode controls -->
    <div v-if="isPlanningMode" class="orders-list__planning-controls">
      <q-select
        v-model="planningTypeModel"
        :options="planningTypeOptions"
        label="Тип планирования"
        dense
        filled
        emit-value
        map-options
        class="orders-list__planning-type"
      />

      <q-input
        v-if="planningTypeModel === 'direct'"
        v-model="planningStartDate"
        label="Начать с"
        dense
        filled
        type="date"
        class="orders-list__planning-start-date"
      />

      <div class="orders-list__planning-actions">
        <q-btn flat label="Дополнительно" @click="isAdditionalDialogOpen = true" />
        <q-btn
          color="primary"
          unelevated
          label="Построить план"
          :disable="selectedRows.length === 0"
          @click="handleBuildPlan"
        />
        <q-btn flat label="Отмена" @click="handleCancelPlanning" />
      </div>
    </div>

    <q-banner v-if="!productionUnitId" class="orders-list__state" dense>
      Выберите производственную единицу, чтобы увидеть заказы
    </q-banner>

    <q-banner
      v-else-if="error"
      class="orders-list__state"
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
      class="orders-list__table"
      :columns="columns"
      :rows="orders"
      v-model:selected="selectedRows"
      v-model:pagination="paginationState"
      :rows-per-page-options="[10, 25, 50]"
      :loading="isLoading"
      :rows-number="paginationState.rowsNumber"
      :binary-state-sort="true"
      row-key="_id"
      :selection-mode="selectionMode"
      :is-edit-menu-enabled="false"
      :navigate-on-row-click="!isPlanningMode"
      :details-route-name="detailsRouteName"
      @request="handleRequest"
      @edit-row="handleEditRow"
      @delete-row="handleDeleteRow"
      @get_filter_query="handleFilterTable"
      @update:is-filter-dialog-open="isFilterDialogOpen = false"
    >
      <template #cell-type="{ props }">
        <q-badge
          :color="props.row.type === 'client' ? 'primary' : 'secondary'"
          :label="formatOrderType(props.row.type)"
        />
      </template>

      <template #cell-orderDate="{ props }">
        {{ formatDate(props.row.orderDate) }}
      </template>

      <template #cell-shipmentDate="{ props }">
        <span v-if="props.row.shipmentDate">
          {{ formatDate(props.row.shipmentDate) }}
        </span>
        <span v-else class="text-grey-6">—</span>
      </template>

      <template #cell-materialsCount="{ props }">
        <span>{{ props.row.materials?.length ?? 0 }}</span>
      </template>

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.createdAt) }}
      </template>

      <template #no-data>
        <div class="orders-list__empty">
          <q-icon name="receipt_long" size="32px" color="grey-5" />
          <div class="orders-list__empty-text">
            <div>Заказы не найдены</div>
            <div class="text-caption text-grey">Попробуйте изменить параметры поиска</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>

    <PlanningAdditionalDialog v-model="isAdditionalDialogOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { formatDate, formatOrderType } from '../lib';
import { useOrdersList } from '../model';
import type { OrdersListEmits, OrdersListProps } from '../model';
import { ListToolbar } from 'src/shared';
import PlanningAdditionalDialog from './PlanningAdditionalDialog.vue';

defineOptions({
  name: 'OrdersList',
});

const props = withDefaults(defineProps<OrdersListProps>(), {
  includeDescendants: true,
  entities: 'order',
});

const emit = defineEmits<OrdersListEmits>();

const isAdditionalDialogOpen = ref(false);

const {
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
  // planning mode
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
} = useOrdersList(props, emit);
</script>

<style scoped lang="scss">
.orders-list {
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

  &__planning-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #f0f4ff;
    border: 1px solid #c5d9ff;
    border-radius: 6px;
    margin-bottom: 12px;
  }

  &__planning-type {
    flex: 0 0 300px;
  }

  &__planning-start-date {
    flex: 0 0 200px;
  }

  &__planning-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
}
</style>
