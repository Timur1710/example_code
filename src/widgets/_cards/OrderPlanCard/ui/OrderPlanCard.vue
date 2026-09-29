<template>
  <q-card flat bordered class="order-plan-card">
    <q-card-section class="order-plan-card__tabs-wrapper">
      <div class="order-plan-card__tabs-row">
        <q-tabs
          v-model="tab"
          class="order-plan-card__tabs"
          active-color="black"
          indicator-color="black"
          align="left"
          dense
          shrink
        >
          <q-tab name="production" label="Продукция" no-caps />
          <q-tab name="workers" label="Сотрудники" no-caps />
          <q-tab name="materials" label="Материалы" no-caps />
          <q-tab name="equipment" label="Оборудование" no-caps />
          <q-tab name="orders" label="Заказы" no-caps />
        </q-tabs>

        <q-btn-dropdown
          flat
          dense
          no-caps
          color="primary"
          icon="file_download"
          label="Экспорт"
          :loading="isExporting"
          class="order-plan-card__export-btn"
        >
          <q-list dense>
            <q-item clickable v-close-popup @click="handleExport('production_plan')">
              <q-item-section>План производственных работ</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExport('planned_output')">
              <q-item-section>Плановый выпуск продукции</q-item-section>
            </q-item>
            <q-item disable>
              <q-item-section>Потребности в закупке</q-item-section>
              <q-item-section side>
                <q-badge color="grey" label="скоро" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="order-plan-card__content">
      <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade">
        <q-tab-panel name="production" class="order-plan-card__panel">
          <ProductionTab :planning-result="planningResult" />
        </q-tab-panel>

        <q-tab-panel name="workers" class="order-plan-card__panel">
          <WorkersTab :planning-result="planningResult" />
        </q-tab-panel>

        <q-tab-panel name="materials" class="order-plan-card__panel">
          <MaterialsTab :planning-result="planningResult" />
        </q-tab-panel>

        <q-tab-panel name="equipment" class="order-plan-card__panel">
          <EquipmentTab :planning-result="planningResult" />
        </q-tab-panel>

        <q-tab-panel name="orders" class="order-plan-card__panel">
          <OrdersTab :planning-result="planningResult" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import type { PlanningResult } from 'src/stores/planning-selection.store';
import { usePlanningSelectionStore } from 'src/stores/planning-selection.store';
import { planningApi, type ExportType } from 'src/entities/planning';
import { ProductionTab } from '../production';
import { WorkersTab } from '../workers';
import { MaterialsTab } from '../materials';
import { EquipmentTab } from '../equipment';
import { OrdersTab } from '../orders';

defineProps<{
  planningResult: PlanningResult;
}>();

const $q = useQuasar();
const planningStore = usePlanningSelectionStore();
const tab = ref<'production' | 'workers' | 'materials' | 'equipment' | 'orders'>('production');
const isExporting = ref(false);

async function handleExport(exportType: ExportType): Promise<void> {
  if (planningStore.selectedOrderIds.length === 0) return;

  isExporting.value = true;
  try {
    let startFromISO = planningStore.startFrom;
    if (planningStore.startFrom) {
      const localMidnight = new Date(planningStore.startFrom + 'T00:00:00');
      startFromISO = localMidnight.toISOString();
    }

    const params: Parameters<typeof planningApi.exportPlanXlsx>[0] = {
      orderIds: planningStore.selectedOrderIds,
      planningType: planningStore.planningType,
      startFrom: startFromISO,
      exportType,
    };
    if (planningStore.planningMode !== 'standard') {
      params.planningMode = planningStore.planningMode;
    }
    if (planningStore.orderBatchingPeriodDays > 0) {
      params.orderBatchingPeriodDays = planningStore.orderBatchingPeriodDays;
    }

    const { blob, filename } = await planningApi.exportPlanXlsx(params);

    // Скачивание файла
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    $q.notify({ type: 'positive', message: 'Файл экспортирован' });
  } catch (e) {
    console.error('Export failed:', e);
    $q.notify({ type: 'negative', message: 'Ошибка при экспорте' });
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped lang="scss">
.order-plan-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;

  &__tabs-wrapper {
    padding: 0;
  }

  &__tabs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__export-btn {
    margin-right: 12px;
    flex-shrink: 0;
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
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

:deep(.q-tab-panels) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

:deep(.q-tab-panel) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
