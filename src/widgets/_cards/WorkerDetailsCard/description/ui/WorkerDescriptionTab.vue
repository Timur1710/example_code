<template>
  <div class="description-tab">
    <div class="description-tab__columns">
      <!-- Левая колонка — основная информация -->
      <WorkerBasicInfoBlock
        :worker="worker"
        :format-date="formatDate"
        :format-gender="formatGender"
        @updated="handleWorkerUpdated"
      />

      <!-- Правая колонка — дополнительные характеристики -->
      <div  class="description-tab__column description-tab__column--secondary">
        <WorkerFeaturesBlock
          :worker-id="worker?._id"
          :feature="worker?.feature || []"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkerDetail } from 'src/entities/worker';
import { WorkerFeaturesBlock } from '../features';
import WorkerBasicInfoBlock from './WorkerBasicInfoBlock.vue';
import { useWorkerStore } from 'src/entities/worker';

 defineProps<{
  worker: WorkerDetail;
  formatDate: (date?: string | Date) => string;
  formatGender: (gender?: string) => string;
}>();

const workerStore = useWorkerStore();

const handleWorkerUpdated = async (updatedWorker: WorkerDetail) => {
  // Обновляем данные работника через store
  await workerStore.fetchWorkerById(updatedWorker._id);
};
</script>

<style scoped lang="scss">
.description-tab {
  flex: 1;
  display: flex;
  min-height: 0;
  &__columns {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    column-gap: 64px;
    row-gap: 32px;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      column-gap: 0;
    }
  }

  &__column--secondary {
    min-height: 0;
    display: flex;
  }

  &__title--right {
    text-align: left;
  }

  &__features {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__features-header {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding-bottom: 4px;
  }

  &__feature-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding: 4px 0;
    border-top: 1px solid #f0f0f0;
  }

  &__features-empty {
    margin-top: 12px;
  }

  &__add-feature-btn {
    padding: 0 16px;
    height: 32px;
    font-size: 12px;
    font-weight: 500;
  }
}
</style>

