<template>
  <q-page class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <q-avatar size="80px" color="primary" text-color="white" class="profile-avatar">
          <q-icon name="person" size="48px" />
        </q-avatar>
        <div class="profile-title">
          <h1 class="profile-name">{{ user?.name }}</h1>
          <p class="profile-role">{{ role }}</p>
        </div>
      </div>

      <q-card class="profile-card">
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ t('main') }}</div>

          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-icon name="badge" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>ID</q-item-label>
                <q-item-label>{{ user?.u_id }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="person" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ t('name') }}</q-item-label>
                <q-item-label>{{ user?.name }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-icon name="security" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ t('role') }}</q-item-label>
                <q-item-label>{{ role }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <q-card class="profile-card q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ t('access_sections') }}</div>

          <q-list separator>
            <q-item
              v-for="(value, key) in permissions"
              :key="key"
            >
              <q-item-section>
                <q-item-label>{{ key }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  :color="getPermissionColor(value)"
                  text-color="white"
                  size="sm"
                >
                  {{ t(`permission_levels.${value}`) }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuth } from 'src/features/auth';

const { t } = useI18n();
const { user, role, permissions } = useAuth();

function getPermissionColor(value: string): string {
  switch (value) {
    case 'edit':
      return 'positive';
    case 'view':
      return 'info';
    case 'denied':
      return 'negative';
    default:
      return 'grey';
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 24px;
  background: #f5f5f5;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-title {
  flex: 1;
}

.profile-name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.profile-role {
  margin: 4px 0 0;
  font-size: 14px;
  color: #666;
  text-transform: capitalize;
}

.profile-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>

