<template>
  <AdvancedFilterDialog
    v-model="filterDialogOpen"
    v-if="filterDialogOpen"
    :keys="rows[0] || null"
    @update:model-value="closeDialog()"
    @add_filters="add_filter"
  />
  <q-table
    v-bind="$attrs"
    :columns="columns"
    :rows="rows"
    :row-key="rowKey"
    :selection="selectionMode"
    v-model:selected="selectionBinding"
    v-model:pagination="paginationBinding"
    :rows-per-page-options="rowsPerPageOptions"
    :loading="tableLoading"
    :rows-number="rowsNumber"
    :binary-state-sort="binaryStateSort"
    flat
    @request="handleRequest"
    @row-click="handleRowClick"
  >
    <!-- HEADER -->
    <template #header="props">
      <q-tr :props="props">
        <q-th v-if="isSelectionEnabled" auto-width>
          <q-checkbox
            :model-value="isAllSelected"
            :indeterminate="isIndeterminate"
            @update:model-value="toggleAll"
          />
        </q-th>

        <q-th v-for="(col, index) in props.cols" :key="col.name" :props="props">
          <span class="inline_start">{{ col.label }}</span>
          <span
            class="inline"
            v-if="col.filter && (rows.length > 0 || filters.find((f) => f.key === col.field))"
          >
            <FilterTableButton
              :class="filters.find((f) => f.key === col.field) ? 'active_filter' : 'disable_filter'"
              @mouseenter="popup_filter(col, $event)"
              @mouseleave="popup_filter(col, $event)"
              :size="'18px'"
              :text="t('filter')"
            />
            <FilterDialog
              :col="col"
              :col-index="Number(index)"
              @add_filter_query="add_filter"
              @delete_filter_query="delete_filter"
              :row="rows[0] ?? undefined"
            />
          </span>
        </q-th>
        <q-th></q-th>
      </q-tr>
    </template>

    <!-- BODY -->
    <template #body="props">
      <q-tr
        :props="props"
        :class="{ 'base-table__row--clickable': propsNavigateOnRowClick }"
        @click="handleBodyRowClick(props, $event)"
      >
        <q-td v-if="isSelectionEnabled" auto-width>
          <q-checkbox
            :model-value="isRowSelected(props.row)"
            @update:model-value="() => toggleRow(props.row)"
          />
        </q-td>

        <q-td v-for="col in props.cols" :key="col.name" :props="props">
          <slot :name="`cell-${col.name}`" :props="props">
            {{
              col.type === 'object'
                ? col.value?.name.slice(0, 50) + (col.value?.name.length > 50 ? '...' : '')
                : col.value.slice(0, 50) + (col.value.length > 50 ? '...' : '')
            }}
            <q-tooltip
              anchor="top middle"
              self="bottom middle"
              :offset="[10, -10]"
              v-if="
                (col.type === 'object' && col.value?.name.length > 50) ||
                (col.type !== 'object' && col.value.length > 50)
              "
            >
              {{ col.type === 'object' ? col.value?.name : col.value }}
            </q-tooltip>
          </slot>
        </q-td>

        <q-td class="base-table__actions-cell">
          <slot name="bodyRight" :props="props">
            <q-btn flat dense round color="primary" icon="more_vert" class="more_vert" @click.stop>
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 160px">
                  <q-item
                    v-if="isEditMenuEnabled"
                    clickable
                    v-close-popup
                    @click.stop="() => handleEditRow(props.row)"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" color="primary" />
                    </q-item-section>
                    <q-item-section>Изменить</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click.stop="() => handleDeleteRow(props.row)">
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">Удалить</q-item-section>
                  </q-item>

                  <slot name="rowMenu" :row="props.row" />
                </q-list>
              </q-menu>
            </q-btn>
          </slot>
        </q-td>
      </q-tr>
    </template>

    <template #no-data>
      <slot name="no-data">
        <div class="q-pa-md text-grey-6">Нет данных</div>
      </slot>
    </template>

    <template #loading>
      <slot name="loading">
        <div class="q-pa-md flex flex-center">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </slot>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { FilterTableButton, FilterDialog } from 'src/shared';
import { AdvancedFilterDialog, type Filter } from 'src/widgets/_forms/AdvancedFilterDialog';
import { useI18n } from 'vue-i18n';
import type { BaseTableTemplateProps, TableRequestPayload, TableRow } from './model/types';
import type { QTableProps } from 'quasar';
import { detectFieldType } from 'src/shared/ui/FilterTableButton';
const { t } = useI18n();
const props = withDefaults(defineProps<BaseTableTemplateProps>(), {
  rowKey: 'id',
  selectionMode: 'multiple',
  rowsPerPageOptions: () => [10, 25, 50],
  loading: false,
  binaryStateSort: true,
  navigateOnRowClick: false,
  detailsRouteParamKey: 'id',
  isEditMenuEnabled: true,
  isFilterDialogOpen: false,
});
// Add this local state instead
const filterDialogOpen = ref(false);

// Watch the prop and update local state
watch(
  () => props.isFilterDialogOpen,
  (newValue) => {
    filterDialogOpen.value = newValue ?? false;
  }
);
const emit = defineEmits<{
  (event: 'request', payload: TableRequestPayload): void;
  (event: 'row-click', evt: MouseEvent, row: TableRow): void;
  (event: 'edit-row', row: TableRow): void;
  (event: 'delete-row', row: TableRow): void;
  (event: 'get_filter_query', query: string): void;
  (event: 'update:isFilterDialogOpen', value: boolean): void;
}>();
const filters = ref<Filter[]>([]);
const selected = defineModel<TableRow[]>('selected', { default: () => [] });
const paginationModel = defineModel<QTableProps['pagination']>('pagination');
const router = useRouter();

const propsNavigateOnRowClick = computed(() => props.navigateOnRowClick);

/**
 * Управляет отображением иконки фильтра в заголовке таблицы
 * При наведении мыши отключает сортировку колонки, чтобы не мешать взаимодействию с фильтром
 * При уходе мыши восстанавливает возможность сортировки
 */
const popup_filter = (col: { name: string; sortable: boolean }, event: MouseEvent) => {
  const thElement = (event.target as HTMLElement).closest('th');
  const sortable = thElement?.classList.contains('sortable');
  const condition = event.type === 'mouseenter' ? false : true;
  col.sortable = sortable ? condition : col.sortable;
};

const isSelectionEnabled = computed(() => props.selectionMode !== 'none');

const tableLoading = computed(() => props.loading);

/**
 * Закрывает диалоговое окно фильтрации
 * Обновляет локальное состояние и уведомляет родительский компонент
 */
const closeDialog = () => {
  filterDialogOpen.value = false;
  emit('update:isFilterDialogOpen', false);
};

/**
 * Извлекает уникальный идентификатор строки таблицы
 * Проверяет несколько возможных источников ID: rowKey prop, поле id, поле _id
 * @param row - Строка таблицы
 * @returns ID строки или undefined, если не найден
 */
const getRowId = (row: TableRow): string | number | undefined => {
  const fromRowKey = row[props.rowKey];
  if (typeof fromRowKey === 'string' || typeof fromRowKey === 'number') {
    return fromRowKey;
  }
  if (typeof row.id === 'string' || typeof row.id === 'number') {
    return row.id;
  }
  if (typeof row._id === 'string' || typeof row._id === 'number') {
    return row._id;
  }
  return undefined;
};

/**
 * Добавляет или обновляет фильтры для таблицы
 * Принимает один фильтр или массив фильтров, строит MongoDB-запрос и отправляет его родительскому компоненту
 * @param filter - Фильтр или массив фильтров для применения. Если null, функция завершается
 */
const add_filter = (filter: Filter | Filter[] | null) => {
  // Ранний выход, если фильтр отсутствует
  if (!filter) return;

  // Обновление списка фильтров
  const filtersToAdd = Array.isArray(filter) ? filter : [filter];

  // При массиве фильтров очищаем старые значения
  if (Array.isArray(filter)) {
    filters.value = [];
  }

  // Добавляем или обновляем каждый фильтр
  filtersToAdd.forEach((f) => {
    const existingIndex = filters.value.findIndex((existingFilter) => existingFilter.key === f.key);
    if (existingIndex !== -1) {
      // Заменяем существующий фильтр
      filters.value.splice(existingIndex, 1, f);
    } else {
      // Добавляем новый фильтр
      filters.value.push(f);
    }
  });

  // Отправка запроса родительскому компоненту
  const query = JSON.stringify(createMongoQuery(filters.value) || []);
  emit('get_filter_query', query);
};

/**
 * Удаляет фильтр по указанному полю
 * Пересобирает запрос из оставшихся фильтров и отправляет обновленный запрос родительскому компоненту
 * @param field - Ключ поля, фильтр по которому нужно удалить
 */
const delete_filter = (field: string) => {
  filters.value = filters.value.filter((f) => f.key !== field);
  const query = JSON.stringify(createMongoQuery(filters.value) || []);
  emit('get_filter_query', query);
};

/**
 * Преобразует массив фильтров в объект MongoDB-запроса
 * Обрабатывает различные типы условий (сравнение, OR, AND) и преобразует значения в нужные типы данных
 */
const createMongoQuery = (filters: Filter[]) => {
  const query_object: Record<string, Record<string, unknown>> = {};
  const numericTypes = ['integer', 'float'];

  filters.forEach((f) => {
    const keyValue = f.key;
    const conditionValue = f.condition?.value || '$eq';

    // Инициализация объекта для поля, если его нет
    if (!query_object[keyValue]) {
      query_object[keyValue] = {};
    }

    // Вспомогательная функция для преобразования значения
    const convertValue = (value: unknown): unknown => {
      const fieldType = detectFieldType(value);
      if (fieldType === 'date') {
        const dateValue = new Date(value as string);
        if (!isNaN(dateValue.getTime())) {
          return dateValue;
        }
      }
      return numericTypes.includes(fieldType) ? Number(value) : value;
    };

    // Обработка одного значения
    if (f.variable.length === 1) {
      query_object[keyValue][conditionValue] = convertValue(f.variable[0]);
    }
    // Обработка нескольких значений с логическим оператором
    else {
      if (f.math_logical === '$or') {
        // Оператор $in для логического ИЛИ
        if (f.condition?.value === '$ne') {
          query_object[keyValue].$nin = f.variable.map(convertValue);
        } else if (f.condition?.value === '$between') {
          // Оператор $gte и $lte для логического И между двумя значениями
          query_object[keyValue].$gte = convertValue(f.variable[0]);
          query_object[keyValue].$lte = convertValue(f.variable[1]);
        } else {
          query_object[keyValue].$in = f.variable.map(convertValue);
        }
      } else {
        // Оператор $and для логического И
        query_object[keyValue].$and = f.variable.map((v) => ({
          [conditionValue]: convertValue(v),
        }));
      }
    }
  });

  return query_object;
};

const selectionBinding = computed<TableRow[]>({
  get: () => (isSelectionEnabled.value ? selected.value : []),
  set: (next) => {
    if (isSelectionEnabled.value) {
      selected.value = next;
    }
  },
});

const paginationBinding = computed<QTableProps['pagination']>({
  get: () => paginationModel.value ?? props.pagination,
  set: (next) => {
    paginationModel.value = next ?? undefined;
  },
});

const isRowSelected = (row: TableRow): boolean => {
  const rowId = getRowId(row);
  if (rowId === undefined) return false;

  return selected.value.some((selectedRow) => getRowId(selectedRow) === rowId);
};

const isAllSelected = computed(() => {
  if (!isSelectionEnabled.value || props.rows.length === 0) return false;
  return props.rows.every((row) => isRowSelected(row));
});

const isIndeterminate = computed(() => {
  if (!isSelectionEnabled.value || props.rows.length === 0) return false;
  const selectedCount = props.rows.filter((row) => isRowSelected(row)).length;
  return selectedCount > 0 && selectedCount < props.rows.length;
});

const toggleAll = () => {
  if (!isSelectionEnabled.value) return;
  if (isAllSelected.value) {
    selected.value = [];
  } else {
    selected.value = [...props.rows];
  }
};

const toggleRow = (row: TableRow) => {
  if (!isSelectionEnabled.value) return;

  if (isRowSelected(row)) {
    const rowId = getRowId(row);
    selected.value = selected.value.filter((r) => getRowId(r) !== rowId);
  } else {
    selected.value = [...selected.value, row];
  }
};

const handleEditRow = (row: TableRow) => {
  emit('edit-row', row);
};

const handleDeleteRow = (row: TableRow) => {
  emit('delete-row', row);
};

const handleRequest = (payload: TableRequestPayload) => {
  emit('request', payload);
};

const resolveRowRoute = (row: TableRow): RouteLocationRaw | undefined => {
  if (props.rowRouteResolver) {
    return props.rowRouteResolver(row);
  }

  if (!props.detailsRouteName) return undefined;

  const rowId = getRowId(row);
  if (rowId === undefined) return undefined;

  const normalizedId = typeof rowId === 'string' ? rowId : String(rowId);
  return {
    name: props.detailsRouteName,
    params: { [props.detailsRouteParamKey ?? 'id']: normalizedId },
  };
};

const handleRowClick = (event: Event, row: TableRow) => {
  const mouseEvent = event as MouseEvent;
  emit('row-click', mouseEvent, row);
  if (!props.navigateOnRowClick) return;

  const route = resolveRowRoute(row);
  if (route) {
    void router.push(route);
  }
};

// Quasar передает onClick в props при кастомном body-слоте
const handleBodyRowClick = (
  slotProps:
    | (Record<string, unknown> & { onClick?: (e: MouseEvent) => void; row?: TableRow })
    | undefined,
  event: MouseEvent
) => {
  slotProps?.onClick?.(event);
  if (slotProps?.row) {
    handleRowClick(event, slotProps.row);
  }
};
</script>

<style scoped>
:deep(button.more_vert > span.q-btn__content > i.q-icon) {
  font-size: 1em;
}

span.inline {
  & div.filter-icon :hover {
    opacity: 0.64;
  }
}

.q-td {
  color: #111827;
  font-family: Roboto;
  font-size: 12.9px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.inline_start {
  float: inline-start;
  color: #111827;
  font-family: Roboto;
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
}

:deep(.q-table__sort-icon) {
  margin-left: 0;
  float: inline-start;
  color: #a2a2a2;
  font-size: 18px;
  font-weight: 500;
  opacity: 1;
  margin-right: -4px;
}

.base-table__row--clickable {
  cursor: pointer;
}

.base-table__actions-cell {
  width: 72px;
  text-align: right;
}
</style>
