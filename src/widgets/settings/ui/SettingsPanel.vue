<template>
  <div class="settings-panel">
    <q-tabs
      v-model="activeTab"
      dense
      active-color="primary"
      indicator-color="primary"
      align="left"
      class="settings-panel__tabs"
    >
      <q-tab name="system" label="Система" />
      <q-tab name="charts" label="Графики" />
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="settings-panel__panels">
      <q-tab-panel name="system" class="settings-panel__panel">
        <main class="settings-panel__content">
          <LanguageSettings />
        </main>
      </q-tab-panel>

      <q-tab-panel name="charts" class="settings-panel__panel">
        <div class="settings-panel__charts">
          <WorkerSchedulesSettings />
          <HolidaysSettings />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { useI18n } from 'vue-i18n';
import LanguageSettings from './LanguageSettings.vue';
import WorkerSchedulesSettings from './WorkerSchedulesSettings.vue';
import HolidaysSettings from './HolidaysSettings.vue';

const activeTab = ref<'system' | 'charts'>('system');

// const { t } = useI18n();
</script>

<style lang="scss" scoped>
.settings-panel {
  margin: 0 auto;
  padding: 32px 24px;

  &__tabs {
    margin-bottom: 0;
    padding: 8px 36px;
    display: flex;
    align-items: center;
    align-self: stretch;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    overflow: hidden;

    :deep(.q-tab:first-child) {
      border-radius: 0!important;
    }

    :deep(.q-tabs__content) {
      gap: 14px!important;
    }
  }

  &__panels {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0 0 12px 12px;
  }

  &__panel {
    padding: 16px;
  }

  &__charts {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__header {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    text-align: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>

