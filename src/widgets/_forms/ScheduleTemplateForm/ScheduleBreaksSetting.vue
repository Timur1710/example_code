<template>
  <q-form ref="breaksForm">
    <q-btn
      outline
      dense
      size="md"
      class="text-capitalize q-py-xs q-px-md"
      color="primary"
      label="+ Добавить"
      @click="() => breaks.push({ break_start: '12:00', break_end: '13:00' })"
    />
    <div v-for="(breakItem, index) in breaks" :key="index" class="q-mt-sm breaks-row">
      <q-input
        dense
        outlined
        v-model="breakItem.break_start"
        :label="t('start')"
        mask="##:##"
        @update:model-value="(val) => (breakItem.break_start = clampTimeTo24(String(val ?? '')))"
        :rules="[
          (val) => isValidTime(val) || 'Время от 00:00 до 24:00',
          (val) => compareTimes(val, breakItem.break_end) || 'Начало должно быть меньше конца',
        ]"
      />
      <q-input
        dense
        outlined
        v-model="breakItem.break_end"
        :label="t('end')"
        mask="##:##"
        class="q-mx-sm"
        @update:model-value="(val) => (breakItem.break_end = clampTimeTo24(String(val ?? '')))"
        :rules="[
          (val) => isValidTime(val) || 'Время от 00:00 до 24:00',
          (val) => compareTimes(breakItem.break_start, val) || 'Начало должно быть меньше конца',
        ]"
      />
      <q-btn flat round color="negative" icon="close" @click="() => breaks.splice(index, 1)" />
    </div>
    <div class="q-mt-md">
      <p class="q-mb-none">Всего времени: {{ get_break_time(breaks) }} ч</p>
    </div>
    <div class="all_days_breaks-fields breaks-row q-mb-lg">
      <q-toggle
        label="Применить ко всем рабочим дням в данном графике"
        v-model="all_days_breaks"
        left-label
      />
    </div>

    <div class="breaks_setting_actions">
      <q-btn
        class="bg-gray"
        label="Отмена"
        flat
        @click="emit('update_breaks_setting_active', false)"
      />
      <q-btn :label="t('save')" color="primary" @click="save_breaks" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
  get_break_time,
  validateBreaksOverlap,
  compareTimes,
} from 'src/shared/lib/useScheduleOptions';
import { isValidTime, clampTimeTo24 } from 'src/shared/lib/useTimeInput';

interface Props {
  row: {
    label: string;
    value: number;
    index: number | undefined;
    start_time: string;
    end_time: string;
    breaks: Array<{ break_start: string; break_end: string }>;
  } | null;
  breaks_setting_active?: boolean;
}

interface Emits {
  (
    e: 'saved_breaks',
    index: number | undefined,
    breaks: Array<{ break_start: string; break_end: string }>
  ): void;
  (e: 'update_breaks_setting_active', active: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  row: null,
  breaks_setting_active: true,
});
const breaksForm = ref();
const breaks = ref<Array<{ break_start: string; break_end: string }>>(props.row?.breaks || []);
const all_days_breaks = ref(false);
const emit = defineEmits<Emits>();
const $q = useQuasar();
const { t } = useI18n();

const save_breaks = async () => {
  const valid = await breaksForm.value?.validate();
  if (!valid) {
    $q.notify({
      type: 'negative',
      message: 'Проверьте корректность всех полей времени',
    });
    return;
  }
  const validation = validateBreaksOverlap(breaks.value);

  if (!validation.isValid) {
    $q.notify({
      type: 'negative',
      message: validation.message || 'Перерывы пересекаются',
    });
    return;
  }

  emit('saved_breaks', all_days_breaks.value ? undefined : props.row?.index, breaks.value);
  $q.notify({ type: 'positive', message: 'Перерывы сохранены' });
};
</script>
<style scoped lang="scss">
:deep(.q-field__bottom) {
  padding: 2px 0;
  min-height: 11px;
}
:deep(.q-field--with-bottom) {
  padding-bottom: 10px;
}
:deep(.q-field__append) {
  display: none;
}
.breaks_setting_actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.breaks-row {
  display: flex;
  align-items: center;
  gap: 0px;
}
</style>
