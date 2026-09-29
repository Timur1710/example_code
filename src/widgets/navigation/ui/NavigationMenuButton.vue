<template>
  <q-btn
    unelevated
    no-caps
    :ripple="{ early: true, color: 'grey-4' }"
    stack
    @click="handleClick"
  >
    <div avatar class="menu-item__icon">
        <img
          v-if="item.icon"
          :src="iconSrc"
          :alt="label"
          class="menu-icon"
        />
        <q-icon
          v-else-if="item.materialIcon"
          :name="item.materialIcon"
          size="24px"
        />
    </div>

      <div v-if="showLabel" class="menu-item__label">
        {{ label }}
      </div>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getIconPath } from '../lib/navigation.config';
import type { MenuItemData } from '../lib/navigation.types';

const props = defineProps<{
  item: MenuItemData;
  showLabel: boolean;
  selectedKey: string | null;
  isChild?: boolean;
  expandedKeys?: string[];
}>();

const emit = defineEmits<{
  select: [key: string];
}>();

const { t } = useI18n();

const label = computed(() => t(props.item.labelKey));

const iconSrc = computed(() => {
  if (!props.item.icon) return '';
    const iconName = props.item.icon.split('/').pop()?.replace('.svg', '') ?? '';
    return getIconPath(iconName, true);
});

function handleClick(): void {
  emit('select', props.item.key);
}
</script>

<style lang="scss" scoped>

.menu-icon {
  width: 42px;
  height:42px;
  object-fit: contain;
}

.menu-item__label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.children {
  padding-left: 16px;
}

.q-btn--unelevated {
  border-radius: 4px;
  background: #ffffff !important;
  box-shadow: 0px 3px 6px #00000033;
  width: 150px;
  height: 150px;
}
.q-btn:hover {
  background: #fcfcfc !important;
}
.q-hoverable:hover {
  :deep(.q-focus-helper) {
    background: none !important;
    // opacity: 1;
  }
}
</style>