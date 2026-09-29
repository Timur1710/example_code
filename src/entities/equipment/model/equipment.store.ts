/**
 * Pinia store для оборудования
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { equipmentApi } from '../api/equipment.api';

import type {
  CreateEquipmentRequest,
  CreateEquipmentResponse,
  EquipmentAlternative,
  EquipmentListItem,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentPaginationMeta,
  GetEquipmentAlternativesResponse,
  SearchEquipmentAlternativesResponse,
  UpdateEquipmentAlternativesRequest,
  UpdateEquipmentAlternativesResponse,
  UpdateEquipmentRequest,
  UpdateEquipmentResponse,
} from './equipment.types';

export const useEquipmentStore = defineStore('equipment', () => {
  // === State ===
  const equipmentList = ref<EquipmentListItem[]>([]);
  const selectedEquipment = ref<EquipmentListItem | null>(null);
  const pagination = ref<EquipmentPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isEquipmentDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const isCreating = ref(false);
  const error = ref<string | null>(null);
  const equipmentDetailsError = ref<string | null>(null);

  // === Alternatives State ===
  const equipmentAlternatives = ref<EquipmentAlternative[] | null>(null);
  const alternativesCache = ref<Map<string, EquipmentAlternative[]>>(new Map());
  const isAlternativesLoading = ref(false);
  const alternativesError = ref<string | null>(null);

  // === Update Alternatives State ===
  const isUpdateAlternativesLoading = ref(false);
  const updateAlternativesError = ref<string | null>(null);

  // === Search Alternatives State ===
  const searchAlternativesResult = ref<SearchEquipmentAlternativesResponse | null>(null);
  const isSearchAlternativesLoading = ref(false);
  const searchAlternativesError = ref<string | null>(null);


  // === Getters ===
  const hasEquipment = computed(() => equipmentList.value.length > 0);

  // === Actions ===

  /**
   * Загрузить оборудование по производственной единице
   */
  async function fetchByProductionUnit(
    productionUnitId: string,
    params: EquipmentListParams = {}
  ): Promise<EquipmentListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await equipmentApi.getByProductionUnit(productionUnitId, params);
      equipmentList.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки оборудования';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить всё оборудование
   */
  async function fetchAll(params: EquipmentListParams = {}): Promise<EquipmentListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await equipmentApi.getAll(params);
      equipmentList.value = response.data;
      if (response.pagination) {
        pagination.value = {
          ...pagination.value,
          ...response.pagination,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки оборудования';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить оборудование по ID
   */
  async function fetchEquipmentById(id: string): Promise<EquipmentListItem | null> {
    isEquipmentDetailsLoading.value = true;
    equipmentDetailsError.value = null;

    try {
      const equipment = await equipmentApi.getById(id);
      selectedEquipment.value = equipment;
      if (!equipment) {
        equipmentDetailsError.value = 'Оборудование не найдено';
      }
      return equipment;
    } catch (e) {
      equipmentDetailsError.value = 'Ошибка загрузки оборудования';
      throw e;
    } finally {
      isEquipmentDetailsLoading.value = false;
    }
  }

  /**
   * Создать оборудование
   */
  async function createEquipment(
    payload: CreateEquipmentRequest
  ): Promise<CreateEquipmentResponse> {
    isCreating.value = true;
    error.value = null;

    try {
      const created = await equipmentApi.create(payload);

      equipmentList.value = [created, ...equipmentList.value];
      pagination.value = {
        ...pagination.value,
        rowsNumber: pagination.value.rowsNumber + 1,
      };

      return created;
    } catch (e) {
      error.value = 'Ошибка создания оборудования';
      throw e;
    } finally {
      isCreating.value = false;
    }
  }

  /**
   * Удалить оборудование
   */
  async function deleteEquipment(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await equipmentApi.delete(id);

      equipmentList.value = equipmentList.value.filter((equipment) => equipment._id !== id);

      if (selectedEquipment.value?._id === id) {
        selectedEquipment.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления оборудования';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Обновить оборудование
   */
  async function updateEquipment(
    payload: UpdateEquipmentRequest
  ): Promise<UpdateEquipmentResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await equipmentApi.update(payload);

      equipmentList.value = equipmentList.value.map((equipment) =>
        equipment._id === updated._id ? { ...equipment, ...updated } : equipment
      );

      if (selectedEquipment.value?._id === updated._id) {
        selectedEquipment.value = { ...selectedEquipment.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления оборудования';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Обновить только спецификацию оборудования
   */
  async function updateEquipmentFeature(
    equipmentId: string,
    specification: Record<string, unknown>
  ): Promise<UpdateEquipmentResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await equipmentApi.update({
        _id: equipmentId,
        specification,
      });

      equipmentList.value = equipmentList.value.map((equipment) =>
        equipment._id === updated._id ? { ...equipment, ...updated } : equipment
      );

      if (selectedEquipment.value?._id === updated._id) {
        selectedEquipment.value = { ...selectedEquipment.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления спецификации оборудования';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }


  /**
   * Получить альтернативы оборудования
   */
  async function fetchEquipmentAlternatives(id: string): Promise<GetEquipmentAlternativesResponse> {
    isAlternativesLoading.value = true;
    alternativesError.value = null;

    try {
      // Проверяем кэш
      if (alternativesCache.value.has(id)) {
        equipmentAlternatives.value = alternativesCache.value.get(id)!;
        return {
          _id: id,
          name: '', // Заглушка, не используется в текущей логике
          p_id: '', // Заглушка, не используется в текущей логике
          alternative: equipmentAlternatives.value
        };
      }

      // Загружаем с сервера и сохраняем в кэш
      const response: GetEquipmentAlternativesResponse = await equipmentApi.getEquipmentAlternatives(id);
      const alternatives = response.alternative || [];
      alternativesCache.value.set(id, alternatives);
      equipmentAlternatives.value = alternatives;
      return response;
    } catch (e) {
      alternativesError.value = 'Ошибка загрузки альтернатив оборудования';
      throw e;
    } finally {
      isAlternativesLoading.value = false;
    }
  }

  /**
   * Обновить альтернативы оборудования
   */
  async function updateEquipmentAlternatives(
    data: UpdateEquipmentAlternativesRequest
  ): Promise<UpdateEquipmentAlternativesResponse> {
    isUpdateAlternativesLoading.value = true;
    updateAlternativesError.value = null;

    try {
      const response = await equipmentApi.updateEquipmentAlternatives(data);
      return response;
    } catch (e) {
      updateAlternativesError.value = 'Ошибка обновления альтернатив оборудования';
      throw e;
    } finally {
      isUpdateAlternativesLoading.value = false;
    }
  }

  /**
   * Поиск альтернатив оборудования по названию
   * При пустой строке возвращает все оборудование
   */
  async function searchEquipmentAlternatives(name: string): Promise<SearchEquipmentAlternativesResponse> {
    isSearchAlternativesLoading.value = true;
    searchAlternativesError.value = null;

    try {
      let response: SearchEquipmentAlternativesResponse;

      if (name.trim() === '') {
        // При пустом поиске получаем всё оборудование
        const allEquipmentResponse = await equipmentApi.getAll({
          page: 1,
          rowsPerPage: 50,
          sortBy: 'name',
          descending: false
        });

        // Преобразуем результат в формат поиска альтернатив
        const alternatives = allEquipmentResponse.data.map((equipment) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { description, specification, alternative, ...alternativeFields } = equipment;
          return alternativeFields as EquipmentAlternative;
        });

        response = { alternatives };
      } else {
        // При непустом поиске используем обычный поиск
        response = await equipmentApi.searchEquipmentAlternatives(name);
      }

      searchAlternativesResult.value = response;
      return response;
    } catch (e) {
      searchAlternativesError.value = 'Ошибка поиска альтернатив оборудования';
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
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<EquipmentPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Очистить список оборудования
   */
  function clearEquipment(): void {
    equipmentList.value = [];
    error.value = null;
  }

  /**
   * Очистить выбранное оборудование
   */
  function clearSelectedEquipment(): void {
    selectedEquipment.value = null;
    equipmentDetailsError.value = null;
  }

  /**
   * Очистить кэш альтернатив для конкретного оборудования
   */
  function clearEquipmentAlternativesCache(equipmentId: string): void {
    alternativesCache.value.delete(equipmentId);
  }

  /**
   * Очистить весь кэш альтернатив
   */
  function clearAllAlternativesCache(): void {
    alternativesCache.value.clear();
  }

  return {
    // State
    equipmentList,
    selectedEquipment,
    pagination,
    isLoading,
    isEquipmentDetailsLoading,
    isDeleting,
    isUpdating,
    isCreating,
    error,
    equipmentDetailsError,
    // Alternatives State
    equipmentAlternatives,
    alternativesCache,
    isAlternativesLoading,
    alternativesError,
    isUpdateAlternativesLoading,
    updateAlternativesError,
    searchAlternativesResult,
    isSearchAlternativesLoading,
    searchAlternativesError,
    // Getters
    hasEquipment,
    // Actions
    fetchByProductionUnit,
    fetchAll,
    fetchEquipmentById,
    createEquipment,
    deleteEquipment,
    updateEquipment,
    updateEquipmentFeature,
    fetchEquipmentAlternatives,
    updateEquipmentAlternatives,
    searchEquipmentAlternatives,
    clearSearchAlternatives,
    setPagination,
    clearEquipment,
    clearSelectedEquipment,
    clearEquipmentAlternativesCache,
    clearAllAlternativesCache,
  };
});
