import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { User, LoginCredentials } from 'src/shared/types/auth';
import { SYSTEM_RESOURCES } from 'src/shared/config/permissions';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock authService — используем inline функции чтобы избежать проблем с hoisting
vi.mock('../model/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Импортируем после моков
import { useAuth } from './useAuth';
import { useSessionStore } from 'src/entities/session';
import { authService } from '../model/auth.service';

// Фабрика для создания мок-пользователя
const createMockUser = (overrides: Partial<User> = {}): User => ({
  _id: 'user-123',
  u_id: 'u-123',
  name: 'Test User',
  token: 'test-token',
  refresh_token: 'refresh-token',
  token_type: 'Bearer',
  token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  access: 'operator',
  role_permissions: { [SYSTEM_RESOURCES.ORDERS]: 'edit' },
  ...overrides,
});

// Типизированные моки — используем геттеры для избежания проблем с this
/* eslint-disable @typescript-eslint/unbound-method */
const getMockedLogin = () => vi.mocked(authService.login);
const getMockedLogout = () => vi.mocked(authService.logout);
const getMockedInitialize = () => vi.mocked(authService.initialize);
const getMockedRefreshToken = () => vi.mocked(authService.refreshToken);
/* eslint-enable @typescript-eslint/unbound-method */

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('реактивное состояние', () => {
    it('должен возвращать реактивные refs из store', () => {
      const { user, role, isAuthenticated, isAdmin, permissions, token } = useAuth();

      expect(user.value).toBeNull();
      expect(role.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
      expect(isAdmin.value).toBe(false);
      expect(permissions.value).toEqual({});
      expect(token.value).toBeNull();
    });

    it('должен обновляться при изменении store', () => {
      const { user, isAuthenticated, isAdmin } = useAuth();
      const store = useSessionStore();
      const mockUser = createMockUser();

      store.setSession(mockUser, 'administrator');

      expect(user.value).toEqual(mockUser);
      expect(isAuthenticated.value).toBe(true);
      expect(isAdmin.value).toBe(true);
    });
  });

  describe('login', () => {
    it('должен вызывать authService.login с credentials', async () => {
      const auth = useAuth();
      const credentials: LoginCredentials = { name: 'testuser', password: 'password123' };

      await auth.login(credentials);

      expect(getMockedLogin()).toHaveBeenCalledTimes(1);
      expect(getMockedLogin()).toHaveBeenCalledWith(credentials);
    });

    it('должен пробрасывать ошибку при неудачном логине', async () => {
      const auth = useAuth();
      const error = new Error('Invalid credentials');
      getMockedLogin().mockRejectedValueOnce(error);

      await expect(auth.login({ name: 'bad', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('loginAndRedirect', () => {
    it('должен вызывать login и редирект на указанный путь', async () => {
      const auth = useAuth();
      const credentials: LoginCredentials = { name: 'user', password: 'pass' };

      await auth.loginAndRedirect(credentials, '/dashboard');

      expect(getMockedLogin()).toHaveBeenCalledWith(credentials);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('должен редиректить на / по умолчанию', async () => {
      const auth = useAuth();

      await auth.loginAndRedirect({ name: 'user', password: 'pass' });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('logout', () => {
    it('должен вызывать authService.logout', () => {
      const auth = useAuth();

      auth.logout();

      expect(getMockedLogout()).toHaveBeenCalledTimes(1);
    });
  });

  describe('logoutAndRedirect', () => {
    it('должен вызывать logout и редирект на /login', () => {
      const auth = useAuth();

      auth.logoutAndRedirect();

      expect(getMockedLogout()).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('должен редиректить на указанный путь', () => {
      const auth = useAuth();

      auth.logoutAndRedirect('/custom-login');

      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  describe('hasPermission', () => {
    it('должен делегировать проверку в store', () => {
      const auth = useAuth();
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: {
          [SYSTEM_RESOURCES.ORDERS]: 'edit',
          [SYSTEM_RESOURCES.MATERIALS]: 'view',
        },
      });

      store.setSession(mockUser, 'operator');

      expect(auth.hasPermission(SYSTEM_RESOURCES.ORDERS, 'edit')).toBe(true);
      expect(auth.hasPermission(SYSTEM_RESOURCES.MATERIALS, 'view')).toBe(true);
      expect(auth.hasPermission(SYSTEM_RESOURCES.MATERIALS, 'edit')).toBe(false);
    });

    it('должен использовать view как уровень по умолчанию', () => {
      const auth = useAuth();
      const store = useSessionStore();
      const mockUser = createMockUser({
        role_permissions: { [SYSTEM_RESOURCES.ORDERS]: 'view' },
      });

      store.setSession(mockUser, 'operator');

      expect(auth.hasPermission(SYSTEM_RESOURCES.ORDERS)).toBe(true);
    });
  });

  describe('initialize', () => {
    it('должен вызывать authService.initialize', () => {
      const auth = useAuth();

      auth.initialize();

      expect(getMockedInitialize()).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    it('должен вызывать authService.refreshToken и возвращать результат', async () => {
      const auth = useAuth();
      getMockedRefreshToken().mockResolvedValueOnce(true);

      const result = await auth.refreshToken();

      expect(getMockedRefreshToken()).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('должен возвращать false при неудачном обновлении', async () => {
      const auth = useAuth();
      getMockedRefreshToken().mockResolvedValueOnce(false);

      const result = await auth.refreshToken();

      expect(result).toBe(false);
    });
  });
});
