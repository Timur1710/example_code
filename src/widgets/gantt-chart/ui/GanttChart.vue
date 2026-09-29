<template>
  <div class="gantt-chart-widget">
    <!-- Панель управления масштабом -->
    <GanttControls
      v-if="showControls"
      :current-scale="internalScale"
      :current-height="internalCellHeight"
      :current-width="internalCellWidth"
      @scale-plus="handleScalePlus"
      @scale-minus="handleScaleMinus"
      @height-plus="handleHeightPlus"
      @height-minus="handleHeightMinus"
      @width-plus="handleWidthPlus"
      @width-minus="handleWidthMinus"
      class="gantt-chart-widget__controls"
    />

    <!-- Область с диаграммой: loader до отрисовки, затем плавное появление -->
    <div
      v-if="ganttData.rows.length > 0"
      class="gantt-chart-widget__chart-area"
    >
      <div
        v-show="!isChartVisible"
        class="gantt-chart-widget__loader"
      >
        <q-spinner-dots color="primary" size="48px" />
      </div>
      <div
        ref="chartWrapperRef"
        class="gantt-chart-widget__chart-wrapper"
        :class="{ 'gantt-chart-widget__chart-wrapper--visible': isChartVisible }"
      >
        <v-gantt-chart
          ref="ganttChartRef"
          :start-time="chartConfig.startTime"
          :end-time="chartConfig.endTime"
          :datas="filteredRows"
          :cell-height="chartCellHeight"
          :cell-width="internalCellWidth"
          :scale="internalScale"
          :enable-grab="chartConfig.enableGrab"
          :preload="preloadRows"
        >
      <!-- Блок операции на временной шкале -->
      <template #block="{ data, item }">
        <div
          v-if="!item.totalStatusBlock"
          :style="barBlockStyle(item)"
          class="gantt-chart-widget__bar"
          :class="{
            'gantt-chart-widget__bar--group': data.isGroup,
            'gantt-chart-widget__bar--not-provided': item.not_provided,
            'gantt-chart-widget__bar--stacked': isStackedGanttBlock(item),
          }"
          :title="`${item.config?.menu?.operation_name || item.name}\n${formatDuration(item.duration)}${item.not_provided ? '\n⚠ Не обеспечено материалами' : ''}`"
          @click="(event: MouseEvent) => handleOperationClick(item, event)"
        >
          <span v-if="!data.isGroup">
            {{ item.config?.menu?.operation_name || item.name }}
          </span>
        </div>
      </template>

      <!-- Заголовок временной шкалы -->
      <template #timeline="{ day, getTimeScales }">
        <div class="gantt-chart-widget__timeline">
          <div class="gantt-chart-widget__timeline-date">
            {{ formatDate(day) }}
          </div>
          <div class="gantt-chart-widget__timeline-hours">
            <div
              v-for="(timeScale, idx) in getTimeScales(day)"
              :key="idx"
              class="gantt-chart-widget__timeline-hour"
              :style="{ width: chartConfig.cellWidth + 'px' }"
            >
              {{ formatTimeScale(timeScale) }}
            </div>
          </div>
        </div>
      </template>

      <!-- Заголовок таблицы (левый верхний угол) с фильтром по клиентским заказам -->
      <template #title>
        <div class="gantt-chart-widget__title-filter">
          <MultiCheckboxSelect
            v-if="availableClientOrders.length > 0"
            v-model="selectedClientOrderFilter"
            :options="availableClientOrders"
            :label="t('gantt_diagram.filter_client_orders')"
          />
        </div>
      </template>

      <!-- Левая панель (названия строк) -->
      <template #left="{ data }">
        <div
          class="gantt-chart-widget__left-item"
          :class="{ 'gantt-chart-widget__left-item--group': data.isGroup }"
        >
          <div
            class="gantt-chart-widget__left-content"
            :class="{ 'gantt-chart-widget__left-content--clickable': !data.isGroup }"
            @click="!data.isGroup && handleLeftContentClick(data, $event)"
          >
            <p class="gantt-chart-widget__left-title">{{ data.name }}</p>
            <template v-if="!data.isGroup">
              <p v-if="data.clientOrderName" class="gantt-chart-widget__left-id">{{ data.clientOrderName }}</p>
              <p v-if="data.productionOrderName" class="gantt-chart-widget__left-id">{{ data.productionOrderName }}</p>
            </template>
            <p v-else-if="data.o_id" class="gantt-chart-widget__left-id">{{ data.o_id }}</p>
          </div>
          <q-icon
            v-if="data.clientOrderId && warningRowIds?.has(data.clientOrderId)"
            name="warning"
            color="warning"
            size="18px"
            class="gantt-chart-widget__left-warning"
            :title="t('gantt_diagram.deadline_conflict')"
          />
        </div>
      </template>
        </v-gantt-chart>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="gantt-chart-widget__empty">
      <q-icon name="event_note" size="48px" color="grey-5" />
      <p class="text-grey-7">{{ t('gantt_diagram.no_data') }}</p>
    </div>

    <!-- Модалка с деталями операции (при клике на блок в timeline) -->
    <OperationSegmentModal
      v-if="selectedOperation"
      :key="operationModalKey"
      v-model="isOperationModalOpen"
      :operation="selectedOperation"
      :menu-target="menuTarget"
      :selected-segment-index="selectedSegmentIndex"
    />

    <!-- Модалка с общей информацией об операции (при клике на left-content) -->
    <OperationInfoModal
      v-if="selectedOperationForInfo"
      :key="operationInfoModalKey"
      v-model="isOperationInfoModalOpen"
      :operation="selectedOperationForInfo"
      :menu-target="infoMenuTarget"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import vGanttChartModule from 'v-gantt-chart-vue3';

/** CJS/UMD-бандл даёт `{ default: Component }`; иначе Vue: «missing template or render» для объекта-обёртки. */
const vGanttChart =
  (vGanttChartModule as { default?: typeof vGanttChartModule }).default ?? vGanttChartModule;
import type { PlanOperation, PlanTaskGroup } from 'src/stores/planning-selection.store';
import {
  transformPlanDataToGantt,
  transformPlanDataToWorkerGantt,
  transformPlanDataToEquipmentGantt,
  transformPlanDataToMaterialGantt,
  transformPlanDataToOrdersGantt,
  transformPlanDataToFinishedGoodsGantt,
  type GanttChartBlock,
} from '../lib/gantt-data-transformer';
import { SCALE_VALUES } from '../lib/gantt-scale-values';
import GanttControls from './GanttControls.vue';
import OperationSegmentModal from './OperationSegmentModal.vue';
import OperationInfoModal from './OperationInfoModal.vue';
import { MultiCheckboxSelect } from 'src/shared/ui';
import type { GanttChartRow } from '../lib/gantt-data-transformer';

const { t } = useI18n();

interface Props {
  /** Операции планирования */
  operations: PlanOperation[];
  /** Группы задач (заказы) */
  taskGroups?: PlanTaskGroup[];
  /** Высота строки в пикселях */
  cellHeight?: number;
  /** Ширина ячейки (временного интервала) в пикселях */
  cellWidth?: number;
  /** Временная шкала (в минутах) */
  scale?: number;
  /** Разрешить перетаскивание */
  enableGrab?: boolean;
  /** Показать панель управления масштабом */
  showControls?: boolean;
  /**
   * preload: 0 = рендерить все строки сразу (без вирт. списка),
   * 1+ = кол-во доп. строк сверху/снизу для вирт. списка.
   * 0 устраняет «волну» появления при загрузке.
   */
  preloadRows?: number;
  /**
   * Способ группировки строк:
   * 'order' — по заказам (по умолчанию),
   * 'worker' — по сотрудникам (строка = сотрудник, блоки = его операции),
   * 'equipment' — по оборудованию (строка = единица оборудования),
   * 'material' — по материалам (строка = материал, блоки = операции в которых он потребляется).
   * 'orders' — по заказам плана (строка = заказ, в строке все операции заказа; пересечения — уровни).
   * 'finished-goods' — по готовым изделиям (строка = итоговый продукт + цепочка полуфабрикатов; пересечения — уровни).
   */
  groupBy?: 'order' | 'worker' | 'equipment' | 'material' | 'orders' | 'finished-goods';
  /**
   * Подавить дефолтную модалку при клике на левую панель (название строки).
   * Если true — вместо открытия OperationInfoModal будет эмититься событие 'row-click'.
   */
  suppressDefaultLeftModal?: boolean;
  /**
   * Подавить дефолтную модалку при клике на блок операции.
   * Если true — вместо открытия OperationSegmentModal будет эмититься событие 'block-click'.
   */
  suppressDefaultBlockModal?: boolean;
  /**
   * Набор clientOrderId, для которых нужно показать иконку предупреждения о несоблюдении сроков.
   */
  warningRowIds?: Set<string>;
}

const props = withDefaults(defineProps<Props>(), {
  taskGroups: () => [],
  cellHeight: 60,
  cellWidth: 50,
  scale: 60, // 60 минут = 1 час
  enableGrab: false,
  showControls: true,
  preloadRows: 0,
  groupBy: 'order',
  suppressDefaultLeftModal: false,
  suppressDefaultBlockModal: false,
});

const emit = defineEmits<{
  /** Клик по строке левой панели (когда suppressDefaultLeftModal = true) */
  'row-click': [row: GanttChartRow, event: MouseEvent];
  /** Клик по блоку операции (когда suppressDefaultBlockModal = true) */
  'block-click': [block: GanttChartBlock, operation: PlanOperation | null, event: MouseEvent];
}>();

// Ref на компонент диаграммы
const ganttChartRef = ref<InstanceType<typeof vGanttChart> | null>(null);

// Внутренние состояния для управления масштабом
const internalCellHeight = ref(props.cellHeight);
const internalCellWidth = ref(props.cellWidth);
const internalScale = ref(props.scale);

// Состояние для модалки деталей операции (при клике на блок)
const isOperationModalOpen = ref(false);
const selectedOperation = ref<PlanOperation | null>(null);
const selectedSegmentIndex = ref<number | null>(null);
const menuTarget = ref<Element | boolean>(false);
/** Ключ для принудительного пересоздания модалки при каждом открытии (обход бага q-menu с тем же target) */
const operationModalKey = ref(0);

// Состояние для модалки общей информации (при клике на left-content)
const isOperationInfoModalOpen = ref(false);
const selectedOperationForInfo = ref<PlanOperation | null>(null);
const infoMenuTarget = ref<Element | boolean>(false);
const operationInfoModalKey = ref(0);

// Скрываем диаграмму до полной отрисовки (убирает «волну» появления столбцов)
const isChartVisible = ref(false);
const chartWrapperRef = ref<HTMLElement | null>(null);

// Синхронизация с props при их изменении
watch(
  () => props.cellHeight,
  (newValue) => {
    internalCellHeight.value = newValue;
  }
);

watch(
  () => props.cellWidth,
  (newValue) => {
    internalCellWidth.value = newValue;
  }
);

watch(
  () => props.scale,
  (newValue) => {
    internalScale.value = newValue;
  }
);

/**
 * Преобразованные данные для диаграммы Ганта
 */
const ganttData = computed(() => {
  if (props.groupBy === 'worker') {
    return transformPlanDataToWorkerGantt(props.operations);
  }
  if (props.groupBy === 'equipment') {
    return transformPlanDataToEquipmentGantt(props.operations);
  }
  if (props.groupBy === 'material') {
    return transformPlanDataToMaterialGantt(props.operations);
  }
  if (props.groupBy === 'orders') {
    return transformPlanDataToOrdersGantt(props.operations, props.taskGroups);
  }
  if (props.groupBy === 'finished-goods') {
    return transformPlanDataToFinishedGoodsGantt(props.operations, props.taskGroups);
  }
  return transformPlanDataToGantt(props.operations, props.taskGroups);
});

/** В режиме «orders»: высота сегмента 24px (как на остальных вкладках), строка не растягивает блок на всю ячейку */
const ORDERS_GANTT_BAR_HEIGHT_PX = 24;
const ORDERS_GANTT_TRACK_STEP_PX = 28;
const ORDERS_GANTT_ROW_PADDING_PX = 8;

/**
 * Высота строки: только «orders» — не меньше настройки панели (как у других вкладок) и не меньше места под полосы;
 * остальные режимы — только internalCellHeight.
 */
const chartCellHeight = computed(() => {
  if (props.groupBy !== 'orders' && props.groupBy !== 'finished-goods') {
    return internalCellHeight.value;
  }
  const lanes = ganttData.value.orderRowMaxLanes ?? 1;
  const byLanes = lanes * ORDERS_GANTT_TRACK_STEP_PX + ORDERS_GANTT_ROW_PADDING_PX;
  return Math.min(720, Math.max(internalCellHeight.value, byLanes));
});

function isStackedGanttBlock(item: GanttChartBlock): boolean {
  return (item.orderLaneCount ?? 0) > 1;
}

function barBlockStyle(item: GanttChartBlock): Record<string, string> {
  const fromConfig: Record<string, string> = item.config?.style ?? {};
  if (
    (props.groupBy !== 'orders' && props.groupBy !== 'finished-goods') ||
    !isStackedGanttBlock(item) ||
    item.orderLaneIndex == null ||
    item.orderLaneCount == null
  ) {
    return fromConfig;
  }
  const n = item.orderLaneCount;
  const i = item.orderLaneIndex;
  const H = chartCellHeight.value;
  const band = H / n;
  const barH = Math.min(ORDERS_GANTT_BAR_HEIGHT_PX, Math.max(14, band - 4));
  const topPx = i * band + (band - barH) / 2;
  return {
    ...fromConfig,
    position: 'absolute',
    top: `${topPx}px`,
    height: `${barH}px`,
    left: '0',
    width: '100%',
    boxSizing: 'border-box',
  };
}

/**
 * Выбранные клиентские заказы для фильтрации
 */
const selectedClientOrderFilter = ref<string[]>([]);

/**
 * Список уникальных клиентских заказов для фильтра.
 * Читаем из уже обработанных строк (трансформер парсит имена из group.name),
 * поэтому данные корректны даже если бэкенд не присылает clientOrderId явно.
 */
const availableClientOrders = computed(() => {
  const seen = new Set<string>();
  const options: { label: string; value: string }[] = [];
  for (const row of ganttData.value.rows) {
    if (row.clientOrderId && !seen.has(row.clientOrderId)) {
      seen.add(row.clientOrderId);
      options.push({ label: row.clientOrderName ?? row.clientOrderId, value: row.clientOrderId });
    }
  }
  return options;
});

/**
 * Строки диаграммы с применённым фильтром по клиентским заказам.
 * Группы (isGroup) всегда скрыты — отображаются только строки операций.
 * Если фильтр пуст — возвращаются все строки операций.
 */
const filteredRows = computed(() => {
  const operationRows = ganttData.value.rows.filter((row) => !row.isGroup);
  if (selectedClientOrderFilter.value.length === 0) {
    return operationRows;
  }
  return operationRows.filter(
    (row) => !row.clientOrderId || selectedClientOrderFilter.value.includes(row.clientOrderId),
  );
});

/**
 * Обработчик увеличения временного масштаба (zoom in)
 */
function handleScalePlus() {
  const scaleArray = SCALE_VALUES as number[];
  const currentIndex = scaleArray.indexOf(internalScale.value);
  if (currentIndex > 0) {
    const newValue = scaleArray[currentIndex - 1];
    if (newValue !== undefined) {
      internalScale.value = newValue;
      console.log('📊 Scale zoom in:', internalScale.value);
    }
  }
}

/**
 * Обработчик уменьшения временного масштаба (zoom out)
 */
function handleScaleMinus() {
  const scaleArray = SCALE_VALUES as number[];
  const currentIndex = scaleArray.indexOf(internalScale.value);
  if (currentIndex < scaleArray.length - 1) {
    const newValue = scaleArray[currentIndex + 1];
    if (newValue !== undefined) {
      internalScale.value = newValue;
      console.log('📊 Scale zoom out:', internalScale.value);
    }
  }
}

/**
 * Обработчик увеличения высоты строк
 */
function handleHeightPlus() {
  internalCellHeight.value += 10;
  console.log('📊 Height increased:', internalCellHeight.value);
}

/**
 * Обработчик уменьшения высоты строк
 */
function handleHeightMinus() {
  if (internalCellHeight.value > 30) {
    internalCellHeight.value -= 10;
    console.log('📊 Height decreased:', internalCellHeight.value);
  }
}

/**
 * Обработчик увеличения ширины ячеек
 */
function handleWidthPlus() {
  internalCellWidth.value += 10;
  console.log('📊 Width increased:', internalCellWidth.value);
}

/**
 * Обработчик уменьшения ширины ячеек
 */
function handleWidthMinus() {
  if (internalCellWidth.value > 20) {
    internalCellWidth.value -= 10;
    console.log('📊 Width decreased:', internalCellWidth.value);
  }
}

/**
 * Конвертировать дату в формат для библиотеки gantt (YYYY-MM-DD HH:mm:ss)
 */
function formatDateForGantt(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Конфигурация диаграммы
 */
const chartConfig = computed(() => {
  // Вычисляем временные границы из операций
  let startTime = formatDateForGantt(new Date());
  let endTime = formatDateForGantt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 дней по умолчанию

  if (props.operations.length > 0) {
    const startTimes = props.operations.map((op) => new Date(op.startTime).getTime());
    const endTimes = props.operations.map((op) => new Date(op.endTime).getTime());

    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);

    // Добавляем отступы: 1 час до начала и 1 час после конца
    const startDate = new Date(minStart);
    startDate.setHours(startDate.getHours() - 1);
    startTime = formatDateForGantt(startDate);

    const endDate = new Date(maxEnd);
    endDate.setHours(endDate.getHours() + 1);
    endTime = formatDateForGantt(endDate);
  }

  return {
    startTime,
    endTime,
    cellHeight: props.cellHeight,
    cellWidth: props.cellWidth,
    scale: props.scale,
    enableGrab: props.enableGrab,
  };
});

/**
 * Форматировать дату для заголовка
 * Библиотека может передавать как Date, так и dayjs объект или строку
 */
function formatDate(date: unknown): string {
  try {
    // Если это объект dayjs (имеет метод format)
    if (date && typeof date === 'object' && 'format' in date && typeof date.format === 'function') {
      return (date as { format: (fmt: string) => string }).format('DD.MM.YYYY');
    }
    
    // Если это строка или Date
    const d = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return String(date);
  }
}

/**
 * Форматировать временную метку для шкалы
 */
function formatTimeScale(timeScale: unknown): string {
  try {
    // Если это объект dayjs (имеет метод format)
    if (timeScale && typeof timeScale === 'object' && 'format' in timeScale && typeof timeScale.format === 'function') {
      return (timeScale as { format: (fmt: string) => string }).format('HH:mm');
    }
    return String(timeScale);
  } catch (error) {
    console.error('Error formatting timeScale:', timeScale, error);
    return String(timeScale);
  }
}

/**
 * Форматировать длительность операции
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

/**
 * Извлечь индекс сегмента из id блока (формат: ${parentId}_seg_N)
 */
function parseSegmentIndex(blockId: string): number | null {
  const match = blockId.match(/_seg_(\d+)/);
  return match ? parseInt(match[1]!, 10) : null;
}

/**
 * Найти операцию по строке (row) из левой панели.
 * Для order mode: row.id = row_${op.id}
 * Для worker/equipment/material: берём parentId первого блока из gtArray
 */
function findOperationByRow(row: GanttChartRow): PlanOperation | null {
  // Режим order: каждая строка = одна операция
  if (row.id.startsWith('row_')) {
    const opId = row.id.replace(/^row_/, '');
    return props.operations.find((op) => op.id === opId) ?? null;
  }
  // Режим orders: строка = клиентский заказ (или ПЗ без клиента), берём первую операцию из блоков
  if (row.id.startsWith('client_order_row_')) {
    const blocks = row.gtArray?.filter((b): b is GanttChartBlock => typeof b !== 'string');
    if (!blocks?.length) return null;
    const first = blocks[0]!;
    const lookupId =
      first.parentId ??
      first.id.replace(/_seg_\d+/, '').replace(/_or\d+$/, '');
    return props.operations.find((op) => op.id === lookupId) ?? null;
  }
  if (row.id.startsWith('finished_good_row_')) {
    const blocks = row.gtArray?.filter((b): b is GanttChartBlock => typeof b !== 'string');
    if (!blocks?.length) return null;
    const first = blocks[0]!;
    const lookupId =
      first.parentId ??
      first.id.replace(/_seg_\d+/, '').replace(/_fg\d+$/, '');
    return props.operations.find((op) => op.id === lookupId) ?? null;
  }
  // Режим worker/equipment/material: строка содержит блоки, берём первую операцию
  const blocks = row.gtArray;
  if (!blocks || blocks.length === 0) return null;
  const firstBlock = blocks[0];
  if (!firstBlock || typeof firstBlock === 'string') return null;
  const opId = firstBlock.parentId ?? firstBlock.id.replace(/_seg_\d+$/, '');
  return props.operations.find((op) => op.id === opId) ?? null;
}

/**
 * Обработчик клика по левой панели (название операции)
 */
function handleLeftContentClick(row: GanttChartRow, event: MouseEvent) {
  if (props.suppressDefaultLeftModal) {
    emit('row-click', row, event);
    return;
  }
  const operation = findOperationByRow(row);
  if (operation) {
    infoMenuTarget.value = event.currentTarget as Element;
    selectedOperationForInfo.value = operation;
    operationInfoModalKey.value += 1;
    isOperationInfoModalOpen.value = true;
  }
}

/**
 * Обработчик клика по операции
 */
function handleOperationClick(item: GanttChartBlock, event: MouseEvent) {
  console.log('📊 Operation clicked:', item);

  const lookupId = item.parentId ?? item.id;
  const operation = props.operations.find((op) => op.id === lookupId) ?? null;

  if (props.suppressDefaultBlockModal) {
    emit('block-click', item, operation, event);
    return;
  }

  // Сохраняем целевой элемент для позиционирования меню
  menuTarget.value = event.currentTarget as Element;

  if (operation) {
    selectedOperation.value = operation;
    selectedSegmentIndex.value = parseSegmentIndex(item.id);
    operationModalKey.value += 1; // Пересоздаём модалку при каждом открытии
    isOperationModalOpen.value = true;
  } else {
    console.warn('⚠️ Operation not found:', item.id);
  }
}

// Ждём завершения отрисовки DOM по MutationObserver (без таймеров)
const STABLE_MS = 120;   // Без мутаций = отрисовка завершена
const MAX_WAIT_MS = 5000; // Макс. ожидание на случай зависания
let observerCleanup: (() => void) | null = null;

function waitForChartStable(): Promise<void> {
  return new Promise((resolve) => {
    const wrapper = chartWrapperRef.value;
    if (!wrapper) {
      resolve();
      return;
    }

    let stableTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const maxTimeoutId = setTimeout(() => {
      doCleanup();
      resolve();
    }, MAX_WAIT_MS);

    function doCleanup() {
      observer.disconnect();
      if (stableTimeoutId) clearTimeout(stableTimeoutId);
      clearTimeout(maxTimeoutId);
      observerCleanup = null;
    }

    observerCleanup = doCleanup;

    const observer = new MutationObserver(() => {
      if (stableTimeoutId) clearTimeout(stableTimeoutId);
      stableTimeoutId = setTimeout(() => {
        doCleanup();
        resolve();
      }, STABLE_MS);
    });

    observer.observe(wrapper, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Если мутаций нет — всё уже отрисовано
    stableTimeoutId = setTimeout(() => {
      doCleanup();
      resolve();
    }, STABLE_MS);
  });
}

async function scheduleChartVisible() {
  isChartVisible.value = false;
  await nextTick();
  await waitForChartStable();
  isChartVisible.value = true;
}

watch(
  () => ganttData.value.rows.length,
  (rowCount) => {
    if (rowCount > 0) {
      void scheduleChartVisible();
    } else {
      isChartVisible.value = false;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  observerCleanup?.();
});
</script>

<style lang="scss">
/* Глобальные стили для библиотеки v-gantt-chart */
.gantt-leftbar-item {
  border-bottom: 1px solid #d8dce0;
}

.gantt-block-top-space {
  border-bottom: none;
}

.gantt-blocks {
  border-bottom: 1px solid #d8dce0;
}

.gantt-block {
  z-index: 0;
  overflow: hidden;
}

/* Полосы «по заказам» позиционируются относительно ячейки блока */
.gantt-block-item {
  position: relative;
}

.gantt-container {
  background: white;
}

.gantt-timeline-wrapper {
  height: 100%;
}

.gantt-timeline {
  height: 100%;
  margin-left: 0 !important;
}

.gantt-timeline-block {
  height: 100%;
}

.gantt-header-title {
  height: 100% !important;
  background-color: #ffffff !important;
}

.gantt-header {
  height: 56px !important;
}

.gantt-scroll-y {
  top: 16px;
  height: calc(100% - 55px) !important;
}

.gantt-leftbar-wrapper {
  margin-top: 1px;
}
</style>

<style lang="scss" scoped>
.gantt-chart-widget {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__controls {
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  &__chart-area {
    position: relative;
    flex: 1;
    min-height: 0;
    /* Скроллы — внутри v-gantt-chart (.gantt-scroll-x / .gantt-scroll-y); здесь только обрезка по границам */
    overflow: hidden;
  }

  &__loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 1;
  }

  &__chart-wrapper {
    height: 100%;
    min-height: 0;
    opacity: 0;
    transition: opacity 0.2s ease-in;

    &--visible {
      opacity: 1;
    }
  }

  :deep(.gantt-chart) {
    height: 100%;
    max-height: 100%;
  }

  /* Блок операции на временной шкале */
  &__bar {
    background: #21ae75;
    height: 24px;
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 6px;
    cursor: pointer;
    border-radius: 4px;
    transition: opacity 0.2s;

    span {
      height: 16px;
      flex: 1 1 auto;
      max-width: 100%;
      min-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 11px;
      color: white;
      font-weight: 500;
      max-height: 100%;
      user-select: none;
    }

    &:hover {
      opacity: 0.85;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Стиль для необеспеченного блока (не хватает сырья) */
    &--not-provided {
      span {
        color: #212121 !important;
        text-shadow: 0 0 3px rgba(255, 255, 255, 0.9);
      }
    }

    /* Режим «Заказы»: фиксированная высота полосы, позиция top задаётся inline (не на всю ячейку) */
    &--stacked {
      margin: 0;

      span {
        font-size: 10px;
        line-height: 1.2;
      }
    }

    /* Стиль для группового блока */
    &--group {
      background: transparent;
      border: 2px solid currentColor;

      &::after,
      &::before {
        content: '';
        position: absolute;
        top: 20px;
        border: 10px solid transparent;
        border-top: 10px solid currentColor;
      }

      &::after {
        right: 0;
        border-right: 0 solid transparent;
      }

      &::before {
        left: 0;
        border-left: 0 solid transparent;
      }
    }
  }

  /* Временная шкала */
  &__timeline {
    border-left: 1px solid #dfe2e4;
    color: #a2a2a2;
    font-size: 11px;
    height: 100%;
  }

  &__timeline-date {
    padding: 4px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;

    &:hover {
      position: relative;
      width: auto;
      background: white;
      border-right: 1px solid #dfe2e4;
      z-index: 1;
    }
  }

  &__timeline-hours {
    display: flex;
    height: 100%;
  }

  &__timeline-hour {
    color: #a2a2a2;
    font-size: 12px;
    position: relative;
    display: flex;
    align-items: flex-start;
    border-top: 1px solid #dfe2e4;
    border-right: 1px solid #dfe2e4;
    padding: 4px 6px;

    &:last-child {
      border-right: none;
    }
  }

  /* Левая панель (названия строк) */
  &__left-item {
    position: relative;
    padding: 8px;
    height: 100%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    transition: background-color 0.2s;

    &--group {
      background: #f2f2f2;
      font-weight: 600;
    }

    &:hover {
      background: #f5f5f5;

      p {
        overflow: visible;
        text-overflow: initial;
        white-space: normal;
        height: auto;
      }
    }
  }

  &__left-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;

    &--clickable {
      cursor: pointer;
    }
  }

  &__left-warning {
    flex-shrink: 0;
  }

  &__left-title {
    color: #212121;
    font-size: 14px;
    margin: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__left-id {
    font-size: 10px;
    color: #a2a2a2;
    margin: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* Фильтр в заголовке левой панели */
  &__title-filter {
    padding: 4px 6px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Пустое состояние */
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;

    p {
      margin: 0;
      font-size: 16px;
    }
  }
}
</style>
