<template>
  <TabsNavMenu
    :model-value="modelValue"
    :items="navItems"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TabsNavMenu, type TabsNavMenuItem } from 'src/shared/ui';
import { STREAM_CREATION_NAV_ITEMS } from '../lib';

interface Props {
  modelValue: string;
  items?: TabsNavMenuItem<string>[];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => STREAM_CREATION_NAV_ITEMS,
});

defineEmits<{
  'update:modelValue': [value: string];
}>();

const navItems = computed(() => props.items);
</script>