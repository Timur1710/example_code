<template>
  <q-page padding class="column">
    <!-- Хедер страницы -->
    <q-toolbar class="q-mb-md">
      <q-toolbar-title class="flex justify-center">{{ title }}</q-toolbar-title>
    </q-toolbar>

    <!-- Секция поиска -->
    <section class="page-template__search">
      <slot name="search" />
    </section>

    <!-- Секция инструментов -->
    <section class="page-template__tools">
      <slot name="tools" />
    </section>


    <!-- Контент страницы -->
    <q-card flat bordered class="col column full-height">
      <!-- <slot name="content"></slot> -->
      <div class="col column full-height">
        <q-splitter
          unit="px"
          :limits="splitterLimits"
          v-model="splitter"
          class="col"
        >
          <template #before>
            <slot name="left"></slot>
          </template>
          <template #after>
            <slot name="right"></slot>
          </template>
        </q-splitter>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {useSplitterStore} from './model/basePage.stor';
import type {BasePageProps} from './model/types';
import {splitterLimits} from './model/constants'

defineProps<BasePageProps>();

const {splitterWidtdh, setSplitterWidth} = useSplitterStore()
const splitter = ref(splitterWidtdh);

watch(splitter, (newWidth) => {
  setSplitterWidth(newWidth)
});

</script>