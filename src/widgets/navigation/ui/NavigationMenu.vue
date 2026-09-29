<template>
  <div class="navigation-menu">
    <q-list class="menu-list">
      <NavigationMenuItem
        v-for="item in items"
        :key="item.key"
        :item="item"
        :show-label="showLabels"
        :selected-key="selectedKey"
        :expanded-keys="expandedKeys"
        @select="$emit('select', $event)"
      />
    </q-list>
  </div>
</template>

<script setup lang="ts">
import NavigationMenuItem from './NavigationMenuItem.vue';
import type { MenuItemData } from '../lib/navigation.types';

defineProps<{
  items: MenuItemData[];
  showLabels: boolean;
  selectedKey: string | null;
  expandedKeys: string[];
}>();

defineEmits<{
  select: [key: string];
}>();
</script>

<style lang="scss" scoped>
.navigation-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: #0047b2;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.menu-list {
  padding: 0;
}
</style>
