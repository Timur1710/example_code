/**
 * Типы для сущности User
 */

/**
 * Информация о Worker связанном с пользователем
 */
export interface UserWorkerInfo {
  /** ID работника */
  _id: string;

  /** Имя работника */
  name: string;

  /** ID группы */
  g_id?: string;

  /** Статус на работе */
  at_work?: boolean;

  /** Позиция */
  position?: string;
}

/**
 * Информация о роли пользователя (краткая)
 */
export interface UserRoleInfo {
  /** ID роли */
  _id: string;

  /** Название роли */
  name: string;
}

/**
 * Пользователь с информацией о Worker
 */
export interface UserWithWorker {
  /** ID пользователя */
  _id: string;

  /** Имя пользователя (логин) */
  name: string;

  /** Тип доступа */
  access: string;

  /** ID связанного Worker */
  u_id?: string;

  /** ID роли */
  roleId?: string;

  /** Информация о роли (заполняется из ролей) */
  role?: UserRoleInfo | null;

  /** Дата создания */
  createdAt?: string;

  /** Дата обновления */
  updatedAt?: string;

  /** Информация о связанном Worker */
  worker?: UserWorkerInfo | null;
}

/**
 * Мета-информация о пагинации (совместимо с Quasar)
 */
export interface UsersPaginationMeta {
  /** Текущая страница */
  page: number;

  /** Количество записей на странице */
  rowsPerPage: number;

  /** Общее количество записей (Quasar rowsNumber) */
  rowsNumber: number;

  /** Общее количество страниц */
  pagesNumber: number;

  /** Поле сортировки */
  sortBy?: string;

  /** Направление сортировки */
  descending?: boolean;
}

/**
 * Ответ со списком пользователей с пагинацией
 */
export interface UsersListResponse {
  /** Массив данных */
  data: UserWithWorker[];

  /** Мета-информация о пагинации */
  pagination: UsersPaginationMeta;
}

/**
 * Параметры запроса списка пользователей
 */
export interface UsersListParams {
  /** Номер страницы (начинается с 1) */
  page?: number;

  /** Количество записей на странице */
  rowsPerPage?: number;

  /** Поле для сортировки */
  sortBy?: string;

  /** Направление сортировки (true = по убыванию) */
  descending?: boolean;

  /** Поиск по имени пользователя */
  search?: string | undefined;
}

/**
 * Данные для создания пользователя
 */
export interface CreateUserDto {
  /** Имя пользователя (логин) */
  name: string;

  /** Пароль */
  password: string;

  /** Тип доступа / роль */
  access?: string | undefined;

  /** ID роли */
  roleId?: string | undefined;

  /** ID связанного Worker */
  u_id?: string | undefined;
}

/**
 * Данные для обновления пользователя
 */
export interface UpdateUserDto {
  /** Имя пользователя (логин) */
  name?: string;

  /** Тип доступа / роль */
  access?: string | undefined;

  /** ID роли */
  roleId?: string | undefined;

  /** ID связанного Worker */
  u_id?: string | undefined;
}

/**
 * Данные для сброса пароля администратором
 */
export interface ResetPasswordDto {
  /** ID пользователя */
  userId: string;

  /** Новый пароль */
  newPassword: string;
}

/**
 * Ответ на сброс пароля
 */
export interface ResetPasswordResponse {
  /** Сообщение */
  message: string;

  /** ID пользователя */
  userId: string;
}

