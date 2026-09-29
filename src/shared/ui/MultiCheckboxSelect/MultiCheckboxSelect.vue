<template>
  <q-select
    ref="selectRef"
    :model-value="modelValue"
    :options="filteredOptions"
    option-value="value"
    option-label="label"
    multiple
    dense
    borderless
    emit-value
    map-options
    clearable
    use-input
    :input-debounce="200"
    :label="label"
    class="multi-checkbox-select"
    :popup-content-style="menuContentStyle"
    @update:model-value="onModelUpdate"
    @popup-show="onPopupShow"
    @filter="onFilter"
  >
    <template #option="{ itemProps, opt, selected, toggleOption }">
      <q-item v-bind="itemProps" dense @click.stop="toggleOption(opt)">
        <q-item-section side>
          <q-checkbox
            :model-value="selected"
            dense
            @update:model-value="toggleOption(opt)"
            @click.stop
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ noOptionsText }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

defineOptions({ name: 'MultiCheckboxSelect' });

export interface SelectOption {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    options: SelectOption[];
    label?: string;
    /** Текст при отсутствии результатов поиска */
    noOptionsText?: string;
  }>(),
  { noOptionsText: 'Ничего не найдено' }
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const selectRef = ref<{ $el?: HTMLElement } | null>(null);
const menuContentStyle = ref<Record<string, string>>({});
const filteredOptions = ref<SelectOption[]>([]);

watch(
  () => props.options,
  (newOptions) => {
    filteredOptions.value = newOptions;
  },
  { immediate: true }
);

function onFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase().trim();
    if (needle === '') {
      filteredOptions.value = props.options;
    } else {
      filteredOptions.value = props.options.filter(
        (opt) => opt.label.toLowerCase().includes(needle) || opt.value.toLowerCase().includes(needle)
      );
    }
  });
}

function onModelUpdate(value: string[] | null) {
  emit('update:modelValue', value ?? []);
}

function onPopupShow() {
  filteredOptions.value = props.options;
  void nextTick(() => {
    const el = selectRef.value?.$el;
    if (el) {
      const width = el.offsetWidth;
      menuContentStyle.value = {
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
      };
    }
  });
}
</script>

<style lang="scss" scoped>
.multi-checkbox-select {
  width: 100%;

  :deep(.q-field__control) {
    padding: 0 4px;

    &::before,
    &::after {
      border: none !important;
    }
  }

  :deep(.q-field__label) {
    font-size: 11px;
  }

  :deep(.q-field__native) {
    font-size: 11px;
  }
}
</style>
