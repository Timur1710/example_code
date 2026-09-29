<template>
  <div class="duration-input">
    <template v-if="readonly">
      <div class="duration-input__display">
        {{ formatDuration(modelValue) }}
      </div>
    </template>
    <template v-else>
      <div class="duration-input__edit">
        <q-input
          :model-value="displayValue"
          :label="label"
          :hint="hint"
          outlined
          dense
          type="number"
          step="0.01"
          min="0"
          @update:model-value="onValueChange"
        />
        <q-select
          v-model="selectedUnit"
          :options="unitOptions"
          outlined
          dense
          option-value="value"
          option-label="label"
          emit-value
          map-options
          @update:model-value="onUnitChange"
          class="duration-input__unit-select"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export type DurationUnit = 'ms' | 's' | 'min' | 'h';

interface UnitOption {
  label: string;
  value: DurationUnit;
}

interface Props {
  modelValue?: string | number | undefined;
  label?: string;
  hint?: string;
  readonly?: boolean;
  defaultUnit?: DurationUnit;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '0',
  readonly: false,
  defaultUnit: 'ms',
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Конвертация единиц времени в миллисекунды
const unitToMs: Record<DurationUnit, number> = {
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
};

// Опции для селекта
const unitOptions = computed<UnitOption[]>(() => [
  { label: t('milliseconds'), value: 'ms' },
  { label: t('seconds'), value: 's' },
  { label: t('minutes'), value: 'min' },
  { label: t('hours'), value: 'h' },
]);

const selectedUnit = ref<DurationUnit>(props.defaultUnit);

// Значение в миллисекундах
const valueInMs = computed(() => {
  const value = typeof props.modelValue === 'string' 
    ? parseFloat(props.modelValue) 
    : props.modelValue;
  return isNaN(value || 0) ? 0 : value || 0;
});

// Отображаемое значение в выбранных единицах
const displayValue = computed(() => {
  const ms = valueInMs.value;
  const converted = ms / unitToMs[selectedUnit.value];
  return converted.toString();
});

// Обновление значения
const onValueChange = (value: string | number | null) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  if (isNaN(numValue)) {
    emit('update:modelValue', '0');
    return;
  }
  
  const ms = numValue * unitToMs[selectedUnit.value];
  emit('update:modelValue', Math.round(ms).toString());
};

// Изменение единицы измерения
const onUnitChange = (newUnit: DurationUnit) => {
  // Значение остается в миллисекундах, меняется только отображение
  selectedUnit.value = newUnit;
};

// Форматирование для режима просмотра
const formatDuration = (value?: string | number): string => {
  const ms = typeof value === 'string' ? parseInt(value, 10) : (value || 0);
  
  if (isNaN(ms) || ms === 0) return '—';

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${t('hours_short')}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${t('minutes_short')}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} ${t('seconds_short')}`);
  }
  if (milliseconds > 0 && hours === 0 && minutes === 0) {
    parts.push(`${milliseconds} ${t('milliseconds_short')}`);
  }

  return parts.length > 0 ? parts.join(' ') : '0 ' + t('seconds_short');
};

// Определяем лучшую единицу измерения при инициализации
watch(() => props.modelValue, (newValue) => {
  if (!newValue || props.readonly) return;
  
  const ms = typeof newValue === 'string' ? parseInt(newValue, 10) : newValue;
  
  if (isNaN(ms)) return;
  
  // Автоматически выбираем удобную единицу измерения при первой загрузке
  if (ms === 0) {
    selectedUnit.value = props.defaultUnit;
  } else if (ms >= 3600000 && ms % 3600000 === 0) {
    selectedUnit.value = 'h';
  } else if (ms >= 60000 && ms % 60000 === 0) {
    selectedUnit.value = 'min';
  } else if (ms >= 1000 && ms % 1000 === 0) {
    selectedUnit.value = 's';
  } else {
    selectedUnit.value = 'ms';
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
.duration-input {
  &__display {
    font-size: 16px;
    color: #333;
  }

  &__edit {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: start;
  }

  &__unit-select {
    width: 120px;
  }
}
</style>
