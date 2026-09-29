import { defineStore, acceptHMRUpdate } from 'pinia';
import {
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from 'src/shared/config/locale';
import { UserRole } from 'src/shared/config/roles';

/** Ключ для хранения роли в localStorage */
export const ROLE_STORAGE_KEY = 'app-current-role';

interface SystemState {
  locale: SupportedLocale;
  currentRole: string | null;
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    locale: DEFAULT_LOCALE,
    currentRole: null,
  }),

  getters: {
    currentLocale: (state) => state.locale,
    isRussian: (state) => state.locale === 'ru-RU',
    isEnglish: (state) => state.locale === 'en-US',
    /** Текущая роль пользователя */
    role: (state) => state.currentRole,
    /** Является ли пользователь администратором */
    isAdmin: (state) => state.currentRole === UserRole.ADMINISTRATOR,
  },

  actions: {
    /**
     * Установить язык приложения
     */
    setLocale(locale: SupportedLocale) {
      this.locale = locale;
    },

    /**
     * Установить текущую роль пользователя
     */
    setRole(role: string | null) {
      this.currentRole = role;
    },

    /**
     * Очистить текущую роль
     */
    clearRole() {
      this.currentRole = null;
    },
  },

  persist: {
    key: LOCALE_STORAGE_KEY,
    pick: ['locale', 'currentRole'],
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSystemStore, import.meta.hot));
}

