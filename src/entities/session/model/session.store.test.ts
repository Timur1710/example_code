import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from './session.store';
import type { User } from 'src/shared/types/auth';

// Фабрика для создания мок-пользователя
const createMockUser = (overrides: Partial<User> = {}): User => ({
  _id: 'user-123',
  u_id: 'u-123',
  name: 'Test User',
  token: 'test-token-abc',
  refresh_token: 'refresh-token-xyz',
  token_type: 'Bearer',
  token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  access: 'operator',
  role_permissions: {},
  ...overrides,
});

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Начальное состояние', () => {
    it('должен инициализироваться с пустым состоянием', () => {
      const store = useSessionStore();

      expect(store.user).toBeNull();
      expect(store.role).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('token должен быть null при отсутствии пользователя', () => {
      const store = useSessionStore();

      expect(store.token).toBeNull();
      expect(store.refreshToken).toBeNull();
    });

    it('permissions должен быть пустым объектом при отсутствии пользователя', () => {
      const store = useSessionStore();

      expect(store.permissions).toEqual({});
    });

    it('isAdmin должен быть false при отсутствии роли', () => {
      const store = useSessionStore();

      expect(store.isAdmin).toBe(false);
    });
  });

  describe('setSession', () => {
    it('должен корректно устанавливать данные сессии', () => {
      const store = useSessionStore();
      const mockUser = createMockUser();

      store.setSession(mockUser, 'operator');

      expect(store.user).toEqual(mockUser);
      expect(store.role).toBe('operator');
      expect(store.isAuthenticated).toBe(true);
    });

    it('должен корректно извлекать token из пользователя', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({ token: 'my-secret-token' });

      store.setSession(mockUser, 'operator');

      expect(store.token).toBe('my-secret-token');
    });

    it('должен корректно извлекать refreshToken из пользователя', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({ refresh_token: 'my-refresh-token' });

      store.setSession(mockUser, 'operator');

      expect(store.refreshToken).toBe('my-refresh-token');
    });

    it('должен корректно определять администратора', () => {
      const store = useSessionStore();
      const mockUser = createMockUser();

      store.setSession(mockUser, 'administrator');

      expect(store.isAdmin).toBe(true);
    });

    it('должен корректно определять обычного пользователя', () => {
      const store = useSessionStore();
      const mockUser = createMockUser();

      store.setSession(mockUser, 'operator');

      expect(store.isAdmin).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('должен очищать все данные сессии', () => {
      const store = useSessionStore();
      const mockUser = createMockUser();

      // Сначала устанавливаем сессию
      store.setSession(mockUser, 'administrator');
      expect(store.isAuthenticated).toBe(true);

      // Затем очищаем
      store.clearSession();

      expect(store.user).toBeNull();
      expect(store.role).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('администратор должен иметь все права', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({ role_permissions: {} });

      store.setSession(mockUser, 'administrator');

      expect(store.hasPermission('Заказы', 'view')).toBe(true);
      expect(store.hasPermission('Заказы', 'edit')).toBe(true);
      expect(store.hasPermission('Несуществующий раздел', 'edit')).toBe(true);
    });

    it('должен возвращать true для view если есть право view', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'view' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Заказы', 'view')).toBe(true);
    });

    it('должен возвращать false для edit если есть только право view', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'view' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Заказы', 'edit')).toBe(false);
    });

    it('должен возвращать true для view и edit если есть право edit', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'edit' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Заказы', 'view')).toBe(true);
      expect(store.hasPermission('Заказы', 'edit')).toBe(true);
    });

    it('должен возвращать false для denied права', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'denied' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Заказы', 'view')).toBe(false);
      expect(store.hasPermission('Заказы', 'edit')).toBe(false);
    });

    it('должен возвращать false для несуществующего раздела', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'edit' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Несуществующий', 'view')).toBe(false);
    });

    it('должен использовать view как уровень по умолчанию', () => {
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { Заказы: 'view' },
      });

      store.setSession(mockUser, 'operator');

      expect(store.hasPermission('Заказы')).toBe(true);
    });
  });
});

