<template>
  <div class="description-tab__column">
    <div class="description-tab__title">
      {{ t('basic_information') }}
      <q-btn
        v-if="!isEditing"
        icon="edit"
        flat
        dense
        round
        color="primary"
        @click="editModeStart"
      >
        <q-tooltip>{{ t('edit') }}</q-tooltip>
      </q-btn>
    </div>

    <template v-if="isEditing">
      <EquipmentForm
        :production-unit-id="equipment.p_id"
        :equipment="selectedEquipment"
        mode="edit"
        :active="isEditing"
        show-actions
        @updated="onEquipmentUpdated"
        @close="editModeStop"
      />
    </template>

    <template v-else>
      <div class="description-tab__info-list">
        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('equipment_modal.equipment_name') }}</div>
          <div class="text-body1">{{ equipment.name }}</div>
        </div>

        <div class="description-tab__info-item" v-if="equipment.amount">
          <div class="text-caption text-grey-7">{{ t('quantity') }}</div>
          <div class="text-body1">
            {{ equipment.amount }}
            <span v-if="equipment.measure" class="text-grey-7 q-ml-xs">
              {{ t(`measurement_units.${equipment.measure}`) }}
            </span>
          </div>
        </div>

        <div
          v-if="equipment.description"
          class="description-tab__info-item description-tab__info-item--description"
        >
          <div class="text-caption text-grey-7">{{ t('description') }}</div>
          <div class="text-body1">
            {{ equipment.description }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EquipmentForm } from 'src/widgets';
import { type EquipmentListItem, useEquipmentStore } from 'src/entities/equipment';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

interface Props {
  equipment: EquipmentListItem;
  formatDate: (date?: string | Date) => string;
}

const equipmentStore = useEquipmentStore();
const { selectedEquipment } = storeToRefs(equipmentStore);

interface Emits {
  (e: 'updated', equipment: EquipmentListItem): void;
  (e: 'edit-mode-change', isEditing: boolean): void;
}

 withDefaults(defineProps<Props>(), {});

const { t } = useI18n()
const emit = defineEmits<Emits>();
const isEditing = ref(false)

const editModeStart = () => {
  isEditing.value = true;
}

const editModeStop = () => {
  isEditing.value = false;
}
async function onEquipmentUpdated(equipment: EquipmentListItem): Promise<void> {
  emit('updated', equipment);
  await equipmentStore.fetchEquipmentById(equipment._id)
  editModeStop();
}
</script>

<style scoped lang="scss">
.description-tab {
  &__column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &--description {
      margin-top: 8px;
    }
  }
}
</style>
