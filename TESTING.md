# Тестирование

## Стек

- **Vitest** — тест-раннер (нативная интеграция с Vite)
- **@vue/test-utils** — тестирование Vue компонентов
- **@pinia/testing** — мокирование Pinia stores
- **happy-dom** — DOM окружение

## Команды

```bash
npm run test          # Watch режим (для разработки)
npm run test:run      # Однократный запуск
npm run test:coverage # С отчётом покрытия
```

## Структура тестов

Тесты располагаются рядом с тестируемыми файлами:

```
src/
├── entities/session/model/
│   ├── session.store.ts
│   └── session.store.test.ts     # Тесты store
├── features/auth/lib/
│   ├── useAuth.ts
│   └── useAuth.test.ts           # Тесты composable
└── widgets/forms/LoginForm/
    ├── LoginForm.vue
    └── LoginForm.test.ts         # Тесты компонента
```

## Описание тестов

### session.store.test.ts

Тестирует Pinia store сессии пользователя.

| Группа | Что проверяется |
|--------|-----------------|
| Начальное состояние | `user`, `role`, `isAuthenticated` = null/false |
| setSession | Установка пользователя, роли, токенов |
| clearSession | Очистка всех данных сессии |
| hasPermission | Проверка прав: view/edit/denied, права админа |

### useAuth.test.ts

Тестирует composable для авторизации.

| Группа | Что проверяется |
|--------|-----------------|
| Реактивное состояние | Refs обновляются при изменении store |
| login | Вызов authService, проброс ошибок |
| loginAndRedirect | Логин + редирект на указанный путь |
| logout | Очистка сессии через authService |
| logoutAndRedirect | Выход + редирект на /login |
| hasPermission | Делегация проверки в store |
| initialize | Инициализация из localStorage |
| refreshToken | Обновление токена |

### LoginForm.test.ts

Тестирует Vue компонент формы логина.

| Группа | Что проверяется |
|--------|-----------------|
| Рендеринг | Наличие формы, полей, кнопки |
| Интеграция | Начальные значения, типы полей |
| Обработка ошибок | Элементы для отображения ошибок |
| UI элементы | Иконки, состояния кнопки |
| Метки полей | Корректные label с i18n ключами |

## Моки

### vue-router
```typescript
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}));
```

### authService
```typescript
vi.mock('../model/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
    refreshToken: vi.fn(),
  },
}));
```

### Quasar компоненты
Для тестов LoginForm используются стабы QForm, QInput, QBtn, QIcon с минимальной реализацией.

## Конфигурация

### vitest.config.ts
- Алиас `src` для импортов
- Окружение `happy-dom`
- Глобальные переменные (`describe`, `it`, `expect`)
- Setup файл для моков

### vitest.setup.ts
- Мок `localStorage`
- Мок `window.location`
- Глобальный мок `$t` для i18n

