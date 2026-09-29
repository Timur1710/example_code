<template>
  <div class="page-template">
    <!-- Заголовок страницы -->
    <div class="page-template__header">
      <h1 class="page-template__title">{{ title }}</h1>
    </div>

    <!-- Секция поиска -->
    <section class="page-template__search">
      <slot name="search" />
    </section>

    <!-- Секция инструментов -->
    <section class="page-template__tools">
      <slot name="tools" />
    </section>

    <!-- Основной контент с разделителем -->
    <q-splitter
      v-model="splitterModel"
      class="page-template__splitter"
      :limits="limits"
    >
      <template #before>
        <div class="page-template__panel page-template__panel--left">
          <slot name="left" />
        </div>
      </template>

      <template #after>
        <div class="page-template__panel page-template__panel--right">
          <slot name="right" />
        </div>
      </template>
    </q-splitter>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  name: 'PageTemplate',
});

const props = withDefaults(
  defineProps<{
    title: string;
    initialSplit?: number;
    minLeft?: number;
    maxLeft?: number;
  }>(),
  {
    initialSplit: 50,
    minLeft: 20,
    maxLeft: 80,
  }
);

const splitterModel = ref(props.initialSplit);
const limits = [props.minLeft, props.maxLeft];
</script>

<style lang="scss" scoped>
.page-template {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  &__header {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    margin-top: 10px;
    margin-bottom: 10px;
    line-height: 1;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    line-height: 1;
    font-weight: 500;
    text-align: center;
    color: #1a1a1a;
  }

  &__search {
    flex-shrink: 0;
    padding: 0 24px 16px;
  }

  &__tools {
    flex-shrink: 0;
    padding: 0 24px 16px;
  }

  &__splitter {
    flex: 1;
    min-height: 0;
  }

  &__panel {
    height: 100%;
    overflow: auto;

    &--left {
      padding-right: 8px;
    }

    &--right {
      padding-left: 8px;
    }
  }
}
</style>

