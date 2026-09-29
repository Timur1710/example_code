/**
 * Конфигурация локализации
 */

export type SupportedLocale = 'ru-RU' | 'en-US';

export interface LocaleOption {
  value: SupportedLocale;
  label: string;
  flag: string;
}

/** Доступные языки приложения */
export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
];

/** Ключ для хранения языка в localStorage */
export const LOCALE_STORAGE_KEY = 'app-locale';

/** Язык по умолчанию */
export const DEFAULT_LOCALE: SupportedLocale = 'ru-RU';

