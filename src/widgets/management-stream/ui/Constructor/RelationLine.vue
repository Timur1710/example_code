<template>
  <path
    :d="relation.d"
    :class="{ 'relation-line--active': relation.active }"
    :style="{ stroke: relation.brg_Color || '#007AFC' }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  />
</template>

<script setup lang="ts">
import type { DrawnRelation } from '../../lib/constructor';

interface Props {
  relation: DrawnRelation;
  edit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  edit: true,
});

const emit = defineEmits<{
  click: [relation: DrawnRelation, event: MouseEvent];
  contextmenu: [relation: DrawnRelation, event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  emit('click', props.relation, event);
}

function handleContextMenu(event: MouseEvent) {
  if (!props.edit) return;
  
  event.preventDefault();
  event.stopPropagation();
  emit('contextmenu', props.relation, event);
}
</script>

<style lang="scss" scoped>
path {
  pointer-events: stroke;
  stroke: #007afc;
  fill: none;
  stroke-width: 2px;
  cursor: pointer;
  transition: stroke 0.3s ease, opacity 0.3s ease-in;

  &:hover {
    stroke: #f44336 !important;
  }

  &.relation-line--active {
    stroke: #f44336 !important;
  }
}
</style>
