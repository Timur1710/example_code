<template>
  <div class="alternatives-tab">
    <AlternativesListTemplate
      :alternatives="currentAlternatives"
      :loading="!!isLoading"
      :search-error="searchError"
      :search-results="searchResults"
      :search-loading="isSearchLoading"
      search-placeholder="Поиск альтернативных сотрудников..."
      add-button-text="Добавить альтернативу"
      :show-batch-count="false"
      entity-type="workers"
      @search="handleSearch"
      @add="handleAdd"
      @remove="handleRemove"
      @select="handleSelect"
    />

    <!-- Диалог выбора альтернатив -->
    <WorkerAlternativesFormDialog
      v-model="alternativesDialogVisible"
      :exclude-worker-id="props.worker._id"
      :preselected-ids="currentAlternatives.map((alt: WorkerAlternativeDto) => alt._id)"
      @confirm="handleConfirmSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useWorkerStore } from 'src/entities/worker/model/worker.store';
import { AlternativesListTemplate } from 'src/shared/templates';
import { WorkerAlternativesFormDialog } from 'src/widgets/_forms';
import type { WorkerDetail, WorkerAlternativeDto } from 'src/entities/worker/model/worker.types';

const props = defineProps<{
  worker: WorkerDetail;
}>();

const workerStore = useWorkerStore();
const {
  workerAlternatives,
  isAlternativesLoading,
  alternativesCache,
  searchAlternativesResult,
  isSearchAlternativesLoading,
  searchAlternativesError,
  fetchWorkerAlternatives,
  searchWorkerAlternatives,
  updateWorkerAlternatives,
  clearSearchAlternatives,
} = workerStore;

// Состояние диалога выбора альтернатив
const alternativesDialogVisible = ref(false);

// Текущие альтернативы - берем из кэша, если есть, иначе из workerAlternatives
const currentAlternatives = computed(() => {
  const cached = alternativesCache.get(props.worker._id);
  return cached || workerAlternatives || [];
});

// Состояние загрузки - показываем loading если загружаем или если есть альтернативы в работнике но не в кэше
const isLoading = computed(() => {
  const hasAlternativesInWorker = props.worker.alternative && props.worker.alternative.length > 0;
  const hasCachedAlternatives = alternativesCache.has(props.worker._id);
  return isAlternativesLoading || (hasAlternativesInWorker && !hasCachedAlternatives);
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
const loadAlternatives = async (workerId: string) => {
  try {
    await fetchWorkerAlternatives(workerId);
  } catch (error) {
    console.error('Ошибка загрузки альтернатив:', error);
  }
};

// Загрузка альтернатив при монтировании компонента
onMounted(async () => {
  await loadAlternatives(props.worker._id);
});

// Следим за изменениями работника и загружаем альтернативы при необходимости
watch(
  () => props.worker._id,
  async (newWorkerId, oldWorkerId) => {
    if (newWorkerId && newWorkerId !== oldWorkerId) {
      await loadAlternatives(newWorkerId);
    }
  }
);

// Обработчик поиска альтернатив
const handleSearch = async (query: string) => {
  try {
    await searchWorkerAlternatives(query);
  } catch (error) {
    console.error('Ошибка поиска альтернатив:', error);
  }
};

// Обработчик добавления альтернативы
const handleAdd = () => {
  alternativesDialogVisible.value = true;
};

// Обработчик удаления альтернативы
const handleRemove = async (alternative: WorkerAlternativeDto) => {
  try {
    // Получаем текущие ID альтернатив, исключая удаляемую
    const currentIds = currentAlternatives.value
      .filter((alt: WorkerAlternativeDto) => alt._id !== alternative._id)
      .map((alt: WorkerAlternativeDto) => alt._id);

    await updateWorkerAlternatives({
      _id: props.worker._id,
      alternativeIds: currentIds,
    });

    // Перезагружаем список альтернатив
    await fetchWorkerAlternatives(props.worker._id);
  } catch (error) {
    console.error('Ошибка удаления альтернативы:', error);
  }
};

// Обработчик выбора альтернативы из поиска
const handleSelect = async (alternative: WorkerAlternativeDto) => {
  try {
    // Получаем текущие ID альтернатив и добавляем выбранную
    const currentIds = currentAlternatives.value.map((alt: WorkerAlternativeDto) => alt._id);
    const newIds = [...new Set([...currentIds, alternative._id])];

    await updateWorkerAlternatives({
      _id: props.worker._id,
      alternativeIds: newIds,
    });

    // Перезагружаем список альтернатив
    await fetchWorkerAlternatives(props.worker._id);

    // Очищаем результаты поиска
    clearSearchAlternatives();
  } catch (error) {
    console.error('Ошибка добавления альтернативы:', error);
  }
};

// Обработчик подтверждения выбора альтернатив из диалога
const handleConfirmSelection = async (selectedIds: string[]) => {
  try {
    await updateWorkerAlternatives({
      _id: props.worker._id,
      alternativeIds: selectedIds,
    });

    // Перезагружаем список альтернатив
    await fetchWorkerAlternatives(props.worker._id);
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
