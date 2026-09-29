<template>
  <div class="materials-tab">
    <GanttChart
      :operations="planningResult.operations"
      :task-groups="planningResult.taskGroups"
      :cell-height="80"
      group-by="finished-goods"
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
.materials-tab {
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
