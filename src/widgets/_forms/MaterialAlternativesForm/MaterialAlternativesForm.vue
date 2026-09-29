<template>
  <div class="material-alternatives-form">
    <AlternativesSelectionTemplate
      :items="materials"
      :selected-items="selectedIds"
      :pagination="pagination"
      :loading="isLoading"
      :search-loading="isSearchLoading"
      :search-error="searchError"
      title="Выбор альтернативных материалов"
      search-placeholder="Поиск материалов..."
      select-button-text="Выбрать материалы"
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
import { materialApi } from 'src/entities/material/api/material.api';
import { AlternativesSelectionTemplate } from 'src/shared/templates';
import type {
  MaterialListItem,
  MaterialsListParams,
  MaterialsListResponse,
  MaterialsPaginationMeta,
} from 'src/entities/material/model/material.types';
import type { PaginationParams } from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  /** ID текущего материала (чтобы исключить его из списка) */
  excludeMaterialId: string | undefined;
  /** Предварительно выбранные материалы */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'confirm', selectedIds: string[]): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  excludeMaterialId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Состояние
const materials = ref<MaterialListItem[]>([]);
const selectedIds = ref<string[]>([...props.preselectedIds]);
const isLoading = ref(false);
const isSearchLoading = ref(false);
const searchError = ref<string | null>(null);

// Пагинация
const pagination = ref<MaterialsPaginationMeta>({
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

// Следим за изменениями preselectedIds и обновляем selectedIds
watch(() => props.preselectedIds, (newPreselectedIds) => {
  selectedIds.value = [...(newPreselectedIds || [])];
}, { immediate: false });

// Загрузка материалов
const loadMaterials = async (params: MaterialsListParams = {}) => {
  try {
    isLoading.value = true;
    searchError.value = null;

    const response: MaterialsListResponse = await materialApi.getAll(params);

    // Исключаем текущий материал из списка и показываем только материалы с непустым p_id
    materials.value = response.data.filter(
      (material) => material._id !== props.excludeMaterialId && material.p_id && material.p_id.trim() !== ''
    );

    // Обновляем пагинацию (currentSearchParams обновится автоматически через computed)
    pagination.value = {
      ...pagination.value,
      ...response.pagination,
    };
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
    searchError.value = 'Ошибка загрузки материалов';
    materials.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Поиск материалов
const searchMaterials = async (query: string) => {
  try {
    isSearchLoading.value = true;

    const params: MaterialsListParams = {
      ...currentSearchParams.value,
      page: 1, // Сбрасываем на первую страницу при поиске
      sortBy: currentSearchParams.value.sortBy || 'name',
      descending: currentSearchParams.value.descending || false,
    };

    // Устанавливаем search параметр только если запрос не пустой
    // При пустой строке API вернет все материалы
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.search = trimmedQuery;
    } else {
      // Для пустого поиска удаляем search параметр
      delete params.search;
    }

    await loadMaterials(params);

    // Обновляем текущую страницу в пагинации
    pagination.value.page = 1;
  } catch (error) {
    console.error('Ошибка поиска материалов:', error);
    searchError.value = 'Ошибка поиска материалов';
  } finally {
    isSearchLoading.value = false;
  }
};

// Обработчики событий
const handleSearch = async (query: string) => {
  await searchMaterials(query);
};

const handlePagination = async (params: Omit<PaginationParams, 'filter'>) => {
  const materialsParams: MaterialsListParams = {
    page: params.page,
    rowsPerPage: params.rowsPerPage,
    sortBy: params.sortBy || 'name',
    descending: params.descending || false,
  };

  // Сохраняем текущий поисковый запрос при пагинации
  if (params.search) {
    materialsParams.search = params.search;
  }

  await loadMaterials(materialsParams);
};

const handleToggle = (material: MaterialListItem) => {
  const index = selectedIds.value.indexOf(material._id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(material._id);
  }
};

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    const currentPageIds = materials.value.map((m) => m._id);
    const newIds = currentPageIds.filter((id) => !selectedIds.value.includes(id));
    selectedIds.value.push(...newIds);
  } else {
    // Снимаем выбор со всех материалов на текущей странице
    const currentPageIds = materials.value.map((m) => m._id);
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
  await loadMaterials({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'name',
    descending: false,
  });
});
</script>

<style scoped lang="scss">
// Стили для формы выбора альтернатив материалов
</style>
