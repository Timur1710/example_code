<template>
  <div class="single-selection-template">
    <!-- Заголовок -->
    <div v-if="title" class="q-pa-md q-pb-sm">
      <div class="text-h6">{{ title }}</div>
    </div>

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

    <!-- Счетчик найденных -->
    <div class="q-px-md q-pb-sm">
      <div class="text-caption text-grey-7">
        {{ t('found_items', { count: totalItems }) }}
      </div>
    </div>

    <!-- Список элементов -->
    <div class="items-list q-px-md">
      <q-list bordered separator>
        <q-item
          v-for="item in items"
          :key="item._id"
          clickable
          :active="isSelected(item._id)"
          @click="handleSelectItem(item)"
        >
          <q-item-section side>
            <q-radio
              :model-value="selectedItem"
              :val="item._id"
              @update:model-value="handleSelectItem(item)"
              @click.stop
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label v-if="showDescriptionValue && item.description" caption>
              {{ item.description }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Пустое состояние -->
        <q-item v-if="!loadingValue && items.length === 0">
          <q-item-section>
            <q-item-label class="text-grey-6 text-center">
              {{ t('no_items_found') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loadingValue" class="q-pa-md flex flex-center">
      <q-spinner-dots color="primary" size="32px" />
    </div>

    <!-- Пагинация -->
    <div v-if="pagination.pagesNumber > 1" class="q-pa-md q-pt-sm">
      <q-pagination
        :model-value="pagination.page"
        :max="pagination.pagesNumber"
        :max-pages="5"
        boundary-numbers
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- Кнопки действий -->
    <div class="q-pa-md q-pt-none flex justify-between">
      <q-btn
        :label="t('reset')"
        color="negative"
        outline
        :disable="!selectedItem"
        @click="handleReset"
      />
      <q-btn
        :label="selectButtonTextValue"
        color="primary"
        :disable="!selectedItem"
        @click="handleConfirm"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends SelectionItem">
import { ref, computed } from 'vue';
import { debounce } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { SelectionItem, PaginationParams } from '../AlternativesSelectionTemplate/model/types';
import type { SingleSelectionTemplateProps } from './model/types';

const props = withDefaults(defineProps<SingleSelectionTemplateProps<T>>(), {
  loading: false,
  searchLoading: false,
  searchError: null,
  showDescription: true,
});

const emit = defineEmits<{
  search: [query: string];
  pagination: [params: Omit<PaginationParams, 'filter'>];
  select: [item: T];
  reset: [];
  confirm: [selectedId: string | null];
}>();

const { t } = useI18n();

// Значения по умолчанию через computed
const searchPlaceholderValue = computed(() => props.searchPlaceholder ?? t('search_placeholder'));
const selectButtonTextValue = computed(() => props.selectButtonText ?? t('select'));
const loadingValue = computed(() => props.loading ?? false);
const searchLoadingValue = computed(() => props.searchLoading ?? false);
const searchErrorValue = computed(() => props.searchError ?? null);
const showDescriptionValue = computed(() => props.showDescription ?? true);

const searchQuery = ref('');

// Вычисляемые свойства
const totalItems = computed(() => props.pagination.rowsNumber);

const isSelected = (id: string) => props.selectedItem === id;

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

const handleSelectItem = (item: T) => {
  emit('select', item);
};

const handlePageChange = (page: number) => {
  emit('pagination', {
    page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending,
    search: searchQuery.value,
  } as Omit<PaginationParams, 'filter'>);
};

const handleConfirm = () => {
  emit('confirm', props.selectedItem);
};

const handleReset = () => {
  emit('reset');
};
</script>

<style scoped lang="scss">
.single-selection-template {
  .items-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .q-item {
    &:hover {
      background-color: #fafafa;
    }

    &.q-item--active {
      background-color: #e3f2fd;
    }
  }
}
</style>





