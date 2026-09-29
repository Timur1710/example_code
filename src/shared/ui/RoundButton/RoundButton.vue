<template>
  <q-btn
    :disable="disabled"
    :loading="loading"
    outline
    rounded
    no-caps
    class="round-button"
    v-bind="$attrs"
    @click="emit('click')"
  >
    <template v-slot:loading>
      <q-spinner-hourglass class="on-left" />
      {{ loadingText }}
    </template>
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineOptions({
  name: 'RoundButton',
  inheritAttrs: false,
});

withDefaults(
  defineProps<{
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    loading: false,
    disabled: false,
  }
);

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n();
const loadingText = t('loading');
</script>

<style lang="scss" scoped>
.round-button {
  height: 28px;
  border: 1px solid #dbdbdb !important;
  border-radius: 14px !important;
  color: #000000;
  padding-left: 1rem;
  padding-right: 1rem;
  transition: 0.3s linear;

  :deep(.q-btn__content) {
    font-family: 'Roboto', sans-serif;
    font-style: normal;
    font-size: 13px;
    letter-spacing: 0;
  }

  :deep(.block) {
    line-height: 26px;
    white-space: nowrap;
  }

  :deep(.q-btn__wrapper) {
    padding: 0;
    min-height: 0;
  }

  :deep(.q-btn__wrapper:before) {
    border: none !important;
  }

  &:hover:not(:disabled) {
    color: white !important;
    background-color: #0039f6 !important;
    border: 1px solid #0039f6 !important;
  }

  &:focus:not(:disabled) {
    color: #ffffff !important;
    background: #0039f6 !important;
  }

  &.disabled,
  &:disabled {
    color: #a2a2a2;

    &:hover {
      background: white !important;
      border: 1px solid #dbdbdb !important;
      color: #a2a2a2 !important;
    }
  }
}

// Вариант для тёмной темы (навигация)
.round-button--dark {
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #ffffff;

  &:hover:not(:disabled) {
    border-color: #0039f6 !important;
  }
}
</style>

