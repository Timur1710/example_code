/**
 * Pinia store для расписаний
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { scheduleApi } from '../api/schedule.api';
import type {
  ScheduleListItem,
  EquipmentSchedule,
  WorkerSchedule,
  SchedulesListParams,
  SchedulesListResponse,
  SchedulesPaginationMeta,
  UpdateScheduleRequest,
  UpdateScheduleResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
} from './schedule.types';

export const useScheduleStore = defineStore('schedule', () => {
  // === State ===
  const schedules = ref<ScheduleListItem[]>([]);
  const filteredSchedules = ref<ScheduleListItem[]>([]);
  const selectedSchedule = ref<ScheduleListItem | null>(null);
  const searchQuery = ref('');
  const pagination = ref<SchedulesPaginationMeta>({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
    pagesNumber: 0,
    sortBy: 'createdAt',
    descending: true,
  });
  const isLoading = ref(false);
  const isScheduleDetailsLoading = ref(false);
  const isDeleting = ref(false);
  const isUpdating = ref(false);
  const error = ref<string | null>(null);
  const scheduleDetailsError = ref<string | null>(null);

  const templates = ref<ScheduleListItem[]>([]);
  const isTemplatesLoading = ref(false);

  // === Getters ===
  const hasSchedules = computed(() => schedules.value.length > 0);

  // === Actions ===

  /**
   * Загрузить все расписания
   */
  async function fetchAll(params: SchedulesListParams = {}): Promise<SchedulesListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await scheduleApi.getAll(params);
      schedules.value = response.data;
      // Применяем текущий поисковый запрос к новым данным
      searchSchedules(searchQuery.value);
      if (response.meta) {
        pagination.value = {
          ...pagination.value,
          ...response.meta,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки расписаний';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Получить расписание по ID
   */
  async function fetchScheduleById(id: string): Promise<ScheduleListItem | null> {
    isScheduleDetailsLoading.value = true;
    scheduleDetailsError.value = null;

    try {
      const schedule = await scheduleApi.getById(id);
      selectedSchedule.value = schedule;
      if (!schedule) {
        scheduleDetailsError.value = 'Расписание не найдено';
      }
      return schedule;
    } catch (e) {
      scheduleDetailsError.value = 'Ошибка загрузки расписания';
      throw e;
    } finally {
      isScheduleDetailsLoading.value = false;
    }
  }

  /**
   * Загрузить расписания по ID оборудования
   */
  async function fetchByEquipmentId(equipmentId: string): Promise<SchedulesListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await scheduleApi.getByEquipmentId(equipmentId);
      schedules.value = response.data;
      // Применяем текущий поисковый запрос к новым данным
      searchSchedules(searchQuery.value);
      if (response.meta) {
        pagination.value = {
          ...pagination.value,
          ...response.meta,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки расписаний оборудования';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить расписания по ID сотрудника
   */
  async function fetchByWorkerId(workerId: string): Promise<SchedulesListResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await scheduleApi.getByWorkerId(workerId);
      schedules.value = response.data;
      // Применяем текущий поисковый запрос к новым данным
      searchSchedules(searchQuery.value);
      if (response.meta) {
        pagination.value = {
          ...pagination.value,
          ...response.meta,
        };
      }
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки расписаний сотрудника';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Удалить расписание
   */
  async function deleteSchedule(id: string): Promise<void> {
    isDeleting.value = true;
    error.value = null;

    try {
      await scheduleApi.delete(id);

      schedules.value = schedules.value.filter((schedule) => schedule._id !== id);
      filteredSchedules.value = filteredSchedules.value.filter((schedule) => schedule._id !== id);

      if (selectedSchedule.value?._id === id) {
        selectedSchedule.value = null;
      }

      if (pagination.value.rowsNumber > 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: Math.max(0, pagination.value.rowsNumber - 1),
        };
      }
    } catch (e) {
      error.value = 'Ошибка удаления расписания';
      throw e;
    } finally {
      isDeleting.value = false;
    }
  }

  /**
   * Создать новое расписание
   */
  async function createSchedule(payload: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const created = await scheduleApi.create(payload);

      schedules.value = [created, ...schedules.value];
      searchSchedules(searchQuery.value);

      if (pagination.value.rowsNumber >= 0) {
        pagination.value = {
          ...pagination.value,
          rowsNumber: pagination.value.rowsNumber + 1,
        };
      }

      return created;
    } catch (e) {
      error.value = 'Ошибка создания расписания';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Обновить расписание
   */
  async function updateSchedule(payload: UpdateScheduleRequest): Promise<UpdateScheduleResponse> {
    isUpdating.value = true;
    error.value = null;

    try {
      const updated = await scheduleApi.update(payload);

      schedules.value = schedules.value.map((schedule) =>
        schedule._id === updated._id ? { ...schedule, ...updated } : schedule
      );

      filteredSchedules.value = filteredSchedules.value.map((schedule) =>
        schedule._id === updated._id ? { ...schedule, ...updated } : schedule
      );

      if (selectedSchedule.value?._id === updated._id) {
        selectedSchedule.value = { ...selectedSchedule.value, ...updated };
      }

      return updated;
    } catch (e) {
      error.value = 'Ошибка обновления расписания';
      throw e;
    } finally {
      isUpdating.value = false;
    }
  }

  /**
   * Поиск расписаний по текстовому запросу
   */
  function searchSchedules(query: string): void {
    searchQuery.value = query;

    if (!query.trim()) {
      filteredSchedules.value = [...schedules.value];
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredSchedules.value = schedules.value.filter((schedule) => {
      // Поиск по основным полям
      const searchableFields = [
        schedule.name,
        schedule.type,
        schedule.entityType,
        schedule.dateStart ? new Date(schedule.dateStart).toLocaleDateString('ru-RU') : '',
        schedule.dateEnd ? new Date(schedule.dateEnd).toLocaleDateString('ru-RU') : '',
        schedule.entityType === 'equipment' ? (schedule as EquipmentSchedule).maintenanceType : '',
        schedule.entityType === 'equipment' ? (schedule as EquipmentSchedule).downtimeReason : '',
        schedule.entityType === 'worker' ? (schedule as WorkerSchedule).vacationType : '',
        schedule.entityType === 'worker' ? (schedule as WorkerSchedule).approvalStatus : '',
        schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString('ru-RU') : '',
        schedule.updatedAt ? new Date(schedule.updatedAt).toLocaleDateString('ru-RU') : '',
      ].filter(Boolean);

      return searchableFields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Установить параметры пагинации
   */
  function setPagination(meta: Partial<SchedulesPaginationMeta>): void {
    pagination.value = {
      ...pagination.value,
      ...meta,
    };
  }

  /**
   * Загрузить шаблоны расписаний
   */
  async function fetchTemplates(entityType?: string): Promise<SchedulesListResponse> {
    isTemplatesLoading.value = true;
    error.value = null;

    try {
      const response = await scheduleApi.getTemplates(entityType);
      templates.value = response.data;
      return response;
    } catch (e) {
      error.value = 'Ошибка загрузки шаблонов расписаний';
      throw e;
    } finally {
      isTemplatesLoading.value = false;
    }
  }

  /**
   * Удалить шаблон из локального списка
   */
  function removeTemplateLocally(id: string): void {
    templates.value = templates.value.filter((t) => t._id !== id);
  }

  /**
   * Очистить список расписаний
   */
  function clearSchedules(): void {
    schedules.value = [];
    filteredSchedules.value = [];
    searchQuery.value = '';
    error.value = null;
  }

  /**
   * Очистить выбранное расписание
   */
  function clearSelectedSchedule(): void {
    selectedSchedule.value = null;
    scheduleDetailsError.value = null;
  }

  return {
    // State
    schedules,
    filteredSchedules,
    selectedSchedule,
    searchQuery,
    pagination,
    isLoading,
    isScheduleDetailsLoading,
    isDeleting,
    isUpdating,
    error,
    scheduleDetailsError,
    // Getters
    hasSchedules,
    // Actions
    fetchAll,
    fetchScheduleById,
    fetchByEquipmentId,
    fetchByWorkerId,
    createSchedule,
    deleteSchedule,
    updateSchedule,
    searchSchedules,
    setPagination,
    clearSchedules,
    clearSelectedSchedule,
    templates,
    isTemplatesLoading,
    fetchTemplates,
    removeTemplateLocally,
  };
});
