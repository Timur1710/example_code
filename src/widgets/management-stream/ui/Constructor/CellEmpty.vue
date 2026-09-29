<template>
  <div
    class="constructor-cell-empty"
    :class="{ 'constructor-cell-empty--active': classActive }"
    :style="cellStyle"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '../../lib/constructor';

interface Props {
  position: Position;
  classActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  classActive: false,
});

const emit = defineEmits<{
  click: [position: Position];
}>();

const ITEM_SIZE = 100;
const ITEM_MARGIN = 15;

const cellStyle = computed(() => {
  const [col, row] = props.position;
  return {
    left: `${col * ITEM_SIZE + ITEM_MARGIN * 2 * col}px`,
    top: `${row * ITEM_SIZE + ITEM_MARGIN * 2 * row}px`,
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
  };
});

function handleClick() {
  emit('click', props.position);
}
</script>

<style lang="scss" scoped>
.constructor-cell-empty {
  position: absolute;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;

  &:hover {
    border-color: #1976d2;
    background: rgba(25, 118, 210, 0.05);
  }

  &--active {
    border-color: #1976d2;
    background: rgba(25, 118, 210, 0.1);
  }
}
</style>
