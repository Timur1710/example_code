<template>
  <div class="equipment-tab">
    <GanttChart
      :operations="planningResult.operations"
      group-by="equipment"
    />
  </div>
</template>

<script setup lang="ts">
import type { PlanningResult } from 'src/stores/planning-selection.store';
import { GanttChart } from 'src/widgets/gantt-chart';

defineProps<{
  planningResult: PlanningResult;
}>();
</script>

<style scoped lang="scss">
.equipment-tab {
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
