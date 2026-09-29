<template>
  <div v-if="materials.length > 0" class="order-info-modal-materials">
    <div class="text-subtitle1 q-mb-md">{{ title }}</div>
    <div class="order-info-modal-materials__list">
      <div
        v-for="mat in materials"
        :key="mat.materialId"
        class="order-info-modal-materials__item"
      >
        <q-icon name="inventory_2" size="18px" color="primary" />
        <span class="order-info-modal-materials__name">{{ mat.name }}</span>
        <span class="order-info-modal-materials__qty">
          {{ formatQuantityWithMeasure(mat.quantity, mat.measure) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatQuantityWithMeasure } from 'src/shared/utils/measure';

export interface OrderMaterialDisplay {
  materialId: string;
  name: string;
  quantity: number;
  measure?: string | undefined;
}

defineProps<{
  materials: OrderMaterialDisplay[];
  title?: string;
}>();
</script>

<style lang="scss" scoped>
.order-info-modal-materials {
  padding: 12px 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #bbdefb;

  &__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  &__name {
    color: #424242;
    flex: 1;
  }

  &__qty {
    font-weight: 600;
    color: #1565c0;
  }
}
</style>
