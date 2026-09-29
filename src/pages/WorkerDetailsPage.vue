<template>
  <DetailsPageTemplate
    :title="workerTitle"
    :subtitle="'Сотрудник'"
    :detailsError="detailsError"
    :item="worker"
    :isDetailsLoading="isDetailsLoading"
    :fetchItemById="(id) => workerStore.fetchWorkerById(id)"
    :clearSelectedItem="() => workerStore.clearSelectedWorker()"
  >
    <template #details-card>
      <WorkerDetailsCard
        v-if="worker"
        :worker="worker"
        :format-date="formatDate"
        :format-gender="formatGender"
        class="worker-details-page__content"
      />
    </template>
  </DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { formatGender } from 'src/shared/utils';
import { useWorkerStore } from 'src/entities/worker';
import { WorkerDetailsCard } from 'src/widgets/_cards/WorkerDetailsCard';
import { DetailsPageTemplate, formatDate } from 'src/shared/templates/DetailsPageTemplate';
defineOptions({
  name: 'WorkerDetailsPage',
});

const workerStore = useWorkerStore();
const { selectedWorker, isWorkerDetailsLoading, workerDetailsError } = storeToRefs(workerStore);
const worker = computed(() => selectedWorker.value);
const workerTitle = computed(() => worker.value?.name || 'Загрузка...');
const isDetailsLoading = computed(() => isWorkerDetailsLoading.value);
const detailsError = computed(() => workerDetailsError.value);
</script>
