<template>
  <q-form ref="formRef" class="bulk-worker-form" @submit.prevent="submit">
    <q-input
      v-model="formData.baseName"
      outlined
      dense
      label="Базовое имя"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hint="Имена будут: имя-1, имя-2 и т.д."
    />
    <q-input
      v-model.number="formData.count"
      outlined
      dense
      label="Количество"
      type="number"
      :rules="countRules"
      :disable="isFormBusy"
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

    <div v-if="showActions" class="bulk-worker-form__actions">
      <q-btn :label="t('cancel')" flat color="grey" @click="props.onClose" class="custom-btn" />
      <q-btn
        label="Создать"
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
} from 'src/entities/worker';
import { useScheduleStore } from 'src/entities/schedule';
import { useI18n } from 'vue-i18n';

interface Props {
  productionUnitId: string | null;
  /** Имя по умолчанию (имя профессии) */
  defaultName?: string;
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия диалога */
  onClose?: () => void;
}

interface Emits {
  (e: 'created', workers: CreateWorkerResponse[]): void;
}

const { t } = useI18n();
const props = withDefaults(defineProps<Props>(), {
  defaultName: '',
  active: true,
  showActions: true,
  onClose: () => {},
});

const scheduleStore = useScheduleStore();
const scheduleOptions = ref<{ value: string; label: string }[]>([]);

const emit = defineEmits<Emits>();
const $q = useQuasar();

const formRef = ref<QForm>();
const isSubmitting = ref(false);

const formData = reactive({
  baseName: '',
  count: 1,
  scheduleTemplateId: '',
});

const isFormBusy = computed(() => isSubmitting.value);

const nameRules = [
  (val: string) => !!val?.trim() || 'Введите имя',
  (val: string) => val.trim().length >= 2 || 'Минимум 2 символа',
];

const countRules = [
  (val: number) => (val !== null && val !== undefined) || 'Введите количество',
  (val: number) => val >= 1 || 'Минимум 1',
  (val: number) => val <= 100 || 'Максимум 100',
  (val: number) => Number.isInteger(val) || 'Должно быть целым числом',
];

const isSubmitDisabled = computed(() => {
  if (!formData.baseName.trim() || isFormBusy.value) return true;
  if (!formData.count || formData.count < 1) return true;
  return !props.productionUnitId;
});

function reset(): void {
  formData.baseName = props.defaultName || '';
  formData.count = 1;
  formData.scheduleTemplateId = '';
  formRef.value?.resetValidation();
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid || !props.productionUnitId) return;

  isSubmitting.value = true;

  try {
    const createdWorkers: CreateWorkerResponse[] = [];

    for (let i = 1; i <= formData.count; i++) {
      const payload: CreateWorkerRequest = {
        p_id: props.productionUnitId,
        name: `${formData.baseName.trim()}-${i}`,
      };

      if (formData.scheduleTemplateId) {
        payload.scheduleTemplateId = formData.scheduleTemplateId;
      }

      const created = await workerApi.create(payload);
      createdWorkers.push(created);
    }

    $q.notify({
      type: 'positive',
      message: `Создано работников: ${createdWorkers.length}`,
    });
    emit('created', createdWorkers);
  } catch (error) {
    console.error('Failed to bulk create workers', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать работников',
    });
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (isActive) => {
    if (isActive) reset();
  },
);

onMounted(async () => {
  try {
    const templates = await scheduleStore.fetchTemplates('worker');
    scheduleOptions.value =
      templates?.data.map((template) => ({
        value: template._id ?? '',
        label: template.name ?? '',
      })) ?? [];
  } catch (error) {
    console.error('Failed to fetch templates:', error);
  }

  if (props.active) reset();
});

defineExpose({
  submit,
  reset,
  isSubmitting,
  isSubmitDisabled,
});
</script>

<style scoped lang="scss">
.bulk-worker-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:deep(.q-field__native),
:deep(.q-field__control),
:deep(.q-field__label) {
  font-size: 16px;
}

.bulk-worker-form__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.custom-btn {
  min-width: 100px;
}
</style>
