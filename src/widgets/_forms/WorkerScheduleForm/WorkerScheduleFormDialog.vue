<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    icon=""
    :card-style="cardStyle"
    :showClose="false"
    :headerClass="'worker-schedule-form-dialog__header'"
    content-class="worker-schedule-form-dialog__content"
    :actionsClass="'q-pt-none worker-schedule-form-dialog__actions'"
    :actions-align="'between'"
    :hideHeaderSeparator="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <WorkerScheduleForm
        ref="formRef"
        :worker-id="workerId"
        :schedule-item="scheduleItem"
        :active="modelValue"
        @saved="handleSaved"
      />
    </template>

    <template #actions>
      <q-btn :label="t('cancel')" flat @click="closeDialog" />
      <q-btn
        :label="t('save')"
        color="primary"
        :loading="formRef?.isSubmitting"
        @click="formRef?.submit()"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DialogWrapper } from 'src/shared/ui';
import WorkerScheduleForm from './WorkerScheduleForm.vue';
import type { WorkerSchedule } from 'src/entities/schedule';

interface Props {
  modelValue: boolean;
  workerId: string;
  /** Расписание для редактирования */
  scheduleItem?: WorkerSchedule | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleItem: null,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const formRef = ref<InstanceType<typeof WorkerScheduleForm>>();

const dialogTitle = computed(() =>
  props.scheduleItem ? 'Редактировать график отсутствия' : 'График отсутствия',
);

const cardStyle = {
  width: '462px',
  maxWidth: '95vw',
};

function handleSaved() {
  emit('saved');
  emit('update:modelValue', false);
}

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
:deep(.worker-schedule-form-dialog__content) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}
</style>

