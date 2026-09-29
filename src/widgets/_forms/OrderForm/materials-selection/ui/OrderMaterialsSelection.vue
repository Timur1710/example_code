<template>
  <div class="order-materials-selection">
    <div class="order-materials-selection__header">
      <div class="text-subtitle1">Заказ на материалы:</div>
      <q-btn
        v-if="modelValue.length > 0"
        icon="add"
        color="primary"
        label="Добавить материал"
        flat
        size="sm"
        @click="showSelectionDialog = true"
      >
        <q-tooltip>Добавить материал</q-tooltip>
      </q-btn>
    </div>

    <div v-if="modelValue.length > 0" class="order-materials-selection__list">
      <q-list bordered separator>
        <q-item v-for="(material, index) in modelValue" :key="getMaterialId(material)">
          <q-item-section>
            <q-item-label>{{ getMaterialName(material) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-input
                :model-value="material.quantity"
                type="number"
                dense
                outlined
                min="0"
                step="1"
                label="Количество"
                style="width: 120px"
                @update:model-value="updateQuantity(index, $event)"
              />
              <q-btn
                icon="delete"
                color="negative"
                flat
                dense
                round
                size="sm"
                @click="removeMaterial(index)"
              >
                <q-tooltip>Удалить</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div v-else class="order-materials-selection__empty">
      <q-icon name="inventory_2" size="48px" color="grey-5" />
      <div class="text-grey-6 q-mt-sm">Материалы не добавлены</div>
      <q-btn
        label="Добавить материал"
        color="primary"
        outline
        class="q-mt-md"
        @click="showSelectionDialog = true"
      />
    </div>

    <!-- Диалог выбора материалов с использованием DialogWrapper -->
    <DialogWrapper
      v-model="showSelectionDialog"
      title="Выбор материалов для заказа"
      icon="inventory_2"
      content-class="dialog-wrapper__materials-content"
      :card-style="cardStyle"
      :hide-actions="true"
    >
      <template #content>
        <AlternativesSelectionTemplate
          :items="materials"
          :selected-items="selectedIds"
          :pagination="pagination"
          :loading="isLoading"
          :search-loading="isSearchLoading"
          :search-error="searchError"
          search-placeholder="Поиск материалов..."
          select-button-text="Добавить выбранные"
          @search="handleSearch"
          @pagination="handlePagination"
          @toggle="handleToggle"
          @select-all="handleSelectAll"
          @reset="handleReset"
          @confirm="handleConfirm"
        />
      </template>
    </DialogWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { materialApi, type MaterialListItem } from 'src/entities/material';
import { AlternativesSelectionTemplate } from 'src/shared/templates';
import { DialogWrapper } from 'src/shared/ui';
import type { OrderMaterialDto } from 'src/entities/order';
import type {
  MaterialsListParams,
  MaterialsListResponse,
  MaterialsPaginationMeta,
} from 'src/entities/material/model/material.types';
import type { PaginationParams } from 'src/shared/templates/AlternativesSelectionTemplate/model/types';

interface Props {
  modelValue: OrderMaterialDto[];
  productionUnitId: string | null;
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: OrderMaterialDto[]): void;
}

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

// Состояние
const showSelectionDialog = ref(false);
const materials = ref<MaterialListItem[]>([]);
const selectedIds = ref<string[]>([]);
const isLoading = ref(false);
const isSearchLoading = ref(false);
const searchError = ref<string | null>(null);
const materialsCache = ref<Map<string, MaterialListItem>>(new Map());

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

// Получаем название материала из кеша или materialData
function getMaterialName(material: unknown): string {
  if (material && typeof material === 'object') {
    const matObj = material as Record<string, unknown>;

    // Если есть materialData, используем его
    if (matObj.materialData && typeof matObj.materialData === 'object') {
      const matData = matObj.materialData as Record<string, unknown>;
      if (typeof matData.name === 'string') {
        return matData.name;
      }
    }

    // Если materialId это строка, ищем в кеше
    if (typeof matObj.materialId === 'string') {
      const cached = materialsCache.value.get(matObj.materialId);
      if (cached?.name) {
        return cached.name;
      }
      // Если кеш не заполнен, показываем подсказку
      return 'Загружается...';
    }
  }

  return 'Неизвестный материал';
}

// Получаем ID материала
function getMaterialId(material: unknown): string {
  if (material && typeof material === 'object') {
    const matObj = material as Record<string, unknown>;
    if (typeof matObj.materialId === 'string') {
      return matObj.materialId;
    }
  }
  return '';
}

// Загрузка материалов
const loadMaterials = async (params: MaterialsListParams = {}) => {
  try {
    isLoading.value = true;
    searchError.value = null;

    // Запрашиваем материалы с фильтром по потокам
    const finalParams: MaterialsListParams = {
      ...params,
      hasStream: true, // Фильтруем только материалы с назначенным потоком
    };

    console.log('Loading materials with params:', finalParams);

    const response: MaterialsListResponse = await materialApi.getAll(finalParams);

    console.log('Materials response:', response.data.length, 'items');

    // Используем материалы как есть из API
    materials.value = response.data;

    // Обновляем пагинацию
    pagination.value = {
      ...pagination.value,
      ...response.pagination,
    };

    // Кешируем материалы
    response.data.forEach((material) => {
      materialsCache.value.set(material._id, material);
    });
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
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.search = trimmedQuery;
    } else {
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

// Загружаем информацию о материалах, которые уже добавлены (если они не содержат materialData)
async function loadExistingMaterials(): Promise<void> {
  if (props.modelValue.length === 0) return;

  try {
    const materialIds: string[] = [];
    props.modelValue.forEach((m) => {
      if (m && typeof m === 'object') {
        const matObj = m as Record<string, unknown>;
        // Если нет materialData и есть ID, добавляем в очередь загрузки
        if (!matObj.materialData && typeof matObj.materialId === 'string') {
          materialIds.push(matObj.materialId);
        }
      }
    });

    const uniqueIds = [...new Set(materialIds)];

    // Загружаем материалы параллельно для скорости
    const promises = uniqueIds.map(async (id) => {
      if (!materialsCache.value.has(id)) {
        try {
          const material = await materialApi.getById(id);
          if (material) {
            materialsCache.value.set(id, material);
          }
        } catch (error) {
          console.error(`Failed to load material ${id}:`, error);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to load existing materials:', error);
  }
}

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

const handleReset = () => {
  selectedIds.value = [];
};

const getMaterialIdValue = (materialId: unknown): string | null => {
  if (typeof materialId === 'string') {
    return materialId;
  }
  if (materialId && typeof materialId === 'object') {
    const obj = materialId as Record<string, unknown>;
    if (typeof obj._id === 'string') {
      return obj._id;
    }
  }
  return null;
};

const handleConfirm = (selectedIdsList: string[]) => {
  // Создаём набор выбранных ID для быстрого поиска
  const selectedSet = new Set(selectedIdsList);

  const newMaterials: OrderMaterialDto[] = [];

  // Сохраняем существующие материалы, которые остались выбранными (с их количеством)
  props.modelValue.forEach((m) => {
    const materialId = getMaterialIdValue(m.materialId);
    if (materialId && selectedSet.has(materialId)) {
      newMaterials.push(m);
    }
  });

  // Добавляем новые материалы, которых не было в списке
  selectedIdsList.forEach((id) => {
    if (!props.modelValue.some((m) => {
      const matId = getMaterialIdValue(m.materialId);
      return matId === id;
    })) {
      newMaterials.push({
        materialId: id,
        quantity: 1,
      });
    }
  });

  emit('update:modelValue', newMaterials);
  showSelectionDialog.value = false;
  selectedIds.value = [];
}

function updateQuantity(index: number, value: string | number | null): void {
  const material = props.modelValue[index];
  if (!material) return;

  const numValue = typeof value === 'number' ? value : Number(value);
  if (!isNaN(numValue) && numValue >= 0) {
    const newMaterials = [...props.modelValue];
    newMaterials[index] = { ...material, quantity: numValue };
    emit('update:modelValue', newMaterials);
  }
}

function removeMaterial(index: number): void {
  const newMaterials = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newMaterials);
}

// При открытии диалога загружаем материалы и синхронизируем выбранные ID
watch(showSelectionDialog, (newValue) => {
  if (newValue) {
    // Синхронизируем selectedIds с материалами из modelValue
    const modelValueIds: string[] = [];
    props.modelValue.forEach((m) => {
      if (typeof m.materialId === 'string') {
        modelValueIds.push(m.materialId);
      }
    });
    selectedIds.value = modelValueIds;

    void loadMaterials({
      page: 1,
      rowsPerPage: 10,
      sortBy: 'name',
      descending: false,
    });
  } else {
    selectedIds.value = [];
  }
});

// Следим за изменением productionUnitId и перезагружаем материалы
watch(
  () => props.productionUnitId,
  (newId) => {
    if (newId && showSelectionDialog.value) {
      void loadMaterials({
        page: 1,
        rowsPerPage: 10,
        sortBy: 'name',
        descending: false,
      });
    }
  }
);

// Следим за изменением modelValue и загружаем информацию о новых материалах
watch(
  () => props.modelValue,
  () => {
    void loadExistingMaterials();
  },
  { deep: true }
);

// Загружаем существующие материалы при монтировании
void loadExistingMaterials();
</script>

<style scoped lang="scss">
.order-materials-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__list {
    border-radius: 4px;
    overflow: hidden;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    text-align: center;
  }
}

.materials-list {
  max-height: 400px;
  overflow-y: auto;
}

.dialog-wrapper__materials-content {
  padding: 12px;
  min-width: 500px;
}
</style>
