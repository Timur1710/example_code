<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="dialogTitle"
    :card-style="cardStyle"
    :hideActions="schedule_cycle"
    :hideHeaderSeparator="true"
    :showClose="false"
    content-class="ppr-form-dialog__content"
    card-class="schedule_popup"
    actions-class="schedule_popup__actions"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <PprForm
        ref="formRef"
        :equipment-id="equipmentId"
        :schedule-item="scheduleItem"
        :active="modelValue"
        :schedule_cycle="schedule_cycle"
        @saved="handleSaved"
        @disable_save_btn="disable_save_btn = $event"
        @setting_schedule_cycle="setting_schedule_cycle"
        @show_schedule_setting="schedule_cycle = $event"
      />
    </template>
    <template #actions>
      <q-btn class="grey_button" :label="t('cancel')" flat @click="closeDialog" />
      <q-space />
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
import PprForm from './PprForm.vue';
import type { EquipmentSchedule } from 'src/entities/schedule';
import type { ScheduleFormData } from 'src/shared/templates';

interface Props {
  modelValue: boolean;
  equipmentId: string;
  /** Расписание для редактирования */
  scheduleItem?: EquipmentSchedule | null;
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

const formRef = ref<InstanceType<typeof PprForm>>();
const disable_save_btn = ref(true);
const schedule_cycle = ref(false);
const dialogTitle = computed(() => {
  if (!schedule_cycle.value) {
    return props.scheduleItem ? t('ppr_form.edit_ppr') : t('ppr_form.new_ppr');
  } else {
    return 'Настройка повторяемости обслуживания';
  }
});

const cardStyle = {
  width: '500px',
  maxWidth: '95vw',
};
const settingFormData = ref<ScheduleFormData | null>(null);

function setting_schedule_cycle(formData: ScheduleFormData) {
  schedule_cycle.value = true;
  settingFormData.value = formData;
  return formData;
}
function handleSaved() {
  closeDialog();
  emit('saved');
  emit('update:modelValue', false);
}

function closeDialog() {
  schedule_cycle.value = false;
  emit('update:modelValue', false);
}
</script>
<style scoped lang="scss">
.grey_button {
  background-color: var(--gray);
}

:deep(.ppr-form-dialog__content) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}
</style>
