/**
 * Типы для сущности Schedule (Расписание)
 */

/** Тип расписания */
export type ScheduleType = 'template' | 'instance';

/** Тип сущности расписания */
export type ScheduleEntityType = 'equipment' | 'worker';

/** Базовые поля расписания */
export interface ScheduleBase {
  /** ID расписания */
  _id?: string;

  /** Название расписания */
  name?: string;

  /** Тип расписания (template или instance) */
  type?: ScheduleType;

  /** Дата начала */
  dateStart?: Date | string;

  /** Дата окончания */
  dateEnd?: Date | string;

  /** Тип сущности (equipment или worker) */
  entityType?: ScheduleEntityType;

  /** Дата создания */
  createdAt?: Date | string;

  /** Дата обновления */
  updatedAt?: Date | string;

  /** Паттерн расписания: single (разовое), daily (ежедневное), weekly (по дням недели) */
  schedulePattern?: 'single' | 'daily' | 'weekly';

  /** Настройки цикличности расписания (для шаблонов) */  
  equipment_cycle_setting?: {
    cycle: string;
    every: number;
    limit_date: string | null;
    week_days: number[];
    week_day_number: number | null;
  } | null;
  // --- Поля для template (шаблоны расписания) ---

  /** Смещение часового пояса в минутах от UTC (180 = МСК). По умолчанию МСК. */
  timezoneOffset?: number;

  /** Дни шаблона с индивидуальным временем и перерывами */
  scheduleEntries?: ScheduleDayEntry[];

  /** Настройки цикла (для сменных графиков, schedulePattern === 'daily') */
  cycleSettings?: ScheduleCycleSettings;

  /** Строки таблицы расписания (UI-only, не сохраняется на бэкенд) */
  scheduleRows?: ScheduleRow[];

  /** Учитывать ли праздничные дни в расписании */
  takeHolidaysInSchedule?: boolean;

  /** Комментарий к расписанию */
  comment?: string;
}

/** Строка таблицы расписания (UI) */
export interface ScheduleRow {
    label: string;
    value: number | string;
    start_time: string;
    end_time: string;
    breaks: Array<{ break_start: string; break_end: string }>;
}

/** Перерыв внутри дня шаблона (простые строки "HH:MM") */
export interface ScheduleDayBreak {
  start?: string;
  end?: string;
}

/** Алиас для ScheduleDayBreak (совместимость) */
export type ScheduleBreak = ScheduleDayBreak;

/** Время с учётом UTC (строка "HH:MM" или ISO) */
export type ScheduleTimeWithUtc = string;

/**
 * Один день шаблона расписания.
 * Для weekly: dayIndex 0–6 (Вс–Сб).
 * Для daily (цикл): dayIndex 0..cycleLength-1.
 */
export interface ScheduleDayEntry {
  dayIndex: number;
  label?: string;
  timeStart?: string;
  timeEnd?: string;
  breaks?: ScheduleDayBreak[];
}

/** Настройки цикла для сменного графика */
export interface ScheduleCycleSettings {
  cycleLength: number;
  cycleStartDate: string | Date;
}

/** Расписание для оборудования */
export interface EquipmentSchedule extends ScheduleBase {
  entityType: 'equipment';
  /** Тип обслуживания */
  maintenanceType?: string;

  /** Причина простоя */
  downtimeReason?: string;

  /** ID оборудования (обязателен для instance, не нужен для template) */
  equipmentId?: string;
}

/** Расписание для сотрудника */
export interface WorkerSchedule extends ScheduleBase {
  entityType: 'worker';
  /** Тип отпуска */
  vacationType?: string;

  /** ID сотрудника (обязателен для instance, не нужен для template) */
  workerId?: string;

  /** Статус одобрения */
  approvalStatus?: string;
}

/** Объединенный тип расписания */
export type ScheduleListItem = EquipmentSchedule | WorkerSchedule;

/** Мета-информация пагинации (совместима с Quasar) */
export interface SchedulesPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка расписаний с пагинацией */
export interface SchedulesListResponse {
  data: ScheduleListItem[];
  meta: SchedulesPaginationMeta;
}

/** Ответ API /schedule/{id} */
export type ScheduleInfoResponse = ScheduleListItem;

/** Параметры запроса списка расписаний */
export interface SchedulesListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  /** Фильтр по типу сущности */
  entityType?: ScheduleEntityType;
  /** Фильтр по ID оборудования */
  equipmentId?: string;
  /** Фильтр по ID сотрудника */
  workerId?: string;
  /** Фильтр по типу расписания */
  type?: ScheduleType;
  /** Фильтр по дате начала (от) */
  dateStartFrom?: Date | string;
  /** Фильтр по дате начала (до) */
  dateStartTo?: Date | string;
  /** Фильтр по дате окончания (от) */
  dateEndFrom?: Date | string;
  /** Фильтр по дате окончания (до) */
  dateEndTo?: Date | string;
  equipment_cycle_setting?: {
    cycle: string;
    every: number;
    limit_date: string | null;
    week_days: number[];
    week_day_number: number | null;
  } | null;
}

/** Данные для создания расписания оборудования */
export interface CreateEquipmentScheduleRequest extends ScheduleBase {
  entityType: 'equipment';
  /** Тип обслуживания */
  maintenanceType?: string;

  /** Причина простоя */
  downtimeReason?: string;

  /** ID оборудования (обязателен для instance, не нужен для template) */
  equipmentId?: string;
}

/** Данные для создания расписания сотрудника */
export interface CreateWorkerScheduleRequest extends ScheduleBase {
  entityType: 'worker';
  /** Тип отпуска */
  vacationType?: string;

  /** ID сотрудника (обязателен для instance, не нужен для template) */
  workerId?: string;

  /** Статус одобрения */
  approvalStatus?: string;
}

/** Объединенный тип запроса на создание */
export type CreateScheduleRequest =
  | CreateEquipmentScheduleRequest
  | CreateWorkerScheduleRequest;

/** Ответ при создании расписания */
export type CreateScheduleResponse = ScheduleListItem;

/** Данные для обновления расписания оборудования */
export interface UpdateEquipmentScheduleRequest extends ScheduleBase {
  _id: string;
  entityType?: 'equipment';
  /** Тип обслуживания */
  maintenanceType?: string;

  /** Причина простоя */
  downtimeReason?: string;

  /** ID оборудования */
  equipmentId?: string;
}

/** Данные для обновления расписания сотрудника */
export interface UpdateWorkerScheduleRequest extends ScheduleBase {
  _id: string;
  entityType?: 'worker';
  /** Тип отпуска */
  vacationType?: string;

  /** ID сотрудника */
  workerId?: string;

  /** Статус одобрения */
  approvalStatus?: string;
}

/** Объединенный тип запроса на обновление */
export type UpdateScheduleRequest =
  | UpdateEquipmentScheduleRequest
  | UpdateWorkerScheduleRequest;

/** Ответ при обновлении расписания */
export type UpdateScheduleResponse = ScheduleListItem;
