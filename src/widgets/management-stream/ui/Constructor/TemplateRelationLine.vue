<template>
  <svg class="constructor-relation constructor-relation--template">
    <line
      :x1="x1"
      :x2="x2"
      :y1="y1"
      :y2="y2"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LineCoordinates } from '../../lib/constructor';

interface Props {
  coordinates: LineCoordinates;
}

const props = defineProps<Props>();

// Преобразуем координаты в числа, используя 0 по умолчанию для пустых значений
const x1 = computed(() => {
  const val = props.coordinates.x1;
  return typeof val === 'number' ? val : (val === '' ? 0 : Number(val) || 0);
});

const y1 = computed(() => {
  const val = props.coordinates.y1;
  return typeof val === 'number' ? val : (val === '' ? 0 : Number(val) || 0);
});

const x2 = computed(() => {
  const val = props.coordinates.x2;
  return typeof val === 'number' ? val : (val === '' ? 0 : Number(val) || 0);
});

const y2 = computed(() => {
  const val = props.coordinates.y2;
  return typeof val === 'number' ? val : (val === '' ? 0 : Number(val) || 0);
});

</script>

<style lang="scss" scoped>
.constructor-relation {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &--template {
    z-index: 15;

    line {
      stroke: #1976d2;
      fill: transparent;
      stroke-width: 2px;
    }
  }
}
</style>
