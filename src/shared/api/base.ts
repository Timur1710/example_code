/**
 * Базовый HTTP клиент
 */

import axios from 'axios';
import { BASE_URL_KEY, DEFAULT_BASE_URL, AUTH_TOKEN_KEY } from 'src/shared/config';

/**
 * Получить baseURL из localStorage
 */
export const getBaseUrl = (): string => {
  return localStorage.getItem(BASE_URL_KEY) || DEFAULT_BASE_URL;
};

/**
 * Установить baseURL
 */
export const setBaseUrl = (url: string): void => {
  localStorage.setItem(BASE_URL_KEY, url);
  apiClient.defaults.baseURL = url;
};

/**
 * Базовый axios instance
 * Interceptors добавляются в boot/axios.ts
 */
export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Получить текущий токен из localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

