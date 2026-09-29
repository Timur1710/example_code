/**
 * Auth Feature
 * Аутентификация пользователей
 */

// Composable (для Vue компонентов)
export { useAuth } from './lib/useAuth';

// Service (для использования вне Vue, например в axios interceptors)
export { authService } from './model/auth.service';

// API
export { authApi } from './api/auth.api';

