<template>
  <q-tabs
    :model-value="modelValue"
    class="tabs-nav-menu"
    active-color="primary"
    indicator-color="primary"
    align="left"
    narrow-indicator
    no-caps
    @update:model-value="$emit('update:modelValue', $event as T)"
  >
    <q-tab
      v-for="item in items"
      :key="item.value"
      :name="item.value"
      :icon="item.icon"
      :label="getLabel(item)"
      class="tabs-nav-menu__tab"
    />
  </q-tabs>
</template>

<script setup lang="ts" generic="T extends string">
import { useI18n } from 'vue-i18n';
import type { TabsNavMenuItem } from './types';

defineProps<{
  /** Текущее выбранное значение */
  modelValue: T;
  /** Список пунктов меню */
  items: TabsNavMenuItem<T>[];
}>();

defineEmits<{
  'update:modelValue': [value: T];
}>();

const { t } = useI18n();

/** Получить текст метки (с локализацией или без) */
function getLabel(item: TabsNavMenuItem<T>): string {
  if (item.labelKey) {
    return t(item.labelKey);
  }
  return item.label ?? '';
}
</script>

<style lang="scss" scoped>
.tabs-nav-menu {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);

  &__tab {
    min-height: 48px;
    padding: 0 16px;
  }
}
</style>

