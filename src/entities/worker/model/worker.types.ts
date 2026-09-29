/**
 * Типы для сущности Worker
 */

import type { FeatureField } from "src/shared/types";
import type { ScheduleTimeWithUtc, ScheduleBreak, ScheduleDayEntry, ScheduleCycleSettings } from "src/entities/schedule";

/** Тип пола работника */
export type WorkerGender = "male" | "female" | "other" | "";

/** Унифицированный формат контактов */
export interface WorkerContacts {
  phone?: string;
  email?: string;
  adress?: string;
  [key: string]: unknown;
}

/** Унифицированный фильтр */
export type WorkerFilter = unknown[] | Record<string, unknown>;

/** Базовая ссылка на операцию */
export interface WorkerOperationRef {
  /** ID операции */
  o_id: string;
}

/** Расширенная операция (для создания/отображения) */
export interface WorkerOperation extends WorkerOperationRef {
  /** Название операции */
  name: string;

  /** Статус операции */
  status?: string;
}

/** Операция при создании */
export type WorkerOperationCreate = WorkerOperationRef & {
  status?: boolean;
  qualification?: number;
  [key: string]: unknown;
};

/** Элемент поставок/значений */
export type WorkerSupplyItem = {
  date?: string;
  _id?: string;
  amount?: number | string;
  [key: string]: unknown;
};

/** Дополнительные данные работника */
export interface WorkerValue {
  supply?: WorkerSupplyItem[];
  [key: string]: unknown;
}

/** Объединённые типы для часто используемых полей */
export type WorkerAmount = string | number;
export type WorkerAvatar = string | null;
export type WorkerPosition = string | null;
export type WorkerDateInput = Date | string | null;

/** Тип для характеристик работника */
export type WorkerFeature = FeatureField[];

/** Worker для селектора (краткая информация) */
export interface WorkerSelector {
  /** ID работника */
  _id: string;

  /** Имя работника */
  name: string;
}

/** Ответ со списком workers для селектора */
export type WorkersSelectorResponse = WorkerSelector[];

/** Элемент списка работников по производственной единице */
export interface WorkerListItem {
  /** ID работника */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Имя работника */
  name: string;

  description?: string;

  /** Количество (ставка) */
  amount?: number;

  /** Дата рождения */
  dob?: string;

  /** Пол */
  gender?: string;

  /** Контактная информация */
  contacts?: WorkerContacts;

  /** Операции работника */
  operation: WorkerOperation[];

  /** Многозадачность */
  multitasking?: boolean;

  /** Логин */
  login?: string;

  /** Фильтр */
  filter?: WorkerFilter;

  /** Аватар */
  avatar?: string;

  /** Значение (дополнительные данные) */
  value?: Record<string, unknown>;

  /** Дата создания */
  created?: string;

  /** Дата обновления */
  updated?: string;

  /** Позиция */
  position?: string;

  /** Автор (создатель) */
  author?: string;

  /** Роль пользователя */
  userRole?: string;

  /** Дополнительные характеристики работника */
  feature?: WorkerFeature;

  /** Список ID альтернативных работников */
  alternative?: string[];

  /** ID шаблона расписания */
  scheduleTemplateId?: string;
}

/** Мета-информация пагинации (совместима с Quasar) */
export interface WorkersPaginationMeta {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  pagesNumber: number;
  sortBy?: string;
  descending?: boolean;
}

/** Ответ списка работников с пагинацией */
export interface WorkersListResponse {
  data: WorkerListItem[];
  pagination: WorkersPaginationMeta;
}

/** Параметры запроса списка работников */
export interface WorkersListParams {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string;
  descending?: boolean;
  search?: string;
  filter?: string;
  includeDescendants?: boolean;
}

/** Данные для создания работника */
export interface CreateWorkerRequest {
  /** ID производственной единицы */
  p_id: string;

  /** Имя работника */
  name: string;

  /** Дата рождения */
  dob?: WorkerDateInput;

  /** Пол */
  gender?: WorkerGender;

  /** Операции работника */
  operation?: WorkerOperationCreate[];

  /** Квалификация */
  qualification?: number;

  /** Многозадачность */
  multitasking?: boolean;

  /** Логин для входа в систему */
  login?: string;

  /** Пароль для входа в систему */
  password?: string;

  /** Дополнительные данные */
  value?: WorkerValue;

  /** Фильтр */
  filter?: WorkerFilter;

  /** Аватар */
  avatar?: WorkerAvatar;

  /** Позиция */
  position?: WorkerPosition;

  /** Автор (создатель) */
  author?: string;

  /** Количество/ставка */
  amount?: WorkerAmount;

  /** Тип доступа */
  access?: string;

  /** Контакты */
  contacts?: WorkerContacts;

  /** Дополнительные характеристики работника */
  feature?: WorkerFeature;

  [key: string]: unknown;
}

/** Ответ при создании работника */
export type CreateWorkerResponse = WorkerListItem;

/** Данные для обновления работника */
export interface UpdateWorkerRequest {
  /** ID работника */
  _id: string;

  /** ID производственной единицы */
  p_id?: string;

  /** Имя работника */
  name?: string;

  /** Дата рождения */
  dob?: WorkerDateInput;

  /** Пол */
  gender?: string | null;

  /** Операции работника */
  operation?: Array<WorkerOperationRef | WorkerOperationCreate> | Record<string, unknown>;

  /** Квалификация */
  qualification?: number | string;

  /** Многозадачность */
  multitasking?: boolean | string;

  /** Логин для входа в систему */
  login?: string;

  /** Пароль для входа в систему */
  password?: string;

  /** Дополнительные данные */
  value?: Record<string, unknown>;

  /** Фильтр */
  filter?: WorkerFilter;

  /** Аватар */
  avatar?: WorkerAvatar;

  /** Позиция */
  position?: WorkerPosition;

  /** Автор (создатель) */
  author?: string | null;

  /** Роль пользователя */
  userRole?: string | null;

  /** Тип доступа (administrator, worker, etc.) */
  access?: string;

  /** Количество (amount) - может приходить как строка или число */
  amount?: WorkerAmount;

  /** Контактная информация */
  contacts?: WorkerContacts;

  /** Управление пользователями */
  user_management?: boolean;

  /** Дата создания (legacy) */
  created?: WorkerDateInput;

  /** Дата обновления (legacy) */
  updated?: WorkerDateInput;

  /** Дополнительные характеристики работника */
  feature?: WorkerFeature;

  /** ID привязанного шаблона расписания */
  scheduleTemplateId?: string | null;

  /** Любые дополнительные поля для совместимости */
  [key: string]: unknown;
}

/** Операция работника с детальной информацией */
export interface WorkerOperationDetail {
  /** Уникальный идентификатор операции */
  _id?: string;

  /** ID операции */
  o_id: string;

  /** Название операции */
  name: string;

  /** Статус операции */
  status?: string;
}

/** Детальная информация о работнике */
export interface WorkerDetail {
  /** Уникальный идентификатор работника */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Имя работника */
  name: string;

  /** Количество (ставка) */
  amount?: number;

  /** Дата рождения */
  dob?: Date;

  /** Пол */
  gender?: string;

  /** Контактная информация */
  contacts?: WorkerContacts;

  /** Операции работника */
  operation: WorkerOperationDetail[];

  /** Многозадачность */
  multitasking?: boolean;

  /** Фильтр */
  filter?: WorkerFilter;

  /** Аватар */
  avatar?: string;

  /** Значение (дополнительные данные) */
  value?: Record<string, unknown>;

  /** Дата создания */
  created?: Date;

  /** Дата обновления */
  updated?: Date;

  /** Позиция */
  position?: string;

  /** Автор (создатель) */
  author?: string;

  /** Роль пользователя */
  userRole?: string;

  /** Тип доступа */
  access?: string;

  /** Дополнительные характеристики работника */
  feature?: WorkerFeature;

  /** Список ID альтернативных работников */
  alternative?: string[];

  /** ID привязанного шаблона расписания */
  scheduleTemplateId?: string;

  /** Данные выбранного шаблона расписания (из API) */
  scheduleTemplateData?: ScheduleTemplateData;
}

/** Данные шаблона расписания (для scheduleTemplateData) */
export interface ScheduleTemplateData {
  _id?: string;
  name?: string;
  type?: string;
  schedulePattern?: 'single' | 'daily' | 'weekly';
  timeStart?: ScheduleTimeWithUtc;
  timeEnd?: ScheduleTimeWithUtc;
  daysOfWeek?: number[];
  equipment_cycle_setting?: {
    cycle: string;
    every: number;
    limit_date: string | null;
    week_days: number[];
    week_day_number: number | null;
  } | null;
  breaks?: ScheduleBreak[];
  dateStart?: Date | string;
  dateEnd?: Date | string;
  timezoneOffset?: number;
  scheduleEntries?: ScheduleDayEntry[];
  cycleSettings?: ScheduleCycleSettings;
}

/** Ответ при получении детальной информации о работнике */
export type WorkerDetailResponse = WorkerDetail[];

/** Ответ при обновлении работника */
export interface UpdateWorkerResponse {
  /** ID работника */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Имя работника */
  name: string;

  /** Операции работника */
  operation?: Array<{
    o_id: string;
  }>;

  /** Дата рождения */
  dob?: Date;

  /** Пол */
  gender?: string;

  description? :string;

  /** Квалификация */
  qualification?: number;

  /** На работе */
  at_work?: boolean;

  /** Многозадачность */
  multitasking?: boolean;

  /** История работы */
  history?: Array<{
    start: Date;
    finish: Date;
  }>;

  /** Дата создания */
  createdAt?: Date;

  /** Дата обновления */
  updatedAt?: Date;

  /** Любые дополнительные поля для совместимости */
  [key: string]: unknown;
}

/** DTO для информации об альтернативном работнике */
export interface WorkerAlternativeDto {
  /** ID работника */
  _id: string;

  /** ID производственной единицы */
  p_id: string;

  /** Имя работника */
  name: string;

  /** Дата рождения */
  dob?: Date | string;

  /** Пол */
  gender?: string;  /** Квалификация */
  qualification?: number;

  /** На работе */
  at_work?: boolean;

  /** Многозадачность */
  multitasking?: boolean;

  /** Операции работника */
  operation?: Array<{
    o_id: string;
    name?: string;
  }>;

  /** Дата создания */
  createdAt?: Date | string;

  /** Дата обновления */
  updatedAt?: Date | string;
}

/** Ответ на получение альтернатив работника */
export interface GetWorkerAlternativesResponse {
  /** Основной работник */
  worker: WorkerAlternativeDto;

  /** Список альтернативных работников */
  alternatives: WorkerAlternativeDto[];
}

/** Данные для обновления альтернатив работника */
export interface UpdateWorkerAlternativesRequest {
  /** ID работника, для которого задаются альтернативы */
  _id: string;

  /** Список ID работников, которые являются альтернативами */
  alternativeIds: string[];
}

/** Ответ при обновлении альтернатив работника */
export type UpdateWorkerAlternativesResponse = WorkerListItem;

/** Ответ на поиск альтернатив работника по имени */
export interface SearchWorkerAlternativesResponse {
  /** Список найденных альтернативных работников */
  alternatives: WorkerAlternativeDto[];
}
