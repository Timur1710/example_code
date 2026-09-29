<template>
  <div class="vertical-nav-menu">
    <q-list class="vertical-nav-menu__list">
      <q-item
        v-for="item in items"
        :key="item.value"
        clickable
        :active="modelValue === item.value"
        active-class="vertical-nav-menu__item--active"
        class="vertical-nav-menu__item"
        @click="$emit('update:modelValue', item.value)"
      >
        <q-item-section avatar>
          <q-icon :name="item.icon" size="24px" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getLabel(item) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { useI18n } from 'vue-i18n';
import type { VerticalNavMenuItem } from './types';

defineProps<{
  /** Текущее выбранное значение */
  modelValue: T;
  /** Список пунктов меню */
  items: VerticalNavMenuItem<T>[];
}>();

defineEmits<{
  'update:modelValue': [value: T];
}>();

const { t } = useI18n();

/** Получить текст метки (с локализацией или без) */
function getLabel(item: VerticalNavMenuItem<T>): string {
  if (item.labelKey) {
    return t(item.labelKey);
  }
  return item.label ?? '';
}
</script>

<style lang="scss" scoped>
.vertical-nav-menu {
  padding: 16px 0;

  &__list {
    padding: 0 12px;
  }

  &__item {
    border-radius: 8px;
    margin-bottom: 4px;
    color: #333;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    &--active {
      background: #1976d2;
      color: #fff;

      &:hover {
        background: #1565c0;
        color: #fff;
      }
    }

    :deep(.q-item__section--avatar) {
      min-width: 40px;
    }

    :deep(.q-item__label) {
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>

