/**
 * Хранилище для управления состоянием выбора и расчёта планирования заказов
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlanningMode, MaterialShortageInfo } from 'src/entities/order/model/order.types';

/**
 * Детали ресурса операции
 */
export interface OperationResource {
  id: string;
  name: string;
  type: string; // материал, работник, оборудование
  take?: number | undefined;
  return?: number | undefined;
  amount?: number | undefined;
  conditions?: unknown[] | undefined;
}

/** Недостающий материал (не обеспеченный источником) */
export interface MissingMaterial {
  materialId: string;
  materialName: string;
  /** Количество, которого не хватает */
  missing: number;
}

/**
 * Операция в рассчитанном плане
 */
export interface PlanOperation {
  id: string;
  orderId: string;
  operationId: string;
  operationName: string;
  startTime: string; // дата ISO
  endTime: string; // дата ISO
  resourceId: string;
  resourceName: string;
  resourceType: string;
  duration: number; // в минутах
  resources?: OperationResource[]; // Ресурсы операции
  description?: string; // Описание операции
  /** true если операция (хотя бы один сегмент) не обеспечена материалами */
  not_provided?: boolean;
  /** Суммарно недостающие материалы по всей операции */
  missingMaterials?: MissingMaterial[];
  /** Отрезки реальной работы. Если операция прерывалась, содержит >1 элемента. */
  segments?: Array<{
    startTime: string;
    endTime: string;
    durationMinutes: number;
    /** Сегмент не обеспечен: не хватает исходного сырья */
    not_provided?: boolean;
    /** Недостающие материалы для этого сегмента */
    missingMaterials?: MissingMaterial[];
    producedMaterials?: Array<{ materialId: string; materialName: string; quantity: number }>;
    /** Потребляемые материалы для этого сегмента */
    consumedMaterials?: Array<{ materialId: string; materialName: string; quantity: number }>;
    /** Назначенные ресурсы из группы (только при group=true) */
    assignedResources?: Array<{
      resourceId: string;
      resourceName: string;
      resourceType: string;
      groupId: string;
      /** В группе нет работников / оборудования — заглушка в плане */
      emptyProductionUnitGroup?: boolean;
    }>;
  }>;
}

/**
 * Информация о ресурсе в рассчитанном плане
 */
export interface PlanResource {
  id: string;
  name: string;
  type: string;
  availability: number; // 0-100%
  accessibility: boolean;
  usageCount?: number;
  totalUsageTime?: number; // в минутах
  loadPercentage?: number; // 0-100%
}

/**
 * Контрольная точка в рассчитанном плане
 */
export interface PlanMilestone {
  id: string;
  name: string;
  orderId: string;
  date: string; // дата ISO
  type: string; // старт, завершение, отгрузка и т.д.
}

/**
 * Группа задач для организации операций по заказу
 */
export interface PlanTaskGroup {
  id: string;
  name: string;
  orderId: string;
  startTime: string; // дата ISO
  endTime: string; // дата ISO
  type: string; // 'order'
  /** ID клиентского заказа, которому принадлежит производственный заказ */
  clientOrderId?: string;
  /** Название клиентского заказа */
  clientOrderName?: string;

  /**
   * Разбивка по клиентским заказам для объединённых ПЗ (orderBatchingPeriodDays).
   * С бэкенда PlanTaskGroupDto.clientOrderSplits.
   */
  clientOrderSplits?: Array<{ clientOrderName: string; quantity: number }>;
}

/** Структурированная проблема плана (нехватка склада, нет источника, и т.д.) */
export interface PlanIssue {
  type: 'missing_stock' | 'no_stream' | 'resource_unavailable' | 'general';
  entityId?: string;
  entityName?: string;
  required?: number;
  available?: number;
  message: string;
}

/**
 * Сводка расчёта планирования
 */
export interface PlanSummary {
  totalOperations: number;
  totalResources: number;
  totalMilestones: number;
  totalOrders: number;
  warnings: string[];
  infoMessages: string[];
  issues?: PlanIssue[];
}

/**
 * Полный результат планирования из расчёта
 */
export interface PlanningResult {
  operations: PlanOperation[];
  resources: PlanResource[];
  milestones: PlanMilestone[];
  taskGroups: PlanTaskGroup[];
  summary: PlanSummary;
  materialShortageInfo?: MaterialShortageInfo[];
}

/**
 * Хранилище выбора планирования
 * Управляет временным состоянием для рабочего процесса планирования заказов
 */
export const usePlanningSelectionStore = defineStore('planning-selection', () => {
  // ===== Состояние =====

  /**
   * Выбранные идентификаторы заказов для планирования
   */
  const selectedOrderIds = ref<string[]>([]);

  /**
   * Тип планирования
   * Поддерживается: 'direct' (Прямое планирование)
   */
  const planningType = ref<string>('direct');

  /**
   * Дата начала планирования (YYYY-MM-DD или null)
   */
  const startFrom = ref<string | null>(null);

  /**
   * Режим запуска планирования
   */
  const planningMode = ref<PlanningMode>('standard');

  /**
   * Объединение заказов в партии, в периоде (дней)
   */
  const orderBatchingPeriodDays = ref<number>(0);

  /**
   * Результат расчёта планирования
   */
  const planningResult = ref<PlanningResult | null>(null);

  /**
   * Состояние загрузки во время расчёта
   */
  const isLoading = ref(false);

  /**
   * Сообщение об ошибке при неудачном расчёте
   */
  const error = ref<string | null>(null);

  // ===== Действия =====

  /**
   * Установить выбранные идентификаторы заказов
   */
  function setSelectedOrders(orderIds: string[]) {
    selectedOrderIds.value = orderIds;
  }

  /**
   * Установить тип планирования
   */
  function setPlanningType(type: string) {
    planningType.value = type;
  }

  /**
   * Установить дату начала планирования
   */
  function setStartFrom(date: string | null) {
    startFrom.value = date;
  }

  /**
   * Установить режим запуска планирования
   */
  function setPlanningMode(mode: PlanningMode) {
    planningMode.value = mode;
  }

  /**
   * Установить период объединения заказов в партии (дней)
   */
  function setOrderBatchingPeriodDays(days: number) {
    orderBatchingPeriodDays.value = days;
  }

  /**
   * Установить результат расчёта планирования
   */
  function setPlanningResult(result: PlanningResult | null) {
    planningResult.value = result;
  }

  /**
   * Установить состояние загрузки
   */
  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  /**
   * Установить сообщение об ошибке
   */
  function setError(errorMessage: string | null) {
    error.value = errorMessage;
  }

  /**
   * Очистить все данные планирования
   * Вызывается при выходе со страницы плана заказов
   */
  function clearPlanningData() {
    selectedOrderIds.value = [];
    planningType.value = 'direct';
    startFrom.value = null;
    planningMode.value = 'standard';
    orderBatchingPeriodDays.value = 0;
    planningResult.value = null;
    error.value = null;
    isLoading.value = false;
  }

  // ===== Возврат =====

  return {
    // Состояние
    selectedOrderIds,
    planningType,
    startFrom,
    planningMode,
    orderBatchingPeriodDays,
    planningResult,
    isLoading,
    error,
    // Действия
    setSelectedOrders,
    setPlanningType,
    setStartFrom,
    setPlanningMode,
    setOrderBatchingPeriodDays,
    setPlanningResult,
    setLoading,
    setError,
    clearPlanningData,
  };
});
