/**
 * Type declarations for jordium-gantt-vue3
 */

declare module 'jordium-gantt-vue3' {
  import type { DefineComponent } from 'vue';

  export interface GanttTask {
    id: string | number;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    progress?: number;
    dependencies?: (string | number)[];
    resource?: string | number;
    resourceName?: string;
    orderId?: string;
    duration?: number;
    type?: string;
    barColor?: string;
    [key: string]: unknown;
  }

  export interface GanttResource {
    id: string | number;
    name: string;
    type?: string;
    availability?: number;
    accessible?: boolean;
    [key: string]: unknown;
  }

  export interface GanttMilestone {
    id: string | number;
    name: string;
    date: Date | string;
    [key: string]: unknown;
  }

  export interface GanttChartProps {
    tasks?: GanttTask[];
    resources?: GanttResource[];
    milestones?: GanttMilestone[];
    startDate?: Date;
    endDate?: Date;
    height?: string | number;
    showTodayMarker?: boolean;
    showGrid?: boolean;
    showTaskList?: boolean;
    showToolbar?: boolean;
    toolbarConfig?: Record<string, boolean>;
    enableDrag?: boolean;
    enableResize?: boolean;
    enableLinkAnchor?: boolean;
    enableTaskbarTooltip?: boolean;
    timeScale?: 'hour' | 'day' | 'week' | 'month';
    rowHeight?: number;
    headerHeight?: number;
    viewMode?: 'task' | 'resource';
    locale?: string;
    localeMessages?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export const GanttChart: DefineComponent<GanttChartProps>;

  export default GanttChart;
}
