<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="iconName"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <EquipmentAlternativesForm
        :exclude-equipment-id="excludeEquipmentId"
        :preselected-ids="preselectedIds"
        @confirm="handleConfirm"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import EquipmentAlternativesForm from './EquipmentAlternativesForm.vue';

interface Props {
  modelValue: boolean;
  /** ID текущего оборудования (чтобы исключить его из списка) */
  excludeEquipmentId: string | undefined;
  /** Предварительно выбранное оборудование */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', selectedIds: string[]): void;
}

withDefaults(defineProps<Props>(), {
  excludeEquipmentId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Вычисляемые свойства
const dialogTitle = computed(() => 'Выбор альтернативного оборудования');
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
