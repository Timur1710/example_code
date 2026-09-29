<template>
  <div class="alternatives-tab">
    <AlternativesListTemplate
      :alternatives="currentAlternatives"
      :loading="!!isLoading"
      :search-error="searchError"
      :search-results="searchResults"
      :search-loading="isSearchLoading"
      search-placeholder="Поиск альтернативного оборудования..."
      add-button-text="Добавить альтернативу"
      :show-batch-count="true"
      entity-type="equipments"
      @search="handleSearch"
      @add="handleAdd"
      @remove="handleRemove"
      @select="handleSelect"
    />

    <!-- Диалог выбора альтернатив -->
    <EquipmentAlternativesFormDialog
      v-model="alternativesDialogVisible"
      :exclude-equipment-id="props.equipment._id"
      :preselected-ids="currentAlternatives.map((alt: EquipmentAlternative) => alt._id)"
      @confirm="handleConfirmSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useEquipmentStore } from 'src/entities/equipment/model/equipment.store';
import { AlternativesListTemplate } from 'src/shared/templates';
import { EquipmentAlternativesFormDialog } from 'src/widgets/_forms';
import type {
  EquipmentListItem,
  EquipmentAlternative,
} from 'src/entities/equipment/model/equipment.types';

const props = defineProps<{
  equipment: EquipmentListItem;
}>();

const equipmentStore = useEquipmentStore();
const {
  equipmentAlternatives,
  isAlternativesLoading,
  alternativesCache,
  searchAlternativesResult,
  isSearchAlternativesLoading,
  searchAlternativesError,
  fetchEquipmentAlternatives,
  searchEquipmentAlternatives,
  updateEquipmentAlternatives,
  clearSearchAlternatives,
  clearEquipmentAlternativesCache,
} = equipmentStore;

// Состояние диалога выбора альтернатив
const alternativesDialogVisible = ref(false);

// Текущие альтернативы - берем из кэша, если есть, иначе из equipmentAlternatives
const currentAlternatives = computed(() => {
  const cached = alternativesCache.get(props.equipment._id);
  return cached || equipmentAlternatives || [];
});

// Состояние загрузки - показываем loading если загружаем или если есть альтернативы в оборудовании но не в кэше
const isLoading = computed(() => {
  const hasAlternativesInEquipment =
    props.equipment.alternative &&
    Array.isArray(props.equipment.alternative) &&
    props.equipment.alternative.length > 0;
  const hasCachedAlternatives = alternativesCache.has(props.equipment._id);
  return isAlternativesLoading || (hasAlternativesInEquipment && !hasCachedAlternatives);
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
const loadAlternatives = async (equipmentId: string) => {
  try {
    await fetchEquipmentAlternatives(equipmentId);
  } catch (error) {
    console.error('Ошибка загрузки альтернатив:', error);
  }
};

// Загрузка альтернатив при монтировании компонента
onMounted(async () => {
  await loadAlternatives(props.equipment._id);
});

// Следим за изменениями оборудования и загружаем альтернативы при необходимости
watch(
  () => props.equipment._id,
  async (newEquipmentId, oldEquipmentId) => {
    if (newEquipmentId && newEquipmentId !== oldEquipmentId) {
      await loadAlternatives(newEquipmentId);
    }
  }
);

// Обработчик поиска альтернатив
const handleSearch = async (query: string) => {
  try {
    await searchEquipmentAlternatives(query);
  } catch (error) {
    console.error('Ошибка поиска альтернатив:', error);
  }
};

// Обработчик добавления альтернативы
const handleAdd = () => {
  alternativesDialogVisible.value = true;
};

// Обработчик удаления альтернативы
const handleRemove = async (alternative: EquipmentAlternative) => {
  try {
    // Получаем текущие ID альтернатив, исключая удаляемую
    const currentIds = currentAlternatives.value
      .filter((alt: EquipmentAlternative) => alt._id !== alternative._id)
      .map((alt: EquipmentAlternative) => alt._id);

    await updateEquipmentAlternatives({
      _id: props.equipment._id,
      alternativeIds: currentIds,
    });

    // Очищаем кэш и перезагружаем список альтернатив
    clearEquipmentAlternativesCache(props.equipment._id);
    await fetchEquipmentAlternatives(props.equipment._id);
  } catch (error) {
    console.error('Ошибка удаления альтернативы:', error);
  }
};

// Обработчик выбора альтернативы из поиска
const handleSelect = async (alternative: EquipmentAlternative) => {
  try {
    // Получаем текущие ID альтернатив и добавляем выбранную
    const currentIds = currentAlternatives.value.map((alt: EquipmentAlternative) => alt._id);
    const newIds = [...new Set([...currentIds, alternative._id])];

    await updateEquipmentAlternatives({
      _id: props.equipment._id,
      alternativeIds: newIds,
    });

    // Очищаем кэш и перезагружаем список альтернатив
    clearEquipmentAlternativesCache(props.equipment._id);
    await fetchEquipmentAlternatives(props.equipment._id);

    // Очищаем результаты поиска
    clearSearchAlternatives();
  } catch (error) {
    console.error('Ошибка добавления альтернативы:', error);
  }
};

// Обработчик подтверждения выбора альтернатив из диалога
const handleConfirmSelection = async (selectedIds: string[]) => {
  try {
    await updateEquipmentAlternatives({
      _id: props.equipment._id,
      alternativeIds: selectedIds,
    });

    // Очищаем кэш и перезагружаем список альтернатив
    clearEquipmentAlternativesCache(props.equipment._id);
    await fetchEquipmentAlternatives(props.equipment._id);
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
