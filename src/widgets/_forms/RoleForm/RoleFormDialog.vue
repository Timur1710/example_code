<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    icon="admin_panel_settings"
    :card-style="cardStyle"
    content-class="role-form-dialog__content"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <RoleForm
        ref="formRef"
        :role="role"
        :active="modelValue"
        @saved="handleSaved"
      />
    </template>

    <template #actions>
      <q-btn
        :label="t('save')"
        color="primary"
        :loading="formRef?.isSubmitting"
        @click="formRef?.submit()"
      />
      <q-btn :label="t('cancel')" flat @click="closeDialog" />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DialogWrapper } from 'src/shared/ui';
import RoleForm from './RoleForm.vue';
import type { Role } from 'src/entities/role';

interface Props {
  modelValue: boolean;
  role?: Role | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const formRef = ref<InstanceType<typeof RoleForm>>();

const dialogTitle = computed(() =>
  props.role ? t('role_modal.edit_role') : t('role_modal.new_role'),
);

const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

function handleSaved() {
  emit('saved');
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

<style scoped lang="scss">
:deep(.role-form-dialog__content) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}
</style>

