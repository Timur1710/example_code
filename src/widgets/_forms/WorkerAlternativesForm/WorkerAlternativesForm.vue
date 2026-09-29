<template>
  <div class="worker-alternatives-form">
    <AlternativesSelectionTemplate
      :items="selectionItems"
      :selected-items="selectedIds"
      :pagination="pagination"
      :loading="isLoading"
      :search-loading="isSearchLoading"
      :search-error="searchError"
      title="Выбор альтернативных работников"
      search-placeholder="Поиск работников..."
      select-button-text="Выбрать работников"
      @search="handleSearch"
      @pagination="handlePagination"
      @toggle="handleToggle"
      @select-all="handleSelectAll"
      @reset="handleReset"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { workerApi } from 'src/entities/worker/api/worker.api';
import { AlternativesSelectionTemplate } from 'src/shared/templates';
import type {
  WorkerListItem,
  WorkersListParams,
  WorkersListResponse,
  WorkersPaginationMeta,
} from 'src/entities/worker/model/worker.types';
import type { PaginationParams, SelectionItem } from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  /** ID текущего работника (чтобы исключить его из списка) */
  excludeWorkerId: string | undefined;
  /** Предварительно выбранные работники */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'confirm', selectedIds: string[]): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  excludeWorkerId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Состояние
const workers = ref<WorkerListItem[]>([]);
const selectedIds = ref<string[]>([...props.preselectedIds]);
const isLoading = ref(false);
const isSearchLoading = ref(false);
const searchError = ref<string | null>(null);

// Пагинация
const pagination = ref<WorkersPaginationMeta>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  pagesNumber: 1,
  sortBy: 'name',
  descending: false,
});

// Текущие параметры поиска (синхронизируем с пагинацией)
const currentSearchParams = computed(() => ({
  page: pagination.value.page,
  rowsPerPage: pagination.value.rowsPerPage,
  sortBy: pagination.value.sortBy,
  descending: pagination.value.descending,
}));

// Преобразование работников в SelectionItem[]
const selectionItems = computed(() => {
  return workers.value.map((item) => {
    const result: SelectionItem = {
      _id: item._id,
      name: item.name,
    };
    if (item.description) {
      result.description = item.description;
    }
    return result;
  });
});

// Следим за изменениями preselectedIds и обновляем selectedIds
watch(() => props.preselectedIds, (newPreselectedIds) => {
  selectedIds.value = [...(newPreselectedIds || [])];
}, { immediate: false });

// Загрузка работников
const loadWorkers = async (params: WorkersListParams = {}) => {
  try {
    isLoading.value = true;
    searchError.value = null;

    const response: WorkersListResponse = await workerApi.getAll(params);

    // Исключаем текущего работника из списка и показываем только работников с непустым p_id
    workers.value = response.data.filter(
      (worker) => worker._id !== props.excludeWorkerId && worker.p_id && worker.p_id.trim() !== ''
    );

    // Обновляем пагинацию (currentSearchParams обновится автоматически через computed)
    pagination.value = {
      ...pagination.value,
      ...response.pagination,
    };
  } catch (error) {
    console.error('Ошибка загрузки работников:', error);
    searchError.value = 'Ошибка загрузки работников';
    workers.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Поиск работников
const searchWorkers = async (query: string) => {
  try {
    isSearchLoading.value = true;

    const params: WorkersListParams = {
      ...currentSearchParams.value,
      page: 1, // Сбрасываем на первую страницу при поиске
      sortBy: currentSearchParams.value.sortBy || 'name',
      descending: currentSearchParams.value.descending || false,
    };

    // Устанавливаем search параметр только если запрос не пустой
    // При пустой строке API вернет всех работников
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.search = trimmedQuery;
    } else {
      // Для пустого поиска удаляем search параметр
      delete params.search;
    }

    await loadWorkers(params);

    // Обновляем текущую страницу в пагинации
    pagination.value.page = 1;
  } catch (error) {
    console.error('Ошибка поиска работников:', error);
    searchError.value = 'Ошибка поиска работников';
  } finally {
    isSearchLoading.value = false;
  }
};

// Обработчики событий
const handleSearch = async (query: string) => {
  await searchWorkers(query);
};

const handlePagination = async (params: Omit<PaginationParams, 'filter'>) => {
  const workersParams: WorkersListParams = {
    page: params.page,
    rowsPerPage: params.rowsPerPage,
    sortBy: params.sortBy || 'name',
    descending: params.descending || false,
  };

  // Сохраняем текущий поисковый запрос при пагинации
  if (params.search) {
    workersParams.search = params.search;
  }

  await loadWorkers(workersParams);
};

const handleToggle = (item: SelectionItem) => {
  const index = selectedIds.value.indexOf(item._id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(item._id);
  }
};

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    const currentPageIds = selectionItems.value.map((item) => item._id);
    const newIds = currentPageIds.filter((id) => !selectedIds.value.includes(id));
    selectedIds.value.push(...newIds);
  } else {
    // Снимаем выбор со всех работников на текущей странице
    const currentPageIds = selectionItems.value.map((item) => item._id);
    selectedIds.value = selectedIds.value.filter((id) => !currentPageIds.includes(id));
  }
};

const handleConfirm = (selectedIdsList: string[]) => {
  emit('confirm', selectedIdsList);
};

const handleReset = () => {
  selectedIds.value = [];
};

// Инициализация
onMounted(async () => {
  await loadWorkers({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'name',
    descending: false,
  });
});
</script>

<style scoped lang="scss">
// Стили для формы выбора альтернатив работников
</style>

