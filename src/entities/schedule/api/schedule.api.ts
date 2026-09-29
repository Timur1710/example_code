/**
 * API для работы с расписаниями
 */

import { apiClient } from 'src/shared/api';
import type {
  CreateScheduleRequest,
  CreateScheduleResponse,
  UpdateScheduleRequest,
  UpdateScheduleResponse,
  SchedulesListParams,
  SchedulesListResponse,
  ScheduleInfoResponse,
} from '../model/schedule.types';

export const scheduleApi = {
  /**
   * Получить все расписания с пагинацией
   */
  async getAll(params: SchedulesListParams = {}): Promise<SchedulesListResponse> {
    const response = await apiClient.get<SchedulesListResponse>('/schedules/all', {
      params: {
        page: params.page,
        rowsPerPage: params.rowsPerPage,
        sortBy: params.sortBy,
        descending: params.descending,
        search: params.search,
        filter: params.filter,
        entityType: params.entityType,
        equipmentId: params.equipmentId,
        workerId: params.workerId,
        type: params.type,
        dateStartFrom: params.dateStartFrom,
        dateStartTo: params.dateStartTo,
        dateEndFrom: params.dateEndFrom,
        dateEndTo: params.dateEndTo,
        equipment_cycle_setting: params.equipment_cycle_setting, // Добавляем фильтр по настройкам расписания
      },
    });

    return response.data;
  },

  /**
   * Получить расписание по ID
   */
  async getById(id: string): Promise<ScheduleInfoResponse | null> {
    const response = await apiClient.get<ScheduleInfoResponse>(`/schedule/${id}`);
    return response.data || null;
  },

  /**
   * Получить расписания по ID оборудования
   */
  async getByEquipmentId(equipmentId: string): Promise<SchedulesListResponse> {
    const response = await apiClient.get<SchedulesListResponse>(
      `/schedules/equipment/${equipmentId}`
    );
    return response.data;
  },

  /**
   * Получить расписания по ID сотрудника
   */
  async getByWorkerId(workerId: string): Promise<SchedulesListResponse> {
    const response = await apiClient.get<SchedulesListResponse>(`/schedules/worker/${workerId}`);
    return response.data;
  },

  /**
   * Получить шаблоны расписаний
   */
  async getTemplates(entityType?: string): Promise<SchedulesListResponse> {
    const response = await apiClient.get<SchedulesListResponse>('/schedules/templates', {
      params: { entityType },
    });
    return response.data;
  },

  /**
   * Создать новое расписание
   */
  async create(data: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    const response = await apiClient.post<CreateScheduleResponse>('/schedule', data);
    return response.data;
  },

  /**
   * Обновить расписание
   */
  async update(data: UpdateScheduleRequest): Promise<UpdateScheduleResponse> {
    const response = await apiClient.put<UpdateScheduleResponse>('/schedule', data);
    return response.data;
  },

  /**
   * Удалить расписание
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/schedule/${id}`);
  },
};
