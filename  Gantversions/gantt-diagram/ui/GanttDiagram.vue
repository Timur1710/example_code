<template>
  <div class="gantt-diagram">
    <div v-if="loading" class="gantt-diagram__loading">
      <q-spinner-dots color="primary" size="32px" />
      <p>{{ t('gantt_diagram.loading') }}</p>
    </div>
    <div v-else-if="error" class="gantt-diagram__error">
      <q-banner dense rounded color="negative" icon="warning">
        {{ error }}
      </q-banner>
    </div>
    <div v-else class="gantt-diagram__container">
      <div v-if="ganttTasks.length === 0" class="gantt-diagram__empty">
        <p>Нет данных для отображения на диаграмме Ганта</p>
      </div>
      <GanttChart
        v-else
        :tasks="ganttTasks"
        :start-date="ganttStartDate"
        :end-date="ganttEndDate"
        :height="height"
        locale="en-US"
        :locale-messages="ganttLocaleMessages"
        :show-today-marker="true"
        :show-grid="true"
        :show-toolbar="true"
        :toolbar-config="toolbarConfig"
        :show-task-list="true"
        :enable-drag="true"
        :enable-resize="false"
        :enable-link-anchor="false"
        :enable-taskbar-tooltip="false"
        :time-scale="timeScale"
        :row-height="50"
        :header-height="60"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GanttChart, type GanttTask } from 'jordium-gantt-vue3';
import 'jordium-gantt-vue3/dist/assets/jordium-gantt-vue3.css';
import type {
  PlanOperation,
  PlanResource,
  PlanMilestone,
  PlanTaskGroup
} from 'src/stores/planning-selection.store';
import { ganttLocaleRu } from '../lib/gantt-locale-ru';

const { t } = useI18n();

/**
 * Библиотека jordium-gantt-vue3 поддерживает только locale 'zh-CN' | 'en-US'.
 * Русская локализация передаётся через localeMessages — подмена текстов для en-US.
 * Ключ должен совпадать с одним из поддерживаемых locale.
 */
const ganttLocaleMessages = { 'en-US': ganttLocaleRu };

interface Props {
  operations: PlanOperation[];
  resources: PlanResource[];
  milestones?: PlanMilestone[];
  taskGroups?: PlanTaskGroup[];
  loading?: boolean;
  error?: string | null;
  height?: string;
  timeScale?: 'hour' | 'day' | 'week' | 'month';
}

const props = withDefaults(defineProps<Props>(), {
  milestones: () => [],
  taskGroups: () => [],
  loading: false,
  error: null,
  height: '600px',
  timeScale: 'hour',
});

/**
 * Helper functions for task styling
 */
const taskColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#F44336', // Red
  '#FFEB3B', // Yellow
  '#795548', // Brown
];

const getTaskColor = (index: number): string => {
  return taskColors[index % taskColors.length] ?? '#9E9E9E';
};


/**
 * Helper: Return ISO 8601 date string with time
 * Library needs full datetime to display hours correctly
 */
const formatDateString = (dateStr: string): string => {
  // Return ISO string as-is for proper time display
  return dateStr;
};

/**
 * Build tasks structure for Gantt chart in jordium-gantt-vue3 format
 */
const ganttTasks = computed(() => {
  console.log('📊 GanttDiagram: operations count', props.operations.length);
  console.log('📊 GanttDiagram: operations data', props.operations);
  console.log('📊 GanttDiagram: taskGroups count', props.taskGroups?.length);

  if (props.operations.length === 0) {
    console.warn('⚠️ GanttDiagram: No operations to display!');
    return [];
  }

  const tasks: GanttTask[] = [];

  // Add parent groups first
  props.taskGroups?.forEach((group) => {
    tasks.push({
      id: group.id,
      name: `📦 ${group.name}`,
      startDate: formatDateString(group.startTime),
      endDate: formatDateString(group.endTime),
    });
  });

  // Add operations
  props.operations.forEach((op, index) => {
    tasks.push({
      id: op.id,
      name: op.operationName,
      startDate: formatDateString(op.startTime),
      endDate: formatDateString(op.endTime),
      barColor: getTaskColor(index),
    });
  });

  console.log('📊 GanttDiagram: generated tasks with correct format', tasks);
  return tasks;
});

/**
 * Calculate chart start date (earliest task start)
 */
const ganttStartDate = computed(() => {
  if (props.operations.length === 0) {
    return new Date().toISOString();
  }

  const dates = props.operations.map((op) => new Date(op.startTime).getTime());
  const minDate = Math.min(...dates);

  // Start one hour before the earliest operation
  const startDate = new Date(minDate);
  startDate.setHours(startDate.getHours() - 1);
  return startDate.toISOString();
});

/**
 * Calculate chart end date (latest task end)
 */
const ganttEndDate = computed(() => {
  if (props.operations.length === 0) {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return end.toISOString();
  }

  const dates = props.operations.map((op) => new Date(op.endTime).getTime());
  const maxDate = Math.max(...dates);

  // End one hour after the latest operation
  const endDate = new Date(maxDate);
  endDate.setHours(endDate.getHours() + 1);
  return endDate.toISOString();
});

/**
 * Toolbar configuration
 * Показываем только переключатель временной шкалы, скрываем все остальные элементы
 */
const toolbarConfig = {
  showAddTask: false,
  showAddMilestone: false,
  showExpandCollapse: false,
  showExportCsv: false,
  showExportPdf: false,
  showTimeScale: true, // Оставляем только переключатель временной шкалы
  showLanguage: false,
  showTodayLocate: false,
  showTheme: false,
  showFullscreen: false,
};
</script>

<style lang="scss" scoped>
.gantt-diagram {
  width: 100%;
  height: 100%;
  min-height: 400px;

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: #9e9e9e;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__error {
    padding: 16px;
  }

  &__container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>

<style lang="scss">
/* Hide progress percentage on Gantt chart bars */
.task-progress {
  display: none !important;
  visibility: hidden !important;
}

/* Additional selectors for different possible class names */
[class*="task-progress"],
[class*="gantt-progress"],
.gantt-bar-progress-text,
.gantt-task-progress-text,
.progress-text {
  display: none !important;
  visibility: hidden !important;
}

/* Hide empty rows in tooltips (actual dates that are undefined) */
.task-tooltip-row:empty,
.tooltip-row:empty,
[class*="tooltip"] div:empty,
[class*="tooltip"] [class*="row"]:empty {
  display: none !important;
}

/* Hide tooltip items with specific text patterns */
/* Target the tooltip container and hide rows that might contain actual dates */
[class*="tooltip"] {
  /* Hide any row that comes after "Planned End Date" row */
  /* This is a workaround since we can't select by text content */
  div:nth-last-child(-n+2):not(:has(*)) {
    display: none !important;
  }
}
</style>
