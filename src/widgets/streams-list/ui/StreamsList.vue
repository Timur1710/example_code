<template>
  <div class="streams-list">
    <ListToolbar
      v-model:search-value="search"
      v-model:toggle-value="includeDescendants"
      :search-placeholder="'Поиск потоков'"
      :loading="isLoading"
      @update:search-value="handleSearch"
      @add="handleOpenCreate"
      @filter_table="handleOpenFilter"
      @update:toggle-value="handleToggleDescendants"
      @reload="handleRefresh"
    />

    <q-banner v-if="!productionUnitId" class="streams-list__state" dense>
      Выберите производственную единицу, чтобы увидеть потоки
    </q-banner>

    <q-banner
      v-else-if="error"
      class="streams-list__state"
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
      class="streams-list__table"
      :columns="columns"
      :rows="streams"
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
      :is-edit-menu-enabled="false"
      @request="handleRequest"
      @edit-row="handleEditRow"
      @delete-row="handleDeleteRow"
      @get_filter_query="handleFilterTable"
      @update:is-filter-dialog-open="isFilterDialogOpen=false"
    >
      <template #cell-type="{ props }">
        <span>{{ t(`stream_modal.${props.row.type}`) }}</span>
      </template>

      <template #cell-status="{ props }">
        <q-chip
          :color="getStatusColor(props.row.status)"
          text-color="white"
          dense
          size="sm"
        >
          {{ t(`stream_status.${props.row.status}`) }}
        </q-chip>
      </template>

      <template #cell-updatedAt="{ props }">
        {{ formatDate(props.row.updatedAt || props.row.updatedAt) }}
      </template>

      <template #no-data>
        <div class="streams-list__empty">
          <q-icon name="waves" size="32px" color="grey-5" />
          <div class="streams-list__empty-text">
            <div>Потоки не найдены</div>
            <div class="text-caption text-grey">Попробуйте изменить параметры поиска</div>
          </div>
        </div>
      </template>

      <template #rowMenu="{ row }">
        <slot name="rowMenu" :row="row" />
      </template>
    </BaseTableTemplate>

    <!-- Диалог создания потока -->
    <StreamFormDialog
      v-model="isCreateDialogOpen"
      :production-unit-id="productionUnitId"
      @submit="handleStreamFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { StreamFormDialog } from 'src/widgets/_forms';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import { useStreamsList } from '../model';
import { formatDate } from '../lib/index';
import type { StreamsListEmits, StreamsListProps } from '../model';
import { useI18n } from 'vue-i18n';
import { ListToolbar } from 'src/shared';
import { useStreamStore } from 'src/entities/stream';

defineOptions({
  name: 'StreamsList',
});

const props = withDefaults(defineProps<StreamsListProps>(), {
  includeDescendants: true,
  entities: 'stream',
});

const { t } = useI18n()
const router = useRouter();

const emit = defineEmits<StreamsListEmits>();

const {
  streams,
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
  handleRequest,
  handleSearch,
  handleToggleDescendants,
  handleRefresh,
  handleOpenCreate,
  handleOpenFilter,
  handleEditRow,
  handleDeleteRow,
  handleFilterTable,
} = useStreamsList(props, emit);

const { productionUnitId } = props;

// Обработчик отправки формы создания потока
function handleStreamFormSubmit(data: { name: string; materialIds: string[] }): void {
  // Сохраняем данные в store и переходим на страницу создания
  const streamStore = useStreamStore();
  streamStore.setStreamFormData(data);

  // Переходим на страницу создания потока
  void router.push({
    name: 'create-stream',
    query: productionUnitId ? { productionUnitId } : {},
  });
}

/**
 * Получить цвет для статуса потока
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'inactive':
      return 'grey';
    case 'draft':
      return 'orange';
    case 'archived':
      return 'blue-grey';
    default:
      return 'grey';
  }
}
</script>

<style scoped lang="scss">
.streams-list {
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