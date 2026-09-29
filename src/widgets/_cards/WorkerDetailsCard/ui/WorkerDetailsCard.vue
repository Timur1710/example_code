<template>
  <q-card class="worker-details-card">
    <q-card-section class="worker-details-card__tabs-wrapper">
      <q-tabs
        v-model="tab"
        class="worker-details-card__tabs"
        active-color="black"
        indicator-color="black"
        align="left"
        dense
        shrink
      >
        <q-tab name="description" label="Описание" no-caps />
        <q-tab name="alternatives" label="Альтернативы" no-caps />
        <q-tab name="schedule" label="Графики" no-caps />
      </q-tabs>
    </q-card-section>

    <q-separator />

    <q-card-section class="worker-details-card__content">
      <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade">
        <q-tab-panel name="description" class="worker-details-card__panel">
          <WorkerDescriptionTab :worker="worker" :format-date="formatDate" :format-gender="formatGender" />
        </q-tab-panel>

        <q-tab-panel name="alternatives" class="worker-details-card__panel">
          <WorkerAlternativesTab :worker="worker" />
        </q-tab-panel>

        <q-tab-panel name="schedule" class="worker-details-card__panel">
          <WorkerScheduleTab :worker="worker" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WorkerDetail } from 'src/entities/worker';
import { WorkerDescriptionTab } from '../description';
import { WorkerAlternativesTab } from '../alternatives';
import { WorkerScheduleTab } from '../schedule';

const { worker, formatDate, formatGender } = defineProps<{
  worker: WorkerDetail;
  formatDate: (date?: string | Date) => string;
  formatGender: (gender?: string) => string;
}>();

const tab = ref<'description' | 'alternatives' | 'schedule'>('description');
</script>

<style scoped lang="scss">
.worker-details-card {
  background: white;
  color: black;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;

  &__tabs-wrapper {
    padding: 0;
  }

  &__tabs {
    background: white;
    color: black;

    :deep(.q-tab) {
      min-height: 44px;
      padding: 0 20px;
      font-weight: 500;
      font-size: 13px;
      text-transform: none;
    }

    :deep(.q-tab--active) {
      background: #fff;
      color: #000;
      border-radius: 4px;
    }

    :deep(.q-tabs__content) {
      padding: 8px 16px;
      gap: 16px;
    }
  }

  &__content {
    background: #fff;
    color: #121212;
    padding: 20px;
    flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;
  }

  &__panel {
    padding: 0;
    height: 100%;
  }

}
:deep(.q-tab-panels) {
  height: 100%;
}
</style>

