import type { RouteRecordRaw } from 'vue-router';
import type { RoutePermissionMeta } from 'src/shared/types/permissions';
import { SYSTEM_RESOURCES } from 'src/shared/config/permissions';

declare module 'vue-router' {
  interface RouteMeta {
    /** Требуется авторизация */
    requiresAuth?: boolean;
    /** Только для неавторизованных */
    guestOnly?: boolean;
    /** Требуемые права доступа */
    permission?: RoutePermissionMeta;
  }
}

/**
 * Хелпер для создания permission meta
 * @param resource - Ресурс из SYSTEM_RESOURCES
 * @param level - Уровень доступа (по умолчанию 'view')
 */
const perm = (
  resource: string,
  level: 'view' | 'edit' = 'view',
): RoutePermissionMeta => ({ resource, level });

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'main',
        component: () => import('pages/IndexPage.vue'),
      },
      // Производство и операции
      {
        path: 'streams',
        name: 'streams',
        component: () => import('pages/StreamPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.STREAMS) },
      },
      {
        path: 'streams/:id',
        name: 'stream-details',
        component: () => import('pages/StreamDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.STREAMS) },
      },
      {
        path: 'streams/create',
        name: 'create-stream',
        component: () => import('pages/CreateStreamPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.STREAMS) },
      },
      {
        path: 'operations',
        name: 'operations',
        component: () => import('pages/OperationsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.OPERATIONS) },
      },
      {
        path: 'operations/:id',
        name: 'operation-details',
        component: () => import('pages/OperationDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.OPERATIONS) },
      },
      // Бизнес-сущности
      {
        path: 'orders',
        name: 'orders',
        component: () => import('pages/OrdersPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.ORDERS) },
      },
      {
        path: 'orders/create',
        name: 'create-order',
        component: () => import('pages/CreateOrderPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.ORDERS) },
      },
      {
        path: 'orders/:id',
        name: 'order-details',
        component: () => import('pages/OrderDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.ORDERS) },
      },
      {
        path: 'order-plan',
        name: 'order-plan',
        component: () => import('pages/OrderPlanPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.ORDERS) },
      },
      {
        path: 'workers',
        name: 'workers',
        component: () => import('pages/WorkersPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.WORKERS) },
      },
      {
        path: 'workers/:id',
        name: 'worker-details',
        component: () => import('pages/WorkerDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.WORKERS) },
      },
      {
        path: 'materials',
        name: 'materials',
        component: () => import('pages/MaterialsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.MATERIALS) },
      },
      {
        path: 'materials/:id',
        name: 'material-details',
        component: () => import('pages/MaterialDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.MATERIALS) },
      },
      {
        path: 'equipments',
        name: 'equipments',
        component: () => import('pages/EquipmentPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.EQUIPMENT) },
      },
      {
        path: 'equipments/:id',
        name: 'equipment-details',
        component: () => import('pages/EquipmentDetailsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.EQUIPMENT) },
      },
      // // Справочники и настройки
      // {
      //   path: 'directories',
      //   name: 'directories',
      //   component: () => import('pages/IndexPage.vue'),
      //   meta: { permission: perm(SYSTEM_RESOURCES.DESKBOOK) },
      // },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.SETTINGS) },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('pages/UsersPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.SYSTEM) },
      },
      {
        path: 'help',
        name: 'help',
        component: () => import('pages/HelpPage.vue'),
        meta: { permission: perm(SYSTEM_RESOURCES.SYSTEM) },
      },
    ],
  },

  // Страница доступ запрещён
  {
    path: '/access-denied',
    component: () => import('pages/AccessDeniedPage.vue'),
    meta: { requiresAuth: true },
  },

  // 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
