/**
 * Pinia store для материалов
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { materialApi } from '../api/material.api';
import type {
  GetMaterialAlternativesResponse,
  GetStreamByMaterialResponse,
  MaterialAlternativeDto,
  MaterialListItem,
  MaterialFeature,
  MaterialsListParams,
  MaterialsListResponse,
  MaterialsPaginationMeta,
  StreamByMaterialDto,
  UpdateMaterialRequest,
  UpdateMaterialResponse,
  UpdateMaterialAlternativesRequest,
  UpdateMaterialAlternativesResponse,
  SearchMaterialAlternativesResponse,
} from './material.types';

export const useMaterialStore = defineStore('material', () => {
  // === State ===
  const materials = ref<MaterialListItem[]>([]);
  const selectedMaterial = ref<MaterialListItem | null>(null);
  const pagination = ref<MaterialsPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isMaterialDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const materialDetailsError = ref<string | null>(null);

  // === Alternatives State ===
  const materialAlternatives = ref<MaterialAlternativeDto[] | null>(null);
  const isAlternativesLoading = ref(false);
  const alternativesError = ref<string | null>(null);

  // === Alternatives Cache ===
  const alternativesCache = ref<Map<string, MaterialAlternativeDto[]>>(new Map());

  // === Update Alternatives State ===
  const isUpdateAlternativesLoading = ref(false);
  const updateAlternativesError = ref<string | null>(null);

  // === Search Alternatives State ===
  const searchAlternativesResult = ref<SearchMaterialAlternativesResponse | null>(null);
  const isSearchAlternativesLoading = ref(false);
  const searchAlternativesError = ref<string | null>(null);

  // === Stream State ===
  const materialStream = ref<StreamByMaterialDto | null>(null);
  const isStreamLoading = ref(false);
  const streamError = ref<string | null>(null);

  // === Getters ===
  const hasMaterials = computed(() => materials.value.length > 0);

  // === Actions ===

  /**
   * Загрузить материалы по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: MaterialsListParams = {},
  ): Promise<MaterialsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await materialApi.getByProductionUnit(productionUnitId, params);
      materials.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки материалов';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить все материалы
   */
  async function fetchAll(params: MaterialsListParams = {}): Promise<MaterialsListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await materialApi.getAll(params);
      materials.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки материалов';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить материал по ID
   */
  async function fetchMaterialById(id: string): Promise<MaterialListItem | null> {
    isMaterialDetailsLoading.value = true;
    materialDetailsError.value = null;

    try {
      const material = await materialApi.getById(id);
      selectedMaterial.value = material;
      if (!material) {
        materialDetailsError.value = 'Материал не найден';
      }
      return material;
    } catch (e) {
      materialDetailsError.value = 'Ошибка загрузки материала';
      throw e;
    } finally {
      isMaterialDetailsLoading.value = false;
    }
  }

  /**
   * Удалить материал
   */
  async function deleteMaterial(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await materialApi.delete(id);

      materials.value = materials.value.filter((material) => material._id !== id);

      if (selectedMaterial.value?._id === id) {
        selectedMaterial.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления материала';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить материал
   */
  async function updateMaterial(
    payload: UpdateMaterialRequest
  ): Promise<UpdateMaterialResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await materialApi.update(payload);

      materials.value = materials.value.map((material) =>
        material._id === updated._id ? { ...material, ...updated } : material
      );

      if (selectedMaterial.value?._id === updated._id) {
        selectedMaterial.value = { ...selectedMaterial.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления материала';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Обновить только характеристики материала
   */
  async function updateMaterialFeature(
    materialId: string,
    feature: MaterialFeature
  ): Promise<UpdateMaterialResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await materialApi.update({
        _id: materialId,
        feature,
      });

      materials.value = materials.value.map((material) =>
        material._id === updated._id ? { ...material, ...updated } : material
      );

      if (selectedMaterial.value?._id === updated._id) {
        selectedMaterial.value = { ...selectedMaterial.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления характеристик материала';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<MaterialsPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список материалов
   */
  function clearMaterials(): void {
    materials.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранный материал
   */
  function clearSelectedMaterial(): void {
    selectedMaterial.value = null;
    materialDetailsError.value = null;
  }

  /**
   * Получить материал с его альтернативами
   */
  async function fetchMaterialAlternatives(id: string): Promise<GetMaterialAlternativesResponse> {
    isAlternativesLoading.value = true;
    alternativesError.value = null;

    try {
      // Проверяем кэш
      if (alternativesCache.value.has(id)) {
        materialAlternatives.value = alternativesCache.value.get(id)!;
        return {
          material: {} as MaterialAlternativeDto, // Заглушка, не используется в текущей логике
          alternatives: materialAlternatives.value
        };
      }

      // Загружаем с сервера и сохраняем в кэш
      const response: GetMaterialAlternativesResponse = await materialApi.getMaterialAlternatives(id);
      alternativesCache.value.set(id, response.alternatives);
      materialAlternatives.value = response.alternatives;
      return response;
    } catch (e) {
      alternativesError.value = 'Ошибка загрузки альтернатив материала';
      throw e;
    } finally {
      isAlternativesLoading.value = false;
    }
  }

  /**
   * Очистить альтернативы материалов
   */
  function clearMaterialAlternatives(): void {
    materialAlternatives.value = null;
    alternativesError.value = null;
  }

  /**
   * Очистить кэш альтернатив для конкретного материала
   */
  function clearAlternativesCache(materialId: string): void {
    alternativesCache.value.delete(materialId);
  }

  /**
   * Очистить весь кэш альтернатив
   */
  function clearAllAlternativesCache(): void {
    alternativesCache.value.clear();
  }

  /**
   * Обновить альтернативы материала
   */
  async function updateMaterialAlternatives(
    data: UpdateMaterialAlternativesRequest
  ): Promise<UpdateMaterialAlternativesResponse> {
    isUpdateAlternativesLoading.value = true;
    updateAlternativesError.value = null;

    try {
      const response = await materialApi.updateMaterialAlternatives(data);

      // Очищаем кэш для этого материала, чтобы при следующем запросе загрузить актуальные данные
      clearAlternativesCache(data._id);

      return response;
    } catch (e) {
      updateAlternativesError.value = 'Ошибка обновления альтернатив материала';
      throw e;
    } finally {
      isUpdateAlternativesLoading.value = false;
    }
  }

  /**
   * Поиск альтернатив материалов по названию
   * При пустой строке возвращает все материалы
   */
  async function searchMaterialAlternatives(name: string): Promise<SearchMaterialAlternativesResponse> {
    isSearchAlternativesLoading.value = true;
    searchAlternativesError.value = null;

    try {
      let response: SearchMaterialAlternativesResponse;

      if (name.trim() === '') {
        // При пустом поиске получаем все материалы
        const allMaterialsResponse = await materialApi.getAll({
          page: 1,
          rowsPerPage: 50,
          sortBy: 'name',
          descending: false
        });

        // Преобразуем результат в формат поиска альтернатив
        const alternatives = allMaterialsResponse.data.map((material) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { description, feature, alternative, ...alternativeFields } = material;
          return alternativeFields as MaterialAlternativeDto;
        });

        response = { alternatives };
      } else {
        // При непустом поиске используем обычный поиск
        response = await materialApi.searchMaterialAlternatives(name);
      }

      searchAlternativesResult.value = response;
      return response;
    } catch (e) {
      searchAlternativesError.value = 'Ошибка поиска альтернатив материалов';
      throw e;
    } finally {
      isSearchAlternativesLoading.value = false;
    }
  }

  /**
   * Очистить результаты поиска альтернатив
   */
  function clearSearchAlternatives(): void {
    searchAlternativesResult.value = null;
    searchAlternativesError.value = null;
  }

  /**
   * Получить данные потока по ID материала
   */
  async function fetchMaterialStream(materialId: string): Promise<GetStreamByMaterialResponse> {
    isStreamLoading.value = true;
    streamError.value = null;

    try {
      const response = await materialApi.getStreamByMaterialId(materialId);
      materialStream.value = response;
      return response;
    } catch (e) {
      streamError.value = 'Ошибка загрузки данных потока';
      throw e;
    } finally {
      isStreamLoading.value = false;
    }
  }

  /**
   * Очистить данные потока
   */
  function clearMaterialStream(): void {
    materialStream.value = null;
    streamError.value = null;
  }

  return {
    // State
    materials,
    selectedMaterial,
    pagination,
    isLoading,
    isMaterialDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    materialDetailsError,
    materialAlternatives,
    isAlternativesLoading,
    alternativesError,
    alternativesCache,
    isUpdateAlternativesLoading,
    updateAlternativesError,
    searchAlternativesResult,
    isSearchAlternativesLoading,
    searchAlternativesError,
    materialStream,
    isStreamLoading,
    streamError,
    // Getters
    hasMaterials,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchMaterialById,
    deleteMaterial,
    updateMaterial,
    updateMaterialFeature,
    setPagination,
    clearMaterials,
    clearSelectedMaterial,
    fetchMaterialAlternatives,
    clearMaterialAlternatives,
    clearAlternativesCache,
    clearAllAlternativesCache,
    updateMaterialAlternatives,
    searchMaterialAlternatives,
    clearSearchAlternatives,
    fetchMaterialStream,
    clearMaterialStream,
  };
});

