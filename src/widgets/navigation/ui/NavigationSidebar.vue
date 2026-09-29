<template>
  <q-drawer
    v-model="drawerOpen"
    :width="currentWidth"
    :mini="isCollapsed && !isHovered"
    :mini-width="collapsedWidth"
    :breakpoint="0"
    show-if-above
    bordered
    class="navigation-drawer no-scroll"
  >
    <div class="navigation-content">
      <!-- Логотип -->
      <NavigationLogo
        :is-collapsed="isCollapsed && !isHovered"
        @toggle="toggle"
      />

      <!-- Меню -->
      <NavigationMenu
        :items="filteredMenuItems"
        :show-labels="showLabels"
        :selected-key="selectedItem"
        :expanded-keys="expandedItems"
        @select="navigateTo"
      />

      <!-- Футер -->
      <NavigationFooter
        :is-collapsed="isCollapsed && !isHovered"
        :can-access-settings="canAccessSettings"
        :can-manage-users="canManageUsers"
      />
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '../model/navigation.store';
import { useNavigation } from '../lib/useNavigation';
import NavigationLogo from './NavigationLogo.vue';
import NavigationMenu from './NavigationMenu.vue';
import NavigationFooter from './NavigationFooter.vue';

const store = useNavigationStore();

const {
  isCollapsed,
  isHovered,
  selectedItem,
  expandedItems,
  currentWidth,
  showLabels,
  filteredMenuItems,
  canManageUsers,
  canAccessSettings,
  toggle,
  navigateTo,
} = useNavigation();

const { config } = storeToRefs(store);

const drawerOpen = ref(true);

const collapsedWidth = computed(() => config.value.collapsedWidth);

// function handleMouseOver(): void {
//   setHovered(true);
// }

// function handleMouseLeave(): void {
//   setHovered(false);
// }
</script>

<style lang="scss" scoped>
.navigation-drawer {
  background: #000000 !important;

  :deep(.q-drawer__content) {
    background: #000000;
  }
}

.navigation-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Montserrat', sans-serif;
}
</style>
