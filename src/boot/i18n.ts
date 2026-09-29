import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';
import {
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from 'src/shared/config/locale';

export type MessageLanguages = keyof typeof messages;
// Type-define 'ru-RU' as the master schema for the resource
export type MessageSchema = (typeof messages)['ru-RU'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

/**
 * Получить сохранённый язык из localStorage
 * pinia-plugin-persistedstate сохраняет в формате JSON: {"locale":"en-US"}
 */
function getSavedLocale(): SupportedLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (!saved) {
    return DEFAULT_LOCALE;
  }

  try {
    const parsed = JSON.parse(saved);
    const locale = parsed?.locale;
    if (locale === 'en-US' || locale === 'ru-RU') {
      return locale;
    }
  } catch {
    // Если это старый формат (просто строка), пробуем использовать напрямую
    if (saved === 'en-US' || saved === 'ru-RU') {
      return saved;
    }
  }

  return DEFAULT_LOCALE;
}

export const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
  locale: getSavedLocale(),
  legacy: false,
  messages,
});

export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});
