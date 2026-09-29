<template>
  <q-page class="users-page">
    <div class="users-page__container">
      <main class="users-page__content">
        <UsersNavigation v-model="activeTab" />
        <q-tab-panels
          v-model="activeTab"
          animated
          class="users-page__panels"
        >
          <q-tab-panel name="users" class="users-page__panel">
            <UsersManagementPanel />
          </q-tab-panel>

          <q-tab-panel name="roles" class="users-page__panel">
            <RolesManagementPanel />
          </q-tab-panel>
        </q-tab-panels>
      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  UsersNavigation,
  UsersManagementPanel,
  RolesManagementPanel,
  type UsersTab,
} from 'src/widgets/users-management';

const activeTab = ref<UsersTab>('users');
</script>

<style lang="scss" scoped>
.users-page {
  background: #fff;

  &__container {
    display: flex;
    height: 100%;
  }

  &__sidebar {
    width: 260px;
    min-width: 260px;
    background: #fafafa;
  }

  &__content {
    flex: 1;
    padding: 24px 32px;
    background: #fff;
  }

  &__panels {
    background: transparent;
    height: 100%;
  }

  &__panel {
    padding: 0;
  }
}
</style>
