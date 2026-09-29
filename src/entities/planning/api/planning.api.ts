/**
 * API для работы с планированием заказов
 */

import { apiClient } from 'src/shared/api';
import type {
  PlanOperation,
  PlanResource,
  PlanMilestone,
  PlanTaskGroup,
  PlanSummary,
} from 'src/stores/planning-selection.store';
import type { PlanningMode, MaterialShortageInfo } from 'src/entities/order/model/order.types';

/**
 * Request parameters for plan calculation
 */
export interface CalculatePlanParams {
  /** Array of order IDs to include in planning */
  orderIds: string[];
  /** Planning type: 'direct' for Прямое планирование */
  planningType: string;
  /** Optional start date for planning (ISO 8601 / YYYY-MM-DD). Planning starts from this date instead of now. */
  startFrom?: string | null;
  /** Режим запуска планирования */
  planningMode?: PlanningMode;
  /** Период объединения заказов (в днях). 0 — без объединения. */
  orderBatchingPeriodDays?: number;
}

/**
 * Response from plan calculation
 */
export interface PlanCalculationResponse {
  /** Calculated operations with timing and resources */
  operations: PlanOperation[];
  /** Resources involved in the plan */
  resources: PlanResource[];
  /** Milestones in the plan (order start/end dates, shipment dates, etc.) */
  milestones: PlanMilestone[];
  /** Task groups for organizing operations by order */
  taskGroups: PlanTaskGroup[];
  /** Summary statistics and warnings */
  summary: PlanSummary;
  /** Информация о нехватке материалов (режим actual_availability) */
  materialShortageInfo?: MaterialShortageInfo[];
}

/**
 * Planning API client
 */
/**
 * Тип экспортируемого отчёта
 */
export type ExportType = 'production_plan' | 'planned_output' | 'purchase_needs';

/**
 * Параметры запроса экспорта плана в XLSX
 */
export interface ExportPlanParams extends CalculatePlanParams {
  exportType: ExportType;
}

export const planningApi = {
  /**
   * Calculate plan for selected orders
   *
   * This endpoint computes resource consumption and operation scheduling
   * without persisting the plan to the database.
   *
   * @param params - Order IDs and planning type
   * @returns Calculated plan with operations, resources, and summary
   */
  async calculatePlan(params: CalculatePlanParams): Promise<PlanCalculationResponse> {
    const response = await apiClient.post<PlanCalculationResponse>(
      '/planning/calculate',
      params
    );
    return response.data;
  },

  /**
   * Экспорт плана в XLSX.
   *
   * Возвращает Blob файла xlsx для скачивания.
   */
  async exportPlanXlsx(params: ExportPlanParams): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.post('/export/plan/xlsx', params, {
      responseType: 'blob',
    });

    // Извлекаем имя файла из Content-Disposition или формируем по умолчанию
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const defaultFilenames: Record<string, string> = {
      production_plan: 'План производственных работ.xlsx',
      planned_output: 'Плановый выпуск продукции.xlsx',
      purchase_needs: 'Потребности в закупке.xlsx',
    };
    let filename = defaultFilenames[params.exportType] ?? 'Экспорт.xlsx';
    if (contentDisposition) {
      // filename*=UTF-8''encoded_name.xlsx
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
      if (utf8Match?.[1]) {
        filename = decodeURIComponent(utf8Match[1]);
      } else {
        // filename="name.xlsx"
        const basicMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
        if (basicMatch?.[1]) {
          filename = basicMatch[1];
        }
      }
    }

    return { blob: response.data as Blob, filename };
  },
};
