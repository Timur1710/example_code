<template>
  <q-card class="operation-details-card">
    <q-card-section class="operation-details-card__tabs-wrapper">
      <q-tabs
        v-model="tab"
        class="operation-details-card__tabs"
        active-color="black"
        indicator-color="black"
        align="left"
        dense
        shrink
      >
        <q-tab name="management" label="Управление" no-caps />
        <q-tab name="scripts" label="Скрипты" no-caps />
      </q-tabs>
    </q-card-section>

    <q-separator />

    <q-card-section class="operation-details-card__content">
      <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade">
        <q-tab-panel name="management" class="operation-details-card__panel">
          <OperationManagementTab :operation="operation" @updated="handleOperationUpdated" />
        </q-tab-panel>

        <q-tab-panel name="scripts" class="operation-details-card__panel">
          <OperationScriptsTab :operation="operation" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { OperationInfoDto } from 'src/entities/operation';
import { OperationManagementTab } from '../management';
import { OperationScriptsTab } from '../scripts';

interface Props {
  operation: OperationInfoDto;
  formatDate: (date?: string | Date) => string;
}

interface Emits {
  (e: 'updated', operation: OperationInfoDto): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const tab = ref<'management' | 'scripts'>('management');

const handleOperationUpdated = (updatedOperation: OperationInfoDto) => {
  emit('updated', updatedOperation);
};
</script>

<style scoped lang="scss">
.operation-details-card {
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
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
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

