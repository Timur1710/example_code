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
      <StreamForm
        ref="formRef"
        :production-unit-id="productionUnitId"
        :mode="mode"
        :active="modelValue"
        :show-actions="true"
        :on-close="closeDialog"
        @submit="handleSubmit"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DialogWrapper, closeDialogWithWarnings } from 'src/shared/ui';
import { useQuasar } from 'quasar';

import StreamForm from './StreamForm.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: boolean;
  productionUnitId: string | null;
  mode?: 'create' | 'edit';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: { name: string; materialIds: string[] }): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
});

const { t } = useI18n();
const emit = defineEmits<Emits>();
const $q = useQuasar();

const formRef = ref<InstanceType<typeof StreamForm>>();

const dialogTitle = computed(() =>
  props.mode === 'edit' ? t('stream_form.edit_stream') : t('stream_form.new_stream')
);
const iconName = computed(() => (props.mode === 'edit' ? 'edit' : 'add_box'));

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

function handleSubmit(data: { name: string; materialIds: string[] }): void {
  emit('submit', data);
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
