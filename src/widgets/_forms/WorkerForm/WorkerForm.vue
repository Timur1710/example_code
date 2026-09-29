<template>
  <q-form ref="formRef" class="worker-form" @submit.prevent="submit">
    <q-input
      v-model="formData.name"
      outlined
      dense
      label="Имя"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      @keyup.enter="submit"
    />
    <q-select
      v-model="formData.scheduleTemplateId"
      outlined
      dense
      :label="t('graph')"
      :options="scheduleOptions"
      emit-value
      map-options
      hide-bottom-space
    />
    <q-input
      v-model="formData.description"
      outlined
      :label="t('description')"
      type="textarea"
      autogrow
      counter
      maxlength="1000"
      :disable="isFormBusy"
      class="custom-textarea"
    />

    <div v-if="showActions" class="worker-form__actions">
      <q-btn :label="t('cancel')" flat color="grey" @click="() => props.onClose?.()" class="custom-btn" />
      <q-btn
        :label="submitLabel"
        color="primary"
        :disable="isSubmitDisabled"
        :loading="isSubmitting"
        @click="submit"
        class="custom-btn"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { QForm, useQuasar } from 'quasar';
import {
  workerApi,
  type CreateWorkerRequest,
  type CreateWorkerResponse,
  type UpdateWorkerRequest,
  type UpdateWorkerResponse,
  type WorkerListItem,
} from 'src/entities/worker';
// import { useScheduleOptions } from 'src/shared/lib/useScheduleOptions';
// import type { ScheduleCode } from 'src/shared/constants/schedule';
import { useScheduleStore } from 'src/entities/schedule';
import { useI18n } from 'vue-i18n';

interface Props {
  productionUnitId: string | null;
  worker?: WorkerListItem | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия диалога */
  onClose?: () => void;
}

interface Emits {
  (e: 'created', worker: CreateWorkerResponse): void;
  (e: 'updated', worker: UpdateWorkerResponse): void;
}

const { t } = useI18n();
const props = withDefaults(defineProps<Props>(), {
  worker: null,
  mode: 'create',
  active: true,
  showActions: true,
  onClose: () => {},
});

const scheduleStore = useScheduleStore();
const scheduleOptions = ref<
  {
    value: string;
    label: string;
  }[]
>([]);

const emit = defineEmits<Emits>();

const $q = useQuasar();

const formRef = ref<QForm>();
const isSubmitting = ref(false);

const formData = reactive<{
  name: string;
  scheduleTemplateId: string;
  description: string;
}>({
  name: '',
  scheduleTemplateId: '',
  description: '',
});

const hasFilledFields = computed(() => Boolean(formData.name.trim()));

const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);
const submitLabel = computed(() => (isEditMode.value ? t('save') : t('create')));

const nameRules = [
  (val: string) => !!val?.trim() || 'Введите имя',
  (val: string) => val.trim().length >= 2 || 'Минимум 2 символа',
];

const isSubmitDisabled = computed(() => {
  if (!formData.name.trim() || isFormBusy.value) {
    return true;
  }

  if (isEditMode.value) {
    return !props.worker?._id;
  }

  return !props.productionUnitId;
});

function fillFormFromWorker(worker?: WorkerListItem | null): void {
  if (!worker) return;
  formData.name = worker.name ?? '';
  formData.description = worker.description ?? '';
  formData.scheduleTemplateId = worker.scheduleTemplateId ?? '';
}

function reset(): void {
  if (isEditMode.value) {
    fillFormFromWorker(props.worker);
  } else {
    formData.name = '';
    formData.description = '';
    formData.scheduleTemplateId = '';
  }
  formRef.value?.resetValidation();
}

function buildCreatePayload(): CreateWorkerRequest | null {
  if (!props.productionUnitId) return null;

  const payload: CreateWorkerRequest = {
    p_id: props.productionUnitId,
    name: formData.name.trim(),
    description: formData.description,
  };

  if (formData.scheduleTemplateId) {
    payload.scheduleTemplateId = formData.scheduleTemplateId;
  }

  return payload;
}

function buildUpdatePayload(): UpdateWorkerRequest | null {
  if (!props.worker?._id) return null;

  const payload: UpdateWorkerRequest = {
    _id: props.worker._id,
    name: formData.name.trim(),
    description: formData.description,
  };

  if (formData.scheduleTemplateId) {
    payload.scheduleTemplateId = formData.scheduleTemplateId;
  }

  const pId = props.worker.p_id ?? props.productionUnitId;
  if (pId) {
    payload.p_id = pId;
  }

  return payload;
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    if (isEditMode.value) {
      const payload = buildUpdatePayload();
      if (!payload) {
        $q.notify({
          type: 'warning',
          message: 'Нет данных для обновления',
        });
        return;
      }

      const updated = await workerApi.update(payload);
      $q.notify({
        type: 'positive',
        message: 'Работник обновлён',
      });
      emit('updated', updated);
      return;
    }

    const payload = buildCreatePayload();
    if (!payload) {
      $q.notify({
        type: 'warning',
        message: 'Сначала выберите производственную единицу',
      });
      return;
    }

    const created = await workerApi.create(payload);
    $q.notify({
      type: 'positive',
      message: 'Работник создан',
    });
    emit('created', created);
  } catch (error) {
    console.error('Failed to submit worker form', error);
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? 'Не удалось обновить работника' : 'Не удалось создать работника',
    });
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      reset();
    }
  }
);

watch(
  () => props.worker,
  (next) => {
    if (isEditMode.value && props.active) {
      fillFormFromWorker(next);
      formRef.value?.resetValidation();
    }
  },
  { deep: true }
);

onMounted(async () => {
  try {
    const templates = await scheduleStore.fetchTemplates('worker');
    scheduleOptions.value =
      templates?.data.map((template) => {
        return {
          value: template._id ?? '',
          label: template.name ?? '',
        };
      }) ?? [];
  } catch (error) {
    console.error('Failed to fetch templates:', error);
  }

  if (props.active) {
    reset();
  }
});

defineExpose({
  submit,
  reset,
  isSubmitting,
  isSubmitDisabled,
  hasFilledFields
});
</script>

<style scoped lang="scss">
.worker-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
:deep(.custom-textarea .q-field__control) {
  min-height: 147px;
}
:deep(.q-field__native),
:deep(.q-field__control),
:deep(.q-field__label) {
  font-size: 16px;
}

.worker-form__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.custom-btn {
  min-width: 100px;
}
</style>
