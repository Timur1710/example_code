<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    icon="group"
    :card-style="cardStyle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <UserForm
        ref="formRef"
        :user="user"
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
import UserForm from './UserForm.vue';
import type { UserWithWorker } from 'src/entities/user';

interface Props {
  modelValue: boolean;
  user?: UserWithWorker | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const formRef = ref<InstanceType<typeof UserForm>>();

const dialogTitle = computed(() =>
  props.user ? t('user_modal.edit_user') : t('user_modal.new_user'),
);

const cardStyle = {
  width: '500px',
  maxWidth: '90vw',
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

