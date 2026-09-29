<template>
  <TabsNavMenu
    :model-value="modelValue"
    :items="navItems"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { TabsNavMenu } from 'src/shared/ui';
import { USERS_NAV_ITEMS, type UsersTab } from '../lib';

defineProps<{
  modelValue: UsersTab;
}>();

defineEmits<{
  'update:modelValue': [value: UsersTab];
}>();

const navItems = USERS_NAV_ITEMS;
</script>
