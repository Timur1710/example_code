<template>
  <div class="batches-table">
    <!-- Таблица партий -->
    <q-table
      :rows="batches"
      :columns="columns"
      :loading="isLoading"
      :pagination="pagination"
      @request="handleRequest"
      :rows-per-page-options="[10, 25, 50, 100]"
      row-key="_id"
      binary-state-sort
      class="batches-table__table"
    >
      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #no-data>
        <div class="full-width row flex-center text-grey-6 q-gutter-sm">
          <q-icon size="2em" name="info" />
          <span>Партий не найдено</span>
        </div>
      </template>

      <template #body-cell-status="props">
        <q-td class="table__call text-center" :props="props">
          {{ getStatusLabel(props.value) }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-btn
              icon="edit"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="handleEditBatch(props.row)"
            />
            <q-btn
              v-if="canDeleteBatch"
              icon="delete"
              size="sm"
              flat
              round
              dense
              color="negative"
              @click="handleDeleteBatch(props.row)"
            />
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Сообщение об ошибке -->
    <q-banner v-if="error" class="text-white bg-red q-mt-md" rounded>
      <template #avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
      <template #action>
        <q-btn flat label="Закрыть" @click="handleCloseError" />
      </template>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type { BatchListItem } from 'src/entities/batch';
import { getBatchTableFields, type BatchFieldKey } from 'src/shared/config';

// Константы
const EMPTY_CELL_PLACEHOLDER = '—\u00A0\u00A0\u00A0\u00A0';

// Props
const props = withDefaults(
  defineProps<{
    batches: BatchListItem[];
    pagination: {
      page: number;
      rowsPerPage: number;
      rowsNumber: number;
    };
    isLoading: boolean;
    error: string | null;
    /** Кастомная видимость колонок (переопределяет настройки по умолчанию) */
    columnVisibility?: Partial<Record<BatchFieldKey, boolean>>;
  }>(),
  {
    columnVisibility: () => ({}),
  }
);

// Emits
const emit = defineEmits<{
  request: [
    props: {
      pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean };
    },
  ];
  'edit-batch': [batch: BatchListItem];
  'delete-batch': [batch: BatchListItem];
  'close-error': [];
}>();

// Computed
const canDeleteBatch = computed(() => props.batches.length > 1);

// Видимые поля таблицы
const visibleTableFields = computed(() => {
  const allFields = getBatchTableFields();
  return allFields.filter((field) => {
    const customVisible = props.columnVisibility?.[field.key];
    return customVisible !== undefined ? customVisible : field.defaultVisible;
  });
});

// Колонки таблицы (динамически генерируются на основе конфига)
const columns = computed<QTableColumn[]>(() => {
  const dynamicColumns = visibleTableFields.value.map((field) => {
    const baseColumn: QTableColumn = {
      name: field.key,
      label: field.label,
      align: 'center',
      field: field.key,
      sortable: field.sortable || false,
    };

    // Специальная обработка форматирования для разных типов полей
    if (field.key === 'quantity') {
      baseColumn.format = (val: number) => (val ? val.toLocaleString() : EMPTY_CELL_PLACEHOLDER);
    } else if (field.key === 'feature') {
      baseColumn.format = (val: Record<string, unknown>) => {
        if (val && typeof val === 'object') {
          return (val as Record<string, string>)['1'] || EMPTY_CELL_PLACEHOLDER;
        }
        return EMPTY_CELL_PLACEHOLDER;
      };
    } else if (field.key === 'deliveryDate') {
      baseColumn.format = (val: string) =>
        val
          ? new Date(val).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : EMPTY_CELL_PLACEHOLDER;
    } else if (field.type === 'date') {
      baseColumn.format = (val: string) =>
        val ? new Date(val).toLocaleDateString('ru-RU') : EMPTY_CELL_PLACEHOLDER;
    } else {
      baseColumn.format = (val: string) => val || EMPTY_CELL_PLACEHOLDER;
    }

    return baseColumn;
  });

  // Добавляем колонку действий
  dynamicColumns.push({
    name: 'actions',
    label: '',
    align: 'center' as const,
    field: 'actions',
  });

  return dynamicColumns;
});

// Методы для отображения статусов
function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    available: 'Доступно',
    expended: 'Израсходовано',
    unknown: 'Неизвестно',
  };
  return labels[status || ''] || 'Неизвестно';
}

// Обработчики событий
function handleRequest(props: {
  pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean };
}) {
  emit('request', props);
}

function handleEditBatch(batch: BatchListItem) {
  emit('edit-batch', batch);
}

function handleDeleteBatch(batch: BatchListItem) {
  emit('delete-batch', batch);
}

function handleCloseError() {
  emit('close-error');
}
</script>

<style scoped lang="scss">
.batches-table {
  display: flex;
  flex-direction: column;
  &__table {
    min-height: 0;
  }
}
.table__call {
  display: flex;
  justify-content: center;
  text-align: center;
}
</style>
