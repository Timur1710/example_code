<template>
  <div class="list">
    <NavigationMenuButton
      v-for="item in filteredMenuItems"
      :key="item.key"
      :item="item"
      :show-label="showLabels"
      :selected-key="selectedItem"
      :expanded-keys="expandedItems"
      @select="navigateTo"
    />
  </div>
</template>

<script setup lang="ts">
import NavigationMenuButton from './NavigationMenuButton.vue'
import { useNavigation } from '../lib/useNavigation';

const {
  selectedItem,
  expandedItems,
  showLabels,
  filteredMenuItems,
  navigateTo,
} = useNavigation();
</script>

<style>
.list {
  display: grid;
  grid-template-columns: repeat(4, 150px);
  gap: 30px;
  justify-content: center;
  padding-top: 40px;
}
</style>