<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="iconName"
    :card-style="cardStyle"
    :showClose="false"
    isProductionItemForm
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <BatchForm
        ref="formRef"
        :entity-id="entityId"
        :entity-type="entityType"
        :batch="batch"
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
import { DialogWrapper } from 'src/shared/ui';
import BatchForm from './BatchForm.vue';
import type { CreateBatchResponse, UpdateBatchResponse, BatchListItem } from 'src/entities/batch';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: boolean;
  entityId: string;
  entityType?: string;
  batch?: BatchListItem | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', batch: CreateBatchResponse): void;
  (e: 'updated', batch: UpdateBatchResponse): void;
}

const props = withDefaults(defineProps<Props>(), {
  entityType: 'Material',
  mode: 'create',
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const formRef = ref();

const dialogTitle = computed(() =>
  props.mode === 'create' ? t('add_batch') : t('batch_form.edit_batch')
);

const iconName = computed(() => (props.mode === 'create' ? 'add' : 'edit'));

const cardStyle = computed(() => ({
  minWidth: '600px',
  maxWidth: '800px',
}));

function closeDialog() {
  emit('update:modelValue', false);
}

function handleCreated(batch: CreateBatchResponse) {
  emit('created', batch);
  closeDialog();
}

function handleUpdated(batch: UpdateBatchResponse) {
  emit('updated', batch);
  closeDialog();
}

// Watch for mode changes to reset form if needed
watch(
  () => props.mode,
  () => {
    if (formRef.value?.reset) {
      formRef.value.reset();
    }
  }
);
</script>
