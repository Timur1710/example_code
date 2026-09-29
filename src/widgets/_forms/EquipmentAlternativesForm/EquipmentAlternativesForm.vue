<template>
  <div class="equipment-alternatives-form">
    <AlternativesSelectionTemplate
      :items="selectionItems"
      :selected-items="selectedIds"
      :pagination="pagination"
      :loading="isLoading"
      :search-loading="isSearchLoading"
      :search-error="searchError"
      title="Выбор альтернативного оборудования"
      search-placeholder="Поиск оборудования..."
      select-button-text="Выбрать оборудование"
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
import { equipmentApi } from 'src/entities/equipment/api/equipment.api';
import { AlternativesSelectionTemplate } from 'src/shared/templates';
import type {
  EquipmentListItem,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentPaginationMeta,
} from 'src/entities';
import type { PaginationParams, SelectionItem } from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  /** ID текущего оборудования (чтобы исключить его из списка) */
  excludeEquipmentId: string | undefined;
  /** Предварительно выбранное оборудование */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'confirm', selectedIds: string[]): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  excludeEquipmentId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Состояние
const equipment = ref<EquipmentListItem[]>([]);
const selectedIds = ref<string[]>([...props.preselectedIds]);
const isLoading = ref(false);
const isSearchLoading = ref(false);
const searchError = ref<string | null>(null);

// Пагинация
const pagination = ref<EquipmentPaginationMeta>({
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

// Преобразование оборудования в SelectionItem[]
const selectionItems = computed(() => {
  return equipment.value.map((item) => {
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

// Загрузка оборудования
const loadEquipment = async (params: EquipmentListParams = {}) => {
  try {
    isLoading.value = true;
    searchError.value = null;

    const response: EquipmentListResponse = await equipmentApi.getAll(params);

    // Исключаем текущее оборудование из списка и показываем только оборудование с непустым p_id
    equipment.value = response.data.filter(
      (item) => item._id !== props.excludeEquipmentId && item.p_id && item.p_id.trim() !== ''
    );

    // Обновляем пагинацию (currentSearchParams обновится автоматически через computed)
    pagination.value = {
      ...pagination.value,
      ...response.pagination,
    };
  } catch (error) {
    console.error('Ошибка загрузки оборудования:', error);
    searchError.value = 'Ошибка загрузки оборудования';
    equipment.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Поиск оборудования
const searchEquipment = async (query: string) => {
  try {
    isSearchLoading.value = true;

    const params: EquipmentListParams = {
      ...currentSearchParams.value,
      page: 1, // Сбрасываем на первую страницу при поиске
      sortBy: currentSearchParams.value.sortBy || 'name',
      descending: currentSearchParams.value.descending || false,
    };

    // Устанавливаем search параметр только если запрос не пустой
    // При пустой строке API вернет все оборудование
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.search = trimmedQuery;
    } else {
      // Для пустого поиска удаляем search параметр
      delete params.search;
    }

    await loadEquipment(params);

    // Обновляем текущую страницу в пагинации
    pagination.value.page = 1;
  } catch (error) {
    console.error('Ошибка поиска оборудования:', error);
    searchError.value = 'Ошибка поиска оборудования';
  } finally {
    isSearchLoading.value = false;
  }
};

// Обработчики событий
const handleSearch = async (query: string) => {
  await searchEquipment(query);
};

const handlePagination = async (params: Omit<PaginationParams, 'filter'>) => {
  const equipmentParams: EquipmentListParams = {
    page: params.page,
    rowsPerPage: params.rowsPerPage,
    sortBy: params.sortBy || 'name',
    descending: params.descending || false,
  };

  // Сохраняем текущий поисковый запрос при пагинации
  if (params.search) {
    equipmentParams.search = params.search;
  }

  await loadEquipment(equipmentParams);
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
    // Снимаем выбор со всего оборудования на текущей странице
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
  await loadEquipment({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'name',
    descending: false,
  });
});
</script>

<style scoped lang="scss">
// Стили для формы выбора альтернатив оборудования
</style>
