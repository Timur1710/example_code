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
      <WorkerForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :worker="worker"
        :mode="mode"
        :active="modelValue"
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
import WorkerForm from './WorkerForm.vue';
import type {
  CreateWorkerResponse,
  UpdateWorkerResponse,
  WorkerListItem,
} from 'src/entities/worker';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  worker?: WorkerListItem | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', worker: CreateWorkerResponse): void;
  (e: 'updated', worker: UpdateWorkerResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  worker: null,
  mode: 'create',
});
const $q = useQuasar();
const emit = defineEmits<Emits>();

const formRef = ref<InstanceType<typeof WorkerForm>>();

const isEditMode = computed(() => props.mode === 'edit');
const dialogTitle = computed(() =>
  isEditMode.value ? 'Редактировать работника' : 'Новый работник'
);
const iconName = computed(() => (isEditMode.value ? 'edit' : 'person_add'));

const cardStyle = {
  minWidth: '700px',
  maxWidth: '95vw',
};

function handleCreated(worker: CreateWorkerResponse) {
  emit('created', worker);
  emit('update:modelValue', false);
}

function handleUpdated(worker: UpdateWorkerResponse) {
  emit('updated', worker);
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
    if (!nextId && props.modelValue && !isEditMode.value) {
      void closeDialog(true);
    }
  }
);
</script>
<style scoped>
.btn-width {
  width: 100px;
}
</style>
