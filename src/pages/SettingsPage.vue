<template>
  <q-page class="settings-page">
    <SettingsPanel />
  </q-page>
</template>

<script setup lang="ts">
import { SettingsPanel } from 'src/widgets/settings';
</script>

<style lang="scss" scoped>
.settings-page {
  background: #f5f5f5;
  min-height: 100%;
}
</style>
