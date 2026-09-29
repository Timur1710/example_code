<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="iconName"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <MaterialAlternativesForm
        :exclude-material-id="excludeMaterialId"
        :preselected-ids="preselectedIds"
        @confirm="handleConfirm"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import MaterialAlternativesForm from './MaterialAlternativesForm.vue';

interface Props {
  modelValue: boolean;
  /** ID текущего материала (чтобы исключить его из списка) */
  excludeMaterialId: string | undefined;
  /** Предварительно выбранные материалы */
  preselectedIds: string[] | undefined;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', selectedIds: string[]): void;
}

withDefaults(defineProps<Props>(), {
  excludeMaterialId: undefined,
  preselectedIds: () => [],
});

const emit = defineEmits<Emits>();

// Вычисляемые свойства
const dialogTitle = computed(() => 'Выбор альтернативных материалов');
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
