<template>
  <div class="production-tab">
    <div class="text-h6">{{ t('gantt_diagram.title') }}</div>
    <div class="text-caption text-grey-7 q-mb-md">
      {{ t('gantt_diagram.description') }}
    </div>

    <div class="production-tab__gantt">
      <GanttChart
        :operations="planningResult.operations"
        :task-groups="planningResult.taskGroups"
        :cell-height="80"
        :cell-width="50"
        :scale="60"
      />
    </div>

    <q-list
      v-if="hasAdditionalInfo"
      bordered
      class="rounded-borders q-mt-md production-tab__additional-info"
    >
      <AdditionalInfoExpansion
        :info-messages="planningResult.summary.infoMessages ?? []"
        :warnings="planningResult.summary.warnings"
      />
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GanttChart } from 'src/widgets';
import type { PlanningResult } from 'src/stores/planning-selection.store';
import AdditionalInfoExpansion from './AdditionalInfoExpansion.vue';

const props = defineProps<{
  planningResult: PlanningResult;
}>();

const { t } = useI18n();

const hasAdditionalInfo = computed(
  () =>
    (props.planningResult.summary.infoMessages?.length ?? 0) > 0 ||
    props.planningResult.summary.warnings.length > 0
);
</script>

<style scoped lang="scss">
.production-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;

  &__gantt {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
