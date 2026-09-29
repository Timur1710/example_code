/**
 * Type declarations for v-gantt-chart-vue3
 */

declare module 'v-gantt-chart-vue3' {
  import type { DefineComponent } from 'vue';

  interface GanttChartProps {
    startTime?: string;
    endTime?: string;
    datas?: unknown[];
    cellHeight?: number;
    cellWidth?: number;
    scale?: number;
    enableGrab?: boolean;
    timeLines?: unknown[];
    /** 0 = рендерить все строки; 1+ = доп. строк для вирт. списка */
    preload?: number;
  }

  const VGanttChart: DefineComponent<GanttChartProps>;
  export default VGanttChart;
}
