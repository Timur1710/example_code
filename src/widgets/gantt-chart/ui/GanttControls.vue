<template>
  <div class="gantt-controls">
    <!-- Временное масштабирование (scale) -->
    <div class="gantt-controls__group">
      <q-btn
        flat
        dense
        round
        icon="add"
        size="sm"
        color="primary"
        @click="$emit('scale-plus')"
        :disable="!canZoomIn"
      >
        <q-tooltip>{{ t('gantt_controls.zoom_in') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="remove"
        size="sm"
        color="primary"
        @click="$emit('scale-minus')"
        :disable="!canZoomOut"
      >
        <q-tooltip>{{ t('gantt_controls.zoom_out') }}</q-tooltip>
      </q-btn>
      <span class="gantt-controls__label">{{ formatScaleLabel(currentScale) }}</span>
    </div>

    <!-- Масштабирование высоты -->
    <div class="gantt-controls__group">
      <q-btn
        flat
        dense
        round
        icon="unfold_more"
        size="sm"
        color="primary"
        @click="$emit('height-plus')"
      >
        <q-tooltip>{{ t('gantt_controls.increase_height') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="unfold_less"
        size="sm"
        color="primary"
        @click="$emit('height-minus')"
        :disable="currentHeight <= 30"
      >
        <q-tooltip>{{ t('gantt_controls.decrease_height') }}</q-tooltip>
      </q-btn>
      <span class="gantt-controls__label">{{ currentHeight }}px</span>
    </div>

    <!-- Ширина ячеек -->
    <div class="gantt-controls__group">
      <q-btn
        flat
        dense
        round
        icon="keyboard_double_arrow_right"
        size="sm"
        color="primary"
        @click="$emit('width-plus')"
      >
        <q-tooltip>{{ t('gantt_controls.increase_width') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="keyboard_double_arrow_left"
        size="sm"
        color="primary"
        @click="$emit('width-minus')"
        :disable="currentWidth <= 20"
      >
        <q-tooltip>{{ t('gantt_controls.decrease_width') }}</q-tooltip>
      </q-btn>
      <span class="gantt-controls__label">{{ currentWidth }}px</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SCALE_VALUES } from '../lib/gantt-scale-values';

const { t } = useI18n();

interface Props {
  /** Текущее значение scale (в минутах) */
  currentScale: number;
  /** Текущая высота строк */
  currentHeight: number;
  /** Текущая ширина ячеек */
  currentWidth: number;
  /** Минимальное значение scale */
  minScale?: number;
  /** Максимальное значение scale */
  maxScale?: number;
}

const props = withDefaults(defineProps<Props>(), {
  minScale: 1,
  maxScale: 8640,
});

defineEmits<{
  'scale-plus': [];
  'scale-minus': [];
  'height-plus': [];
  'height-minus': [];
  'width-plus': [];
  'width-minus': [];
}>();

/**
 * Можно ли увеличить масштаб (zoom in)
 */
const canZoomIn = computed(() => {
  const scaleArray = SCALE_VALUES as number[];
  const currentIndex = scaleArray.indexOf(props.currentScale);
  return currentIndex > 0;
});

/**
 * Можно ли уменьшить масштаб (zoom out)
 */
const canZoomOut = computed(() => {
  const scaleArray = SCALE_VALUES as number[];
  const currentIndex = scaleArray.indexOf(props.currentScale);
  return currentIndex < scaleArray.length - 1;
});

/**
 * Форматировать метку масштаба
 */
function formatScaleLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  } else if (minutes < 1440) {
    const hours = minutes / 60;
    return hours % 1 === 0 ? `${hours} ч` : `${hours.toFixed(1)} ч`;
  } else {
    const days = minutes / 1440;
    return days % 1 === 0 ? `${days} дн` : `${days.toFixed(1)} дн`;
  }
}
</script>

<style lang="scss" scoped>
.gantt-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &__group {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-right: 1px solid #e0e0e0;

    &:last-child {
      border-right: none;
    }
  }

  &__label {
    font-size: 12px;
    color: #757575;
    min-width: 60px;
    text-align: center;
    font-weight: 500;
  }
}
</style>
