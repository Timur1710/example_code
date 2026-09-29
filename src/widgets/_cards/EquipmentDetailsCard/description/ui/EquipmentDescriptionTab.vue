<template>
  <div class="description-tab">
    <div class="description-tab__columns">
      <!-- Левая колонка — основная информация -->
      <EquipmentBasicInfoBlock
        :equipment="equipment"
        :format-date="formatDate"
      />

      <!-- Правая колонка — дополнительные характеристики -->
      <div  class="description-tab__column description-tab__column--secondary">
        <EquipmentFeaturesBlock
          :equipment-id="equipment?._id"
          :specification="equipment?.specification || {}"
          :is-editing="isFeaturesEditing"
          @update:is-editing="isFeaturesEditing = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { EquipmentListItem } from 'src/entities/equipment';
import { EquipmentFeaturesBlock } from '../features';
import EquipmentBasicInfoBlock from './EquipmentBasicInfoBlock.vue';

 defineProps<{
  equipment: EquipmentListItem;
  formatDate: (date?: string | Date) => string;
}>();

// Состояние редактирования характеристик
const isFeaturesEditing = ref(false);


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
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    column-gap: 64px;
    row-gap: 32px;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      column-gap: 0;
    }
  }

  &__column--secondary {
    min-height: 0;
    display: flex;
  }

  &__title--right {
    text-align: left;
  }

  &__features {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__features-header {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding-bottom: 4px;
  }

  &__feature-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding: 4px 0;
    border-top: 1px solid #f0f0f0;
  }

  &__features-empty {
    margin-top: 12px;
  }

  &__add-feature-btn {
    padding: 0 16px;
    height: 32px;
    font-size: 12px;
    font-weight: 500;
  }
}
</style>
