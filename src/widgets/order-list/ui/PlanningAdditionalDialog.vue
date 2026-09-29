<template>
  <DialogWrapper
    :model-value="modelValue"
    title="Дополнительные настройки планирования"
    icon="tune"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <div class="planning-additional-dialog__form">
        <q-select
          v-model="selectedMode"
          :options="planningModeOptions"
          label="Режим планирования"
          dense
          filled
          outlined
          emit-value
          map-options
          class="planning-additional-dialog__field"
        />
        <div class="planning-additional-dialog__batching-row">
          <span class="planning-additional-dialog__batching-label"
            >Объединение заказов в партии, в периоде</span
          >
          <q-input
            v-model.number="orderBatchingPeriodDays"
            type="number"
            dense
            filled
            outlined
            min="0"
            class="planning-additional-dialog__field planning-additional-dialog__batching-input"
          />
          <span class="planning-additional-dialog__batching-suffix">дней</span>
        </div>
      </div>
    </template>

    <template #actions>
      <q-btn flat label="Закрыть" @click="closeDialog" />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import { usePlanningSelectionStore } from 'src/stores/planning-selection.store';
import type { PlanningMode } from 'src/entities/order/model/order.types';

defineOptions({
  name: 'PlanningAdditionalDialog',
});

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const planningStore = usePlanningSelectionStore();

const planningModeOptions: Array<{ label: string; value: PlanningMode }> = [
  { label: 'Стандартный', value: 'standard' },
  { label: 'Оценка потребности в закупках', value: 'purchase_assessment' },
  { label: 'Фактическая обеспеченность', value: 'actual_availability' },
];

const selectedMode = ref<PlanningMode>(planningStore.planningMode);
const orderBatchingPeriodDays = ref<number>(planningStore.orderBatchingPeriodDays);

watch(selectedMode, (newMode) => {
  planningStore.setPlanningMode(newMode);
});

watch(orderBatchingPeriodDays, (days) => {
  planningStore.setOrderBatchingPeriodDays(Number.isFinite(days) ? days : 0);
});

const cardStyle = {
  width: '450px',
  maxWidth: '90vw',
};

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.planning-additional-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.planning-additional-dialog__field {
  min-width: 0;
}

.planning-additional-dialog__batching-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.planning-additional-dialog__batching-label {
  flex-shrink: 0;
  color: var(--q-dark);
}

.planning-additional-dialog__batching-input {
  flex: 0 0 auto;
  width: 80px;
}

.planning-additional-dialog__batching-suffix {
  flex-shrink: 0;
  color: var(--q-dark);
}
</style>
