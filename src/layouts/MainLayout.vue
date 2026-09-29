<template>
  <q-layout view="lHh LpR lFf">
    <q-header class="main-header" bordered>
      <q-toolbar class="header-toolbar">
        <q-toolbar-title />
        <UserHeaderActions />
      </q-toolbar>
    </q-header>

    <NavigationSidebar />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { NavigationSidebar } from 'src/widgets/navigation';
import { UserHeaderActions } from 'src/widgets/user-header';
</script>

<style lang="scss" scoped>
.main-header {
  background: #ffffff;
  color: #333;
}

.header-toolbar {
  min-height: 48px;
  padding: 0 16px;
}
</style>
