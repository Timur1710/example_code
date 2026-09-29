import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { SCHEDULE,THE_24_HOURS } from "../constants/schedule";
import type { QTableColumn } from "quasar";
import { isValidTime } from "./useTimeInput";

export function useScheduleOptions() {
  const { t } = useI18n();

  const options = computed(() => 
    SCHEDULE.map(code => ({
      value: code,
      label: t(`graph_items.${code}`)
    }))
  );

  return options;
}

export function setDefaultStartDateTime(periodData: { startDate: string; startTime: string }) {
  periodData.startDate = '';
  periodData.startTime = THE_24_HOURS.start;
}

export function setDefaultEndDateTime(periodData: { endDate: string; endTime: string }) {
  periodData.endDate = '';
  periodData.endTime = THE_24_HOURS.end;
}
export function scheduleTableRows(type: 'weekly' | 'daily', lengthOfCycle: number = 0, cycleStartDate: string = '') {
  if (type === 'weekly') {
    return [
      { label: 'Пн', value: 1, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Вт', value: 2, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Ср', value: 3, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Чт', value: 4, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Пт', value: 5, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Сб', value: 6, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
      { label: 'Вс', value: 0, start_time: '09:00', end_time: '18:00', breaks:[{break_start: "12:00", break_end: "13:00"}] },
    ];
  }
  else if (type === 'daily') {
    const rows = [];
    for(let i = 0; i < lengthOfCycle; i++) {
      const date = new Date(cycleStartDate);
      date.setDate(date.getDate() + i);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      rows.push({
        label: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`,
        value: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)) + 1,
        start_time: '09:00',
        end_time: '18:00',
        breaks:[{
        break_start: "12:00",
        break_end: "13:00",
        }]
      });
    }
    return rows;
  }
  return [];
}

export const get_break_time = (breaks: Array<{ break_start: string; break_end: string }>) => {
  let total = 0;
  breaks.forEach(b => {
    const [startH = 0, startM = 0] = b.break_start.split(':').map(Number);
    const [endH = 0, endM = 0] = b.break_end.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    if (end > start) {
      total += (end - start);
    }
  });
  return (total / 60).toFixed(2);
};

/**
 * Проверяет, пересекаются ли перерывы по времени
 * @param breaks - массив перерывов с break_start и break_end
 * @returns объект с валидацией: { isValid: boolean, message?: string }
 */

export function validateBreaksOverlap(breaks: Array<{ break_start: string; break_end: string }>) {
  if (breaks.length < 2) {
    return { isValid: true };
  }

  // Функция для преобразования времени "HH:MM" в минуты
  const timeToMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
  };

  // Сортируем перерывы по времени начала
  const sortedBreaks = [...breaks].sort((a, b) => 
    timeToMinutes(a.break_start) - timeToMinutes(b.break_start)
  );

  // Проверяем каждый перерыв с следующим
  for (let i = 0; i < sortedBreaks.length - 1; i++) {
    const currentEnd = timeToMinutes(sortedBreaks[i]!.break_end);
    const nextStart = timeToMinutes(sortedBreaks[i + 1]!.break_start);

    if (currentEnd > nextStart) {
      return {
        isValid: false,
        message: `Перерыв с ${sortedBreaks[i + 1]!.break_start} пересекается с предыдущим перерывом (заканчивается в ${sortedBreaks[i]!.break_end})`
      };
    }
  }

  return { isValid: true };
}

export function compareTimes(start: string, end: string): boolean {
  if (!isValidTime(start) || !isValidTime(end)) return true; // Не валидируем, если формат неверный
  const [startH = 0, startM = 0] = start.split(':').map(Number);
  const [endH = 0, endM = 0] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return startMinutes < endMinutes;
}
// === Table columns ===
export const DAYS_OF_WEEK_COLUMNS = computed<QTableColumn[]>(() => [
    {
      name: 'week_day',
      label: 'День недели',
      field: 'week_day',
      align: 'center',
    },
    {
      name: 'start_time',
      label: 'Начало работы',
      field: 'start_time',
      align: 'center',
    },    
    {
      name: 'end_time',
      label: 'Конец работы',
      field: 'end_time',
      align: 'center',
    },    
    {
      name: 'break_time',
      label: 'Длительность перерывов',
      field: 'break_time',
      align: 'center',
    },    
    {
      name: 'breaks_setting',
      label: 'Настройка перерывов',
      field: 'breaks_setting',
      align: 'center',
    },
  ]);

