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
      <OperationForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :operation="operation"
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
import { useQuasar } from 'quasar';
import { DialogWrapper, closeDialogWithWarnings } from 'src/shared/ui';
import OperationForm from './OperationForm.vue';
import type {
  CreateOperationResponse,
  OperationListItem,
  UpdateOperationResponse,
} from 'src/entities/operation';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  operation?: OperationListItem | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', operation: CreateOperationResponse): void;
  (e: 'updated', operation: UpdateOperationResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  operation: null,
  mode: 'create',
});

const { t } = useI18n();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const formRef = ref<InstanceType<typeof OperationForm>>();

const dialogTitle = computed(() =>
  props.mode === 'edit' ? t('operation_modal.edit_operation') : t('operation_modal.new_operation')
);
const iconName = computed(() => (props.mode === 'edit' ? 'edit' : 'add_box'));

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

function handleCreated(operation: CreateOperationResponse) {
  emit('created', operation);
  emit('update:modelValue', false);
}

function handleUpdated(operation: UpdateOperationResponse) {
  emit('updated', operation);
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
