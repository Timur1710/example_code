<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    icon="create_new_folder"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <FolderForm
        ref="formRef"
        :mode="mode"
        :selectedNode="selectedNode"
        :parent-node="parentNode"
        :active="modelValue"
        :allowed-types="allowedTypes"
        @create="handleCreate"
        @updated="handleUpdated"
      />
    </template>

    <template #actions>
      <q-btn label="Отмена" flat color="grey" @click="closeDialog" />
      <q-btn
        :label="isEditMode ? 'Изменить' : 'Создать'"
        color="primary"
        :disable="isEditMode ? !formRef?.canSubmit : !formRef?.canSubmit || !formRef?.canCreateNode"
        :loading="formRef?.isSubmitting"
        @click="formRef?.submit()"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import FolderForm from './FolderForm.vue';
import type { ParentNodeInfo, CreateFolderPayload, UpdateFolderPayload } from './types';
import type { ProductionUnitTreeNode } from 'src/entities';
import { ProductionUnitType } from 'src/entities';

interface Props {
  modelValue: boolean;
  parentNode?: ParentNodeInfo | null;
  mode?: 'create' | 'edit';
  selectedNode?: ProductionUnitTreeNode | null;
  allowedTypes?: string[];
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'create', payload: CreateFolderPayload): void;
  (e: 'updeted', payload: UpdateFolderPayload): void;
}

const props = withDefaults(defineProps<Props>(), {
  parentNode: null,
  mode: 'create',
  selectedNode: null,
  allowedTypes: () => [ProductionUnitType.FOLDER],
});

const emit = defineEmits<Emits>();

const formRef = ref<InstanceType<typeof FolderForm>>();
const isEditMode = computed(() => props.mode === 'edit');

const dialogTitle = computed(() => {
  if (isEditMode.value) return 'Переименовать';
  return props.parentNode
    ? `Создать узел в "${props.parentNode.label}"`
    : 'Создать корневой узел';
});

const cardStyle = {
  minWidth: '380px',
  maxWidth: '95vw',
};

function handleCreate(payload: CreateFolderPayload) {
  emit('create', payload);
  emit('update:modelValue', false);
}

function handleUpdated(payload: UpdateFolderPayload) {
  emit('updeted', payload);
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
