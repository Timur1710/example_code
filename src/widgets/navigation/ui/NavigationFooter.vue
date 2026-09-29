<template>
  <div class="navigation-footer" :class="{ 'footer--collapsed': isCollapsed }">
    <!-- Кнопки настроек и пользователей -->
    <div v-if="showButtons" class="footer-buttons">
      <router-link
        v-if="canAccessSettings"
        :to="{ name: 'settings' }"
        custom
        v-slot="{ navigate, isActive }"
      >
        <q-btn
          flat
          rounded
          no-caps
          class="footer-btn"
          :class="{ 'q-mx-auto': isCollapsed, 'btn--active': isActive }"
          @click="() => navigate()"
        >
          <q-icon name="settings" size="18px" :class="!isCollapsed?'q-mr-xs':''" />
          <span v-if="!isCollapsed">{{ t('nav.settings') }}</span>
        </q-btn>
      </router-link>

      <router-link
        v-if="canManageUsers"
        :to="{ name: 'users' }"
        custom
        v-slot="{ navigate, isActive }"
      >
        <q-btn
          flat
          rounded
          no-caps
          class="footer-btn"
          :class="{ 'q-mx-auto': isCollapsed, 'btn--active': isActive }"
          @click="() => navigate()"
        >
          <q-icon name="people" size="18px" :class="!isCollapsed?'q-mr-xs':''" />
          <span v-if="!isCollapsed">{{ t('nav.users') }}</span>
        </q-btn>
      </router-link>
      
    </div>

    <!-- Информация о версии -->
     <div class="version-info" v-html="projectInfo" /> 

    <!-- Кнопка о ПО -->
    <button
      v-if="isRussian"
      class="license-btn"
      @click="showLicenseModal = true"
    >
      О программном обеспечении 
    </button>
    <!-- Модальное окно лицензии -->
    <LicenseInfoModal
      v-if="showLicenseModal"
      v-model="showLicenseModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';


const LicenseInfoModal = defineAsyncComponent(
  () => import('./LicenseInfoModal.vue')
);

const props = defineProps<{
  isCollapsed: boolean;
  canAccessSettings: boolean;
  canManageUsers: boolean;
  
}>();

const { t, locale } = useI18n();
const showLicenseModal = ref(false);

const showButtons = computed(
  () => props.canAccessSettings || props.canManageUsers
);

const isRussian = computed(() => locale.value === 'ru-RU' || locale.value === 'ru');

const projectInfo = computed(() => {
  return `${t('version')} 3.1.1 Номер сборки 00011 <br><br> © 2025 ${t('project_info')}`;
});
</script>

<style lang="scss" scoped>
.navigation-footer {
  padding: 16px 10px 18px;
  margin-top: auto;
  transition: padding 0.3s ease;

  &.footer--collapsed {
    padding: 8px 5px 10px;
    text-align: center;
  }
}

.footer-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.footer-btn {
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 11px;
  padding: 4px 12px;
  min-height: 28px;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.btn--active {
    background: #0039f6;
    border-color: #0039f6;
    color: #ffffff;
  }
}

.version-info {
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  color: #808080;
  line-height: 1.4;
  margin-top: 15px;

  .footer--collapsed & {
    font-size: 8px;
  }
}

.license-btn {
  background: none;
  border: none;
  color: #808080;
  font-size: 11px;
  padding: 0;
  margin-top: 8px;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }

  .footer--collapsed & {
    font-size: 8px;
  }
}
</style>

