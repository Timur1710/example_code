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
      <MaterialForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :material="material"
        :materialTypeOptions="materialTypeOptions"
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

import MaterialForm from './MaterialForm.vue';
import { useMaterialsTypeOptions } from 'src/shared/lib/useMaterialsTypeOptions';
import type {
  CreateMaterialResponse,
  MaterialListItem,
  UpdateMaterialResponse,
} from 'src/entities/material';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  material?: MaterialListItem | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', material: CreateMaterialResponse): void;
  (e: 'updated', material: UpdateMaterialResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  material: null,
  mode: 'create',
});

const { t } = useI18n();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const formRef = ref<InstanceType<typeof MaterialForm>>();
const materialTypeOptions = useMaterialsTypeOptions();
const dialogTitle = computed(() =>
  props.mode === 'edit' ? t('material_modal.edit_material') : t('material_modal.new_material')
);
const iconName = computed(() => (props.mode === 'edit' ? 'edit' : 'add_box'));

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

function handleCreated(material: CreateMaterialResponse) {
  emit('created', material);
  emit('update:modelValue', false);
}

function handleUpdated(material: UpdateMaterialResponse) {
  emit('updated', material);
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
  }
);

watch(
  () => props.productionUnitId,
  (nextId) => {
    if (!nextId && props.modelValue) {
      void closeDialog(true);
    }
  }
);
</script>
