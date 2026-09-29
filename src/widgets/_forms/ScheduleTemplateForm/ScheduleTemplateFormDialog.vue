<template>
  <DialogWrapper
    :model-value="modelValue"
    :title="breaks_setting_active?breaks_title:dialogTitle"
    :card-style="cardStyle"
    :showClose="false"
    :headerClass="'schedule-template-form-dialog__header'"
    :cardClass="'schedule-template-worker-form-dialog__card'"
    :hideHeaderSeparator="true"
    :actionsClass="'no-px'"
    content-class="schedule-template-form-dialog__content"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <ScheduleTemplateForm
        ref="formRef"
        :schedule-item="scheduleItem"
        :active="modelValue"
        :breaks_setting_active="breaks_setting_active"
        @saved="handleSaved"
        @update_breaks_setting_active="breaks_setting_active = $event"
      />
    </template>

    <template #actions>
      <div v-if="!breaks_setting_active" class="schedule-template-form-dialog__actions">
        <q-btn class="bg-gray" label="Отмена" flat @click="closeDialog" />
        <q-btn
          :label="t('save')"
          color="primary"
          :loading="formRef?.isSubmitting"
          @click="handleSave"
        />
      </div>
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref,watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { DialogWrapper } from 'src/shared/ui';
import ScheduleTemplateForm from './ScheduleTemplateForm.vue';
import type { ScheduleListItem } from 'src/entities/schedule';

interface Props {
  modelValue: boolean;
  scheduleItem?: ScheduleListItem | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  scheduleItem: null,
});

const emit = defineEmits<Emits>();

const formRef = ref<InstanceType<typeof ScheduleTemplateForm>>();
const { t } = useI18n();
const $q = useQuasar();
const breaks_setting_active = ref(false);


function handleSave() {
  const selectedDaysCount = formRef.value?.week_days?.length ?? 0;

  if (selectedDaysCount === 0) {
    $q.notify({
      type: 'negative',
      message: 'Выберите хотя бы 1 день',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  void formRef.value?.submit();
}
const dialogTitle = computed(() =>
  props.scheduleItem ? 'Редактировать график работы' : 'График работы сотрудников',
);
const breaks_title = computed(() => 'Расписание перерывов');
const cardStyle = ref({
  width: '656px',
  maxWidth: '95vw',
});
watch(
  () => breaks_setting_active.value,
  (active) => {
    cardStyle.value = {
      width: !active ? '656px' : '462px',
      maxWidth: '95vw',
    };
  },
);
function handleSaved() {
  emit('saved');
  emit('update:modelValue', false);
}

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
.dialog-wrapper__actions {
   padding-left: 0!important;
   padding-right: 0!important;
}
.schedule-template-form-dialog__actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
:deep(.schedule-template-form-dialog__content) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}
:deep(div.dialog-wrapper__title-row){
 width: 100%!important;
}
</style>
