<template>
  <div class="description-tab">
    <div class="description-tab__columns">
      <!-- Левая колонка — основная информация -->
      <OperationBasicInfoBlock :operation="operation" :format-date="formatDate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OperationInfoDto } from 'src/entities/operation';
import OperationBasicInfoBlock from './OperationBasicInfoBlock.vue';

defineProps<{
  operation: OperationInfoDto;
  formatDate: (date?: string | Date) => string;
}>();
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
    grid-template-columns: 1fr;
    column-gap: 64px;
    row-gap: 32px;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      column-gap: 0;
    }
  }
}
</style>

