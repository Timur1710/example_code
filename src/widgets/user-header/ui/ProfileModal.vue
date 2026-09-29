<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="profile-modal">
      <q-card-section class="row items-center q-pb-none modal-header">
        <div class="text-h6">{{ t('profile.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="profile-content">
        <!-- Аватар пользователя -->
        <div class="profile-avatar">
          <q-avatar size="80px" color="primary" text-color="white">
            <span class="avatar-initials">{{ userInitials }}</span>
          </q-avatar>
        </div>

        <!-- Информация о пользователе -->
        <div class="profile-info">
          <div class="info-row">
            <div class="info-label">{{ t('profile.name') }}</div>
            <div class="info-value">{{ user?.name || '—' }}</div>
          </div>

          <div class="info-row">
            <div class="info-label">{{ t('profile.role') }}</div>
            <div class="info-value">
              <q-badge :color="roleColor" :label="roleLabel" />
            </div>
          </div>

          <div class="info-row">
            <div class="info-label">{{ t('profile.user_id') }}</div>
            <div class="info-value info-value--mono">{{ user?.u_id || '—' }}</div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="modal-actions">
        <q-btn
          flat
          :label="t('profile.close')"
          color="primary"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuth } from 'src/features/auth';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const { user, role } = useAuth();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const userInitials = computed(() => {
  if (!user.value?.name) return '?';
  const parts = user.value.name.split(' ').filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0][0] ?? '';
    const second = parts[1][0] ?? '';
    return (first + second).toUpperCase();
  }
  return user.value.name.substring(0, 2).toUpperCase();
});

const roleLabel = computed(() => {
  const roleValue = role.value;
  switch (roleValue) {
    case 'administrator':
      return t('roles.administrator');
    case 'manager':
      return t('roles.manager');
    case 'worker':
      return t('roles.worker');
    default:
      return roleValue || '—';
  }
});

const roleColor = computed(() => {
  const roleValue = role.value;
  switch (roleValue) {
    case 'administrator':
      return 'deep-purple';
    case 'manager':
      return 'blue';
    case 'worker':
      return 'teal';
    default:
      return 'grey';
  }
});
</script>

<style lang="scss" scoped>
.profile-modal {
  min-width: 400px;
  max-width: 480px;
  border-radius: 12px;
}

.modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.profile-content {
  padding: 24px;
}

.profile-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;

  .avatar-initials {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 1px;
  }
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;

  &--mono {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    color: #888;
  }
}

.modal-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
}
</style>

