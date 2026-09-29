/**
 * Типы для сущности Holiday (Праздник)
 */

export type HolidayType = 'holiday' | 'short_day';

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  holiday: 'Праздничный день',
  short_day: 'Сокращенный день',
};

export const HOLIDAY_TYPE_OPTIONS: { label: string; value: HolidayType }[] = [
  { label: 'Праздничный день', value: 'holiday' },
  { label: 'Сокращенный день', value: 'short_day' },
];

export interface Holiday {
  _id?: string;
  /** Наименование */
  name: string;
  /** Дата (ISO-строка или YYYY-MM-DD) */
  date: string;
  /** Кол-во дней (null для сокращённых дней) */
  days: number | null;
  /** Тип */
  type: HolidayType;
  /** Описание */
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HolidayListResponse {
  data: Holiday[];
  meta?: {
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
    pagesNumber: number;
  };
}

export interface CreateHolidayDto {
  name: string;
  date: string;
  days: number | null;
  type: HolidayType;
  description: string;
}

export type UpdateHolidayDto = CreateHolidayDto & { _id: string };
