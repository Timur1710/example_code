/**
 * Gantt Chart Widget
 * Виджет для отображения диаграммы Ганта на основе v-gantt-chart-vue3
 */

// UI Components
export { default as GanttChart } from './ui/GanttChart.vue';
export { default as GanttControls } from './ui/GanttControls.vue';

// Utilities
export { SCALE_VALUES } from './lib/gantt-scale-values';
export {
  transformPlanDataToGantt,
  transformPlanDataToWorkerGantt,
  transformPlanDataToEquipmentGantt,
  transformPlanDataToMaterialGantt,
  transformPlanDataToOrdersGantt,
  transformPlanDataToFinishedGoodsGantt,
} from './lib/gantt-data-transformer';

// Types
export type {
  GanttChartData,
  GanttChartRow,
  GanttChartBlock,
} from './lib/gantt-data-transformer';
export type { ScaleValue } from './lib/gantt-scale-values';
