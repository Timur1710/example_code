/**
 * Типы для шаблона формы расписания
 */

import type { ScheduleBase } from 'src/entities/schedule';

/** Базовые данные формы расписания */
export interface ScheduleCycleSetting {
  cycle: 'day' | 'week' | 'month';
  every: number;
  limit_date: string | null;
  week_days: number[];
  week_day_number: number | null;
}

/** Базовые данные формы расписания */
export interface ScheduleFormData {
  /** Название расписания */
  name: string;
  /** Комментарий к расписанию */
  comment: string;
  /** Дата начала (YYYY-MM-DD) */
  startDate: string;
  /** Время начала (HH:MM) */
  startTime: string;
  /** Дата окончания (YYYY-MM-DD) */
  endDate: string;
  /** Время окончания (HH:MM) */
  endTime: string;
  /** Флаг расчета времени расписания */
  //calculate_schedule_time?: boolean | null;
  /** Дополнительные поля (для расширения в конкретных формах) */
  [key: string]: unknown;
}

/** Пропсы шаблона формы расписания */
export interface ScheduleFormTemplateProps {
  /** Данные формы */
  modelValue: ScheduleFormData;
  /** Элемент расписания для редактирования */
  scheduleItem?: ScheduleBase | null;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли поле названия */
  showNameField?: boolean;
  /** Скрывать ли базовые поля (дата и время) */
  hideBaseFields?: boolean;
  /** Отключать ли поля времени начала/окончания */
  disableTimeFields?: boolean;
  /** Правила валидации для поля названия */
  nameRules?: Array<(val: string) => boolean | string>;
  /** Ключ перевода для заголовка секции периода */
  periodTitleKey?: string;
  /** Ключ перевода для ошибки валидации дат */
  dateValidationErrorKey?: string;
}

/** Эмиты шаблона формы расписания */
export interface ScheduleFormTemplateEmits {
  /** Обновление данных формы */
  (e: 'update:modelValue', value: ScheduleFormData): void;
  /** Событие сохранения формы */
  (e: 'saved'): void;
  /** Событие сброса формы */
  (e: 'reset'): void;
}

