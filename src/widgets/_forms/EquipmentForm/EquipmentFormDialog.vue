<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="iconName"
    :card-style="cardStyle"
    isProductionItemForm
    @update:model-value="handleDialogModelUpdate"
  >
    <template #content>
      <EquipmentForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :equipment="equipment"
        :mode="mode"
        :active="modelValue"
        :show-actions="true"
        :on-close="closeDialog"
        @created="handleCreated"
        @updated="handleUpdated"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DialogWrapper, closeDialogWithWarnings } from 'src/shared/ui';
import { useQuasar } from 'quasar';
import EquipmentForm from './EquipmentForm.vue';
import type {
  CreateEquipmentResponse,
  EquipmentListItem,
  UpdateEquipmentResponse,
} from 'src/entities/equipment';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  equipment?: EquipmentListItem | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', equipment: CreateEquipmentResponse): void;
  (e: 'updated', equipment: UpdateEquipmentResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  equipment: null,
  mode: 'create',
});

const emit = defineEmits<Emits>();
const $q = useQuasar();
const formRef = ref<InstanceType<typeof EquipmentForm>>();

const isEditMode = computed(() => props.mode === 'edit');
const dialogTitle = computed(() =>
  isEditMode.value ? 'Редактировать оборудование' : 'Новое оборудование',
);
const iconName = computed(() => (isEditMode.value ? 'edit' : 'precision_manufacturing'));

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

function handleCreated(equipment: CreateEquipmentResponse) {
  emit('created', equipment);
  emit('update:modelValue', false);
}

function handleUpdated(equipment: UpdateEquipmentResponse) {
  emit('updated', equipment);
  emit('update:modelValue', false);
}
function handleDialogModelUpdate(value: boolean) {
  if (value) {
    emit('update:modelValue', true);
    return;
  }
  void closeDialog();
}

function closeDialog(force = false): Promise<void> | void {
  return closeDialogWithWarnings({
    force,
    hasFilledFields: Boolean(formRef.value?.hasFilledFields),
    emit,
    $q,
  });
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      formRef.value?.reset();
    }
  },
);

watch(
  () => props.productionUnitId,
  (nextId) => {
    if (!nextId && props.modelValue) {
      void closeDialog(true);
    }
  },
);
</script>


