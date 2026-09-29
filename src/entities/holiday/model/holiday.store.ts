/**
 * Pinia store для праздничных дней
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { holidayApi } from '../api/holiday.api';
import type { Holiday, CreateHolidayDto, UpdateHolidayDto } from './holiday.types';

export const useHolidayStore = defineStore('holiday', () => {
  const holidays = ref<Holiday[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await holidayApi.getAll();
      holidays.value = response.data;
    } catch (e) {
      error.value = 'Ошибка загрузки праздников';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function create(data: CreateHolidayDto): Promise<void> {
    await holidayApi.create(data);
    await fetchAll();
  }

  async function update(data: UpdateHolidayDto): Promise<void> {
    await holidayApi.update(data);
    await fetchAll();
  }

  async function remove(id: string): Promise<void> {
    await holidayApi.delete(id);
    holidays.value = holidays.value.filter((h) => h._id !== id);
  }

  return {
    holidays,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
});
