<template>
  <div class="alternatives-tab">
    <AlternativesListTemplate
      :alternatives="currentAlternatives"
      :loading="!!isLoading"
      :search-error="searchError"
      :search-results="searchResults"
      :search-loading="isSearchLoading"
      search-placeholder="Поиск альтернативных материалов..."
      add-button-text="Добавить альтернативу"
      :show-batch-count="true"
      entity-type="materials"
      @search="handleSearch"
      @add="handleAdd"
      @remove="handleRemove"
      @select="handleSelect"
    />

    <!-- Диалог выбора альтернатив -->
    <MaterialAlternativesFormDialog
      v-model="alternativesDialogVisible"
      :exclude-material-id="props.material._id"
      :preselected-ids="currentAlternatives.map((alt: MaterialAlternativeDto) => alt._id)"
      @confirm="handleConfirmSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useMaterialStore } from 'src/entities/material/model/material.store';
import { AlternativesListTemplate } from 'src/shared/templates';
import { MaterialAlternativesFormDialog } from 'src/widgets/_forms';
import type {
  MaterialListItem,
  MaterialAlternativeDto,
} from 'src/entities/material/model/material.types';

const props = defineProps<{
  material: MaterialListItem;
}>();

const materialStore = useMaterialStore();
const {
  materialAlternatives,
  isAlternativesLoading,
  alternativesCache,
  searchAlternativesResult,
  isSearchAlternativesLoading,
  searchAlternativesError,
  fetchMaterialAlternatives,
  searchMaterialAlternatives,
  updateMaterialAlternatives,
  clearSearchAlternatives,
} = materialStore;

// Состояние диалога выбора альтернатив
const alternativesDialogVisible = ref(false);

  // Текущие альтернативы - берем из кэша, если есть, иначе из materialAlternatives
  const currentAlternatives = computed(() => {
    const cached = alternativesCache.get(props.material._id);
    return cached || materialAlternatives || [];
  });

// Состояние загрузки - показываем loading если загружаем или если есть альтернативы в материале но не в кэше
const isLoading = computed(() => {
  const hasAlternativesInMaterial = props.material.alternative && props.material.alternative.length > 0;
  const hasCachedAlternatives = alternativesCache.has(props.material._id);
  return isAlternativesLoading || (hasAlternativesInMaterial && !hasCachedAlternatives);
});

// Ошибка поиска
const searchError = computed(() => searchAlternativesError);

// Результаты поиска
const searchResults = computed(() => {
  return searchAlternativesResult?.alternatives || null;
});

// Загрузка поиска
const isSearchLoading = computed(() => isSearchAlternativesLoading);

// Функция загрузки альтернатив
const loadAlternatives = async (materialId: string) => {
  try {
    await fetchMaterialAlternatives(materialId);
  } catch (error) {
    console.error('Ошибка загрузки альтернатив:', error);
  }
};

// Загрузка альтернатив при монтировании компонента
onMounted(async () => {
  await loadAlternatives(props.material._id);
});

// Следим за изменениями материала и загружаем альтернативы при необходимости
watch(() => props.material._id, async (newMaterialId, oldMaterialId) => {
  if (newMaterialId && newMaterialId !== oldMaterialId) {
    await loadAlternatives(newMaterialId);
  }
});

// Обработчик поиска альтернатив
const handleSearch = async (query: string) => {
  try {
    await searchMaterialAlternatives(query);
  } catch (error) {
    console.error('Ошибка поиска альтернатив:', error);
  }
};

// Обработчик добавления альтернативы
const handleAdd = () => {
  alternativesDialogVisible.value = true;
};

// Обработчик удаления альтернативы
const handleRemove = async (alternative: MaterialAlternativeDto) => {
  try {
    // Получаем текущие ID альтернатив, исключая удаляемую
    const currentIds = currentAlternatives.value
      .filter((alt: MaterialAlternativeDto) => alt._id !== alternative._id)
      .map((alt: MaterialAlternativeDto) => alt._id);

    await updateMaterialAlternatives({
      _id: props.material._id,
      alternativeIds: currentIds,
    });

    // Перезагружаем список альтернатив
    await fetchMaterialAlternatives(props.material._id);
  } catch (error) {
    console.error('Ошибка удаления альтернативы:', error);
  }
};

// Обработчик выбора альтернативы из поиска
const handleSelect = async (alternative: MaterialAlternativeDto) => {
  try {
    // Получаем текущие ID альтернатив и добавляем выбранную
    const currentIds = currentAlternatives.value.map((alt: MaterialAlternativeDto) => alt._id);
    const newIds = [...new Set([...currentIds, alternative._id])];

    await updateMaterialAlternatives({
      _id: props.material._id,
      alternativeIds: newIds,
    });

    // Перезагружаем список альтернатив
    await fetchMaterialAlternatives(props.material._id);

    // Очищаем результаты поиска
    clearSearchAlternatives();
  } catch (error) {
    console.error('Ошибка добавления альтернативы:', error);
  }
};

// Обработчик подтверждения выбора альтернатив из диалога
const handleConfirmSelection = async (selectedIds: string[]) => {
  try {
    await updateMaterialAlternatives({
      _id: props.material._id,
      alternativeIds: selectedIds,
    });

    // Перезагружаем список альтернатив
    await fetchMaterialAlternatives(props.material._id);
  } catch (error) {
    console.error('Ошибка обновления альтернатив:', error);
  }
};
</script>

<style scoped lang="scss">
.alternatives-tab {
  // Стили для компонента alternatives tab
  min-height: 200px;
}
</style>
