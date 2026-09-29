/**
 * Типы для аутентификации
 */

import type { Permissions } from './permissions';

export interface User {
  _id: string;
  u_id: string;
  name: string;
  token: string;
  refresh_token: string;
  token_type: string;
  token_expires_at: string;
  access: string;
  role_permissions: Permissions;
}

export interface LoginCredentials {
  name: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  role: string;
}


