<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    @update:model-value="onUpdateModelValue"
  >
    <q-card
      class="dialog-wrapper__card overflow-hidden"
      :class="[cardClass, { 'production-item-form': isProductionItemForm }]"
      :style="cardStyleComputed"
    >
      <q-card-section
        v-if="showHeader"
        :class="[headerClass, 'dialog-wrapper__header', {'production-item-header': isProductionItemForm}]"
      >
        <slot name="header" :close="close">
          <div class="dialog-wrapper__title-row">
            <q-icon
              v-if="icon"
              :name="icon"
              size="28px"
              color="primary"
            />
            <span v-if="title" class="dialog-wrapper__title">
              {{ title }}
            </span>
          </div>

          <q-space />

          <slot name="header-actions" :close="close">
            <q-btn
              v-if="showClose"
              flat
              round
              dense
              icon="close"
              class="dialog-wrapper__close-btn"
              @click="close"
            />
          </slot>
        </slot>
      </q-card-section>

      <q-separator v-if="showHeader && !hideHeaderSeparator" />

      <q-card-section :class="[contentClass, 'dialog-wrapper__content', {'production-item-content': isProductionItemForm}]">
        <slot name="content">
          <slot />
        </slot>
      </q-card-section>

      <q-card-actions
        v-if="!hideActions"
        :align="actionsAlign"
        :class="actionsClass"
        class="dialog-wrapper__actions"
      >
        <slot name="actions" :close="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StyleValue } from 'vue';

type ClassValue = string | Record<string, boolean> | Array<string | Record<string, boolean>>;

interface Props {
  /** v-model для открытия/закрытия диалога */
  modelValue: boolean;
  /** Заголовок диалога */
  title?: string;
  /** Иконка в заголовке */
  icon?: string;
  /** Запретить закрытие кликом вне диалога */
  persistent?: boolean;
  /** Класс для q-card */
  cardClass?: ClassValue;
  /** Inline-стили для q-card */
  cardStyle?: StyleValue;
  /** Класс для хедера */
  headerClass?: ClassValue;
  /** Класс для содержимого */
  contentClass?: ClassValue;
  /** Класс для экшенов */
  actionsClass?: ClassValue;
  /** Выравнивание экшенов */
  actionsAlign?: 'left' | 'center' | 'right' | 'around' | 'between';
  /** Скрыть секцию экшенов */
  hideActions?: boolean;
  /** Скрыть кнопку закрытия */
  showClose?: boolean;
  /** Скрыть разделитель после хедера */
  hideHeaderSeparator?: boolean;
  /** Скрыть разделитель перед экшенами */
  hideActionsSeparator?: boolean;
  /** Диалог для форм создания производственых сущностей */
  isProductionItemForm?: boolean,
  /** Ширина диалогового окна */
}

const props = withDefaults(defineProps<Props>(), {
  persistent: false,
  actionsAlign: 'right',
  hideActions: false,
  showClose: true,
  hideHeaderSeparator: false,
  hideActionsSeparator: false,
  isProductionItemForm: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const showHeader = computed(() => !!(props.title || props.icon || props.showClose));

const cardStyleComputed = computed<StyleValue>(() => props.cardStyle || {});

function onUpdateModelValue(value: boolean) {
  emit('update:modelValue', value);
  if (!value) {
    emit('close');
  }
}

function close() {
  emit('update:modelValue', false);
  emit('close');
}
</script>

<style scoped lang="scss">
@import "../../../css/schedule.popup.scss";

.dialog-wrapper__card {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.dialog-wrapper__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.dialog-wrapper__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 18px;
  color: #212121;
}

.dialog-wrapper__title {
  line-height: 1.2;
}

.dialog-wrapper__close-btn {
  color: #757575;
}

.dialog-wrapper__content {
  padding: 20px;
}

.dialog-wrapper__actions {
  padding: 18px 20px;
}
.no-px {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.production-item-form {
  padding: 0 40px;
}
.production-item-header {
  padding-right: 0;
  padding-left: 0;
}
.production-item-content {
  padding: 0;
}
</style>

