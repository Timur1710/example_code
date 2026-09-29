/**
 * Константы для ролей пользователей
 * Синхронизированы с бэкендом
 */

export const UserRole = {
  ADMINISTRATOR: 'administrator',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

