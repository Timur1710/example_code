<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="iconName"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <WorkerAlternativesForm
        :exclude-worker-id="excludeWorkerId"
        :preselected-ids="preselectedIds"
        @confirm="handleConfirm"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import WorkerAlternativesForm from './WorkerAlternativesForm.vue';

interface Props {
  modelValue: boolean;
  /** ID текущего работника (чтобы исключить его из списка) */
  excludeWorkerId: string | undefined;
  /** Предварительно выбранные работники */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', selectedIds: string[]): void;
}

withDefaults(defineProps<Props>(), {
  excludeWorkerId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Вычисляемые свойства
const dialogTitle = computed(() => 'Выбор альтернативных работников');
const iconName = computed(() => 'swap_horiz');
const cardStyle = computed(() => ({
  minWidth: '600px',
  minHeight: '500px',
}));

// Обработчики
const handleConfirm = (selectedIds: string[]) => {
  emit('confirm', selectedIds);
  emit('update:modelValue', false);
};
</script>

