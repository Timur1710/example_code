<template>
  <div class="management-tab">
    <div class="management-tab__sections">
      <!-- Блок 1: Основные параметры -->
      <OperationMainParamsBlock :operation="operation" @updated="handleOperationUpdated" />

      <!-- Блок 2: Управление ресурсами -->
      <OperationResourcesManager :operation="operation" @updated="handleOperationUpdated" />

      <!-- Блок 3: Дополнительные параметры -->
      <OperationAdvancedParamsBlock :operation="operation" @updated="handleOperationUpdated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OperationInfoDto } from 'src/entities/operation';
import OperationMainParamsBlock from './OperationMainParamsBlock.vue';
import { OperationResourcesManager } from '../resources';
import OperationAdvancedParamsBlock from './OperationAdvancedParamsBlock.vue';

interface Props {
  operation: OperationInfoDto;
}

interface Emits {
  (e: 'updated', operation: OperationInfoDto): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleOperationUpdated = (updatedOperation: OperationInfoDto) => {
  emit('updated', updatedOperation);
};
</script>

<style scoped lang="scss">
.management-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}
</style>
