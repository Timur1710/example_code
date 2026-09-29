import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { authService } from 'src/features/auth';
import { checkRoutePermission } from 'src/features/authorization';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior(to) {
      if (to.hash) {
        return { el: to.hash };
      }
      return { left: 0, top: 0 };
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Инициализируем авторизацию из localStorage при старте
  let isInitialized = false;

  // Navigation Guard для защиты маршрутов
  Router.beforeEach((to, _from, next) => {
    // Инициализируем авторизацию из localStorage при первом запуске
    if (!isInitialized) {
      authService.initialize();
      isInitialized = true;
    }

    const isAuthenticated = authService.isAuthenticated();

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const guestOnly = to.matched.some(record => record.meta.guestOnly);

    if (requiresAuth && !isAuthenticated) {
      // Маршрут требует авторизации, но пользователь не авторизован
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else if (guestOnly && isAuthenticated) {
      // Маршрут только для гостей, но пользователь авторизован
      next('/');
    } else if (requiresAuth && !checkRoutePermission(to)) {
      // Нет прав доступа к маршруту
      next({ path: '/access-denied', query: { from: to.fullPath } });
    } else {
      next();
    }
  });

  return Router;
});
