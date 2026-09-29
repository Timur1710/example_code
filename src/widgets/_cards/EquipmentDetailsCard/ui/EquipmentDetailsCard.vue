<template>
  <q-card class="equipment-details-card">
    <q-card-section class="equipment-details-card__tabs-wrapper">
      <q-tabs
        v-model="tab"
        class="equipment-details-card__tabs"
        active-color="black"
        indicator-color="black"
        align="left"
        dense
        shrink
      >
        <q-tab name="description" label="Описание" no-caps />
        <q-tab name="alternatives" label="Альтернативы" no-caps />
        <q-tab name="ppr" label="ППР" no-caps />
      </q-tabs>
    </q-card-section>

    <q-separator />

    <q-card-section class="equipment-details-card__content">
      <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade">
        <q-tab-panel name="description" class="equipment-details-card__panel">
          <EquipmentDescriptionTab :equipment="equipment" :format-date="formatDate" />
        </q-tab-panel>

        <q-tab-panel name="alternatives" class="equipment-details-card__panel">
          <EquipmentAlternativesTab :equipment="equipment" />
        </q-tab-panel>

        <q-tab-panel name="ppr" class="equipment-details-card__panel">
          <PprTab :equipment="equipment" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { EquipmentListItem } from 'src/entities/equipment';
import { EquipmentDescriptionTab } from '../description';
import { EquipmentAlternativesTab } from '../alternatives';
import { PprTab } from '../ppr';

const { equipment, formatDate } = defineProps<{
  equipment: EquipmentListItem;
  formatDate: (date?: string | Date) => string;
}>();

const tab = ref<'description' | 'alternatives' | 'ppr'>('description');
</script>

<style scoped lang="scss">
.equipment-details-card {
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
