<template>
  <div class="user-header-actions">
    <InfoIcon :text="t('help')" :dark_mode="true" :hash="''" :section="''" @click = "help" />
    <!-- Кнопка профиля -->
    <q-btn
      flat
      dense
      icon="person"
      class="action-btn q-px-sm"
      @click="showProfileModal = true"
    >
      <q-tooltip>{{ t('profile.title') }}</q-tooltip>
      <span>{{ user?.name }}</span>
    </q-btn>
    <!-- Кнопка выхода -->
    <q-btn
      flat
      round
      dense
      icon="logout"
      class="action-btn action-btn--logout"
      @click="confirmLogout"
    >
      <q-tooltip>{{ t('logout') }}</q-tooltip>
    </q-btn>

    <!-- Модальное окно профиля -->
    <ProfileModal v-model="showProfileModal" />

    <!-- Диалог подтверждения выхода -->
    <q-dialog v-model="showLogoutDialog" persistent>
      <q-card class="logout-dialog">
        <q-card-section class="row items-center">
          <q-avatar icon="logout" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">{{ t('exit') }}</span>
        </q-card-section>

        <q-card-section>
          {{ t('exit_confirmation') }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="t('cancel')"
            color="grey"
            v-close-popup
          />
          <q-btn
            flat
            :label="t('logout')"
            color="negative"
            @click="handleLogout"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from 'src/features/auth';
import { InfoIcon } from 'src/shared';
const ProfileModal = defineAsyncComponent(
  () => import('./ProfileModal.vue')
);

const { t } = useI18n();
const router = useRouter();
const { user, logoutAndRedirect } = useAuth();

const showProfileModal = ref(false);
const showLogoutDialog = ref(false);

function help(): void {
  void router.push({ name: 'help' });
}
function confirmLogout(): void {
  showLogoutDialog.value = true;
}

function handleLogout(): void {
  showLogoutDialog.value = false;
  logoutAndRedirect();
}
</script>

<style lang="scss" scoped>
.user-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  color: #333;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  &--logout:hover {
    color: #c62828;
    background: rgba(198, 40, 40, 0.08);
  }
  & span {
    font-size: 15px;
    text-transform: capitalize;
  }
}

.logout-dialog {
  min-width: 320px;
  border-radius: 12px;
}
</style>

