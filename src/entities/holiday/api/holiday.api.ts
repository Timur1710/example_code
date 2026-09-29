/**
 * API для работы с праздничными днями
 */

import { apiClient } from 'src/shared/api';
import type {
  Holiday,
  HolidayListResponse,
  CreateHolidayDto,
  UpdateHolidayDto,
} from '../model/holiday.types';

export const holidayApi = {
  /**
   * Получить все праздники
   */
  async getAll(): Promise<HolidayListResponse> {
    const response = await apiClient.get<HolidayListResponse>('/holidays');
    return response.data;
  },

  /**
   * Создать праздник
   */
  async create(data: CreateHolidayDto): Promise<Holiday> {
    const response = await apiClient.post<Holiday>('/holiday', data);
    return response.data;
  },

  /**
   * Обновить праздник
   */
  async update(data: UpdateHolidayDto): Promise<Holiday> {
    const response = await apiClient.put<Holiday>('/holiday', data);
    return response.data;
  },

  /**
   * Удалить праздник
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/holiday/${id}`);
  },
};
