<template>
  <div class="description-tab__column">
    <div class="description-tab__title">
      {{ t('basic_information') }}
      <q-btn v-if="!isEditing" icon="edit" flat dense round color="primary" @click="editModeStart">
        <q-tooltip>{{ t('edit') }}</q-tooltip>
      </q-btn>
    </div>

    <template v-if="isEditing">
      <MaterialForm
        :production-unit-id="material.p_id"
        :material="selectedMaterial"
        :materialTypeOptions="materialTypeOptions"
        mode="edit"
        :active="isEditing"
        show-actions
        @updated="onMaterialUpdated"
        @close="editModeStop"
      />
    </template>

    <template v-else>
      <div class="description-tab__info-list">
        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('material_modal.material_name') }}</div>
          <div class="text-body1">{{ material.name }}</div>
        </div>

        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('material_modal.material_type') }}</div>
          <div class="text-body1">{{ t(`material_modal.${material.type}`) }}</div>
        </div>

        <div
          v-if="material.type === 'raw_material' && deliveryTermValue != null"
          class="description-tab__info-item"
        >
          <div class="text-caption text-grey-7">{{ t('material_modal.delivery_time') }}</div>
          <div class="text-body1">
            {{ deliveryTermValue }}
            <span class="text-grey-7 q-ml-xs">{{ deliveryTermUnit }}</span>
          </div>
        </div>

        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('material_modal.сurrent_stock') }}</div>
          <div class="text-body1">
            {{ material.totalQuantity ?? 0 }}
            <span v-if="material.batchCount && material.batchCount > 1" class="text-grey-6 q-ml-xs">
              ({{ material.batchCount }} партий)
            </span>
            <span v-if="material.measure" class="text-grey-7 q-ml-xs">
              {{ t(`measurement_units.${material.measure}`) }}
            </span>
          </div>
        </div>

        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('updated') }}</div>
          <div class="text-body1">
            {{ formattedUpdatedAt }}
          </div>
        </div>

        <div
          v-if="material.description"
          class="description-tab__info-item description-tab__info-item--description"
        >
          <div class="text-caption text-grey-7">{{ t('description') }}</div>
          <div class="text-body1">
            {{ material.description }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref,onMounted } from 'vue';
import { MaterialForm } from 'src/widgets';
import { type MaterialListItem, useMaterialStore } from 'src/entities/material';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMaterialsTypeOptions } from 'src/shared/lib/useMaterialsTypeOptions';

interface Props {
  material: MaterialListItem;
  formatDate: (date?: string | Date) => string;
}

const materialStore = useMaterialStore();
const { selectedMaterial } = storeToRefs(materialStore);

interface Emits {
  (e: 'updated', material: MaterialListItem): void;
  (e: 'edit-mode-change', isEditing: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {});

const { t } = useI18n();
const emit = defineEmits<Emits>();
const { materialStream } = storeToRefs(materialStore);
const isEditing = ref(false);
const materialTypeOptions = useMaterialsTypeOptions();
const editModeStart = () => {
  isEditing.value = true;
};
const formattedUpdatedAt = computed(() =>
  props.formatDate(props.material.updatedAt || props.material.createdAt)
);

const deliveryTermValue = computed(() => {
  const val = props.material.delivery_term;
  if (val == null || val === '') return null;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
});

function getDaysUnit(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return t('material_modal.days_1');
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return t('material_modal.days_2_4');
  return t('material_modal.days_5_20');
}

const deliveryTermUnit = computed(() => {
  const val = deliveryTermValue.value;
  if (val == null) return '';
  const num = typeof val === 'number' ? val : Number(val);
  return Number.isNaN(num) ? t('material_modal.in_days') : getDaysUnit(num);
});

const editModeStop = () => {
  isEditing.value = false;
};
async function onMaterialUpdated(material: MaterialListItem): Promise<void> {
  emit('updated', material);
  await materialStore.fetchMaterialById(material._id);
  editModeStop();
}
onMounted(() => {
    const rawMaterialOption = materialTypeOptions.value.find(option => option.value === 'raw_material');
    if(rawMaterialOption) {
      if(materialStream.value) {
        rawMaterialOption.label = rawMaterialOption.label + ' (нельзя выбрать, так как материал связан с потоком)';
        rawMaterialOption.disable = true;
      } else {
        rawMaterialOption.label = t('material_modal.raw_material');
        rawMaterialOption.disable = false;
      }
    }
});
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
