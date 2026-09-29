<template>
  <DialogWrapper
    :model-value="modelValue"
    title="Массовое создание работников"
    icon="group_add"
    :card-style="cardStyle"
    isProductionItemForm
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <BulkWorkerForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :default-name="defaultName"
        :active="modelValue"
        :on-close="closeDialog"
        @created="handleCreated"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import BulkWorkerForm from './BulkWorkerForm.vue';
import type { CreateWorkerResponse } from 'src/entities/worker';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  defaultName?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', workers: CreateWorkerResponse[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  defaultName: '',
});

const emit = defineEmits<Emits>();
const formRef = ref<InstanceType<typeof BulkWorkerForm>>();

const cardStyle = {
  minWidth: '500px',
  maxWidth: '95vw',
};

function handleCreated(workers: CreateWorkerResponse[]) {
  emit('created', workers);
  emit('update:modelValue', false);
}

function closeDialog() {
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      formRef.value?.reset();
    }
  },
);
</script>
