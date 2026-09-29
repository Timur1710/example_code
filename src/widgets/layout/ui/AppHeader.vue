<template>
  <q-header class="app-header">
    <q-toolbar class="app-header__toolbar">
      <q-space />

      <!-- Информация о пользователе -->
      <div class="user-info">
        <span class="user-info__name">{{ userName }}</span>
        <span class="user-info__role">{{ userRole }}</span>
      </div>

      <!-- Кнопка профиля -->
      <q-btn
        flat
        round
        class="header-btn"
        :to="{ name: 'profile' }"
      >
        <q-icon name="person" size="22px" />
        <q-tooltip>{{ t('nav.profile') }}</q-tooltip>
      </q-btn>

      <!-- Кнопка выхода -->
      <q-btn
        flat
        round
        class="header-btn header-btn--logout"
        @click="handleLogout"
      >
        <q-icon name="logout" size="22px" />
        <q-tooltip>{{ t('logout') }}</q-tooltip>
      </q-btn>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuth } from 'src/features/auth';

const { t } = useI18n();
const $q = useQuasar();
const { user, role, logoutAndRedirect } = useAuth();

const userName = computed(() => user.value?.name ?? '');
const userRole = computed(() => role.value ?? '');

function handleLogout(): void {
  $q.dialog({
    title: t('exit'),
    message: t('exit_confirmation'),
    cancel: {
      label: t('cancel'),
      flat: true,
      color: 'grey',
    },
    ok: {
      label: t('logout'),
      color: 'negative',
    },
    persistent: true,
  }).onOk(() => {
    logoutAndRedirect();
  });
}
</script>

<style lang="scss" scoped>
.app-header {
  background: transparent;
  box-shadow: none;

  &__toolbar {
    min-height: 56px;
    padding: 0 16px;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 12px;
  color: #333;

  &__name {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
  }

  &__role {
    font-size: 11px;
    color: #666;
    text-transform: capitalize;
  }
}

.header-btn {
  color: #333;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 57, 246, 0.1);
    color: #0039f6;
  }

  &--logout {
    margin-left: 4px;

    &:hover {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
    }
  }
}
</style>

