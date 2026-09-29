<template>
  <div class="resource-selection-template">
    <!-- Панель поиска -->
    <div class="q-pa-md q-pt-sm">
      <q-input
        v-model="searchQuery"
        :placeholder="searchPlaceholderValue"
        :loading="searchLoadingValue"
        :error="!!searchErrorValue"
        :error-message="searchErrorValue || undefined"
        outlined
        dense
        clearable
        @update:model-value="handleSearch"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Счетчик выбранных -->
    <div class="q-px-md q-pb-sm">
      <div class="text-caption text-grey-7">
        {{ t('selected_count', { count: selectedCount, total: totalItems }) }}
      </div>
    </div>

    <!-- Список элементов -->
    <div ref="itemsListRef" class="items-list q-px-md">
      <q-list bordered separator>
        <!-- Выбор всех -->
        <q-item>
          <q-item-section side>
            <q-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @update:model-value="handleSelectAll"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ t('select_all') }}</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Элементы списка -->
        <q-item v-for="item in items" :key="item._id" clickable @click="handleToggleItem(item)">
          <q-item-section side>
            <q-checkbox
              :model-value="isSelected(item._id)"
              @update:model-value="handleToggleItem(item)"
              @click.stop
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label v-if="item.description" caption>
              {{ item.description }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Пагинация -->
    <div class="q-pa-md q-pt-sm pagination-container">
      <q-pagination
        :model-value="pagination.page"
        :max="pagination.pagesNumber"
        :max-pages="5"
        boundary-numbers
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- Кнопки действий -->
    <div class="q-px-md q-py-none flex justify-between">
      <q-btn
        :label="t('reset')"
        color="negative"
        outline
        :disable="selectedCount === 0"
        @click="handleReset"
      />
      <q-btn
        :label="selectButtonTextValue"
        color="primary"
        :disable="selectedCount === 0"
        @click="handleConfirm"
      />
    </div>

    <!-- Индикатор загрузки -->
    <div class="flex flex-center loading-overlay">
      <q-spinner-dots v-if="loadingValue" color="primary" size="32px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { debounce } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { SelectionItem, PaginationParams } from '../AlternativesSelectionTemplate/model/types';
import type { ResourceSelectionTemplateProps } from './model/types';

const props = defineProps<ResourceSelectionTemplateProps>();

const emit = defineEmits<{
  search: [query: string];
  pagination: [params: Omit<PaginationParams, 'filter'>];
  toggle: [item: SelectionItem];
  selectAll: [selected: boolean];
  confirm: [selectedIds: string[]];
}>();

const { t } = useI18n();
const itemsListRef = ref<HTMLDivElement | null>(null);
// Значения по умолчанию через computed
const searchPlaceholderValue = computed(() => props.searchPlaceholder ?? t('search_placeholder'));
const selectButtonTextValue = computed(() => props.selectButtonText ?? t('select'));
const loadingValue = computed(() => props.loading ?? false);
const searchLoadingValue = computed(() => props.searchLoading ?? false);
const searchErrorValue = computed(() => props.searchError ?? null);

const searchQuery = ref('');

// Вычисляемые свойства для чекбоксов
const selectedCount = computed(() => props.selectedItems.length);
const totalItems = computed(() => props.pagination.rowsNumber);

// Получаем ID элементов на текущей странице
const currentPageIds = computed(() => props.items.map((item) => item._id));
// Считаем количество выбранных элементов на текущей странице
const selectedOnPageCount = computed(() =>
  currentPageIds.value.filter((id) => props.selectedItems.includes(id)).length
);

// Выбирать все - true, если все элементы на текущей странице выбраны
const isAllSelected = computed(
  () => props.items.length > 0 && selectedOnPageCount.value === props.items.length
);
// Неопределенное состояние - true, если некоторые (но не все) элементы на странице выбраны
const isIndeterminate = computed(
  () => selectedOnPageCount.value > 0 && selectedOnPageCount.value < props.items.length
);

const isSelected = (id: string) => props.selectedItems.includes(id);

const debouncedSearch = debounce((query: string) => {
  if (query.trim()) {
    emit('search', query.trim());
  }
}, 300);

const handleSearch = (query: string | number | null) => {
  const queryString = query?.toString() || '';
  searchQuery.value = queryString;

  // Для пустого поиска делаем немедленный запрос на все позиции
  if (!queryString.trim()) {
    emit('search', '');
  } else {
    debouncedSearch(queryString);
  }
};

const handleSelectAll = (selected: boolean) => {
  emit('selectAll', selected);
};

const handleToggleItem = (item: SelectionItem) => {
  emit('toggle', item);
};

const handlePageChange = (page: number) => {
  // Прокручиваем список наверх
  itemsListRef.value?.scrollTo(0, 0);
  emit('pagination', {
    page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending,
    search: searchQuery.value,
  } as Omit<PaginationParams, 'filter'>);
};

const handleConfirm = () => {
  emit('confirm', props.selectedItems);
};

const handleReset = () => {
  emit('selectAll', false);
};
</script>

<style scoped lang="scss">
.pagination-container{
  height: 65px;
}
.loading-overlay{
  height: 35px;
  min-height: 35px;
  max-height: 35px;
}
.resource-selection-template {
  .items-list {
    max-height: 400px;
    min-height: 400px;
    height: 400px;
    overflow-y: auto;
  }

  .q-item {
    &:hover {
      background-color: #fafafa;
    }
  }
}
</style>

