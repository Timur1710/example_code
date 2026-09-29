<template>
  <div class="navigation-menu-item">
    <q-item
      clickable
      :active="isSelected"
      active-class="item--active"
      class="menu-item"
      @click="handleClick"
    >
      <q-item-section avatar class="menu-item__icon">
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
      </q-item-section>

      <q-item-section v-if="showLabel" class="menu-item__label">
        {{ label }}
      </q-item-section>

      <q-item-section v-if="hasChildren && showLabel" side>
        <q-icon
          :name="isExpanded ? 'expand_less' : 'expand_more'"
          size="20px"
        />
      </q-item-section>
    </q-item>

    <!-- Вложенные элементы -->
    <q-slide-transition>
      <div v-if="hasChildren && isExpanded && showLabel" class="children">
        <NavigationMenuItem
          v-for="child in item.children"
          :key="child.key"
          :item="child"
          :show-label="showLabel"
          :selected-key="selectedKey"
          :is-child="true"
          @select="$emit('select', $event)"
        />
      </div>
    </q-slide-transition>
  </div>
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

const isSelected = computed(() => props.selectedKey === props.item.key);

const hasChildren = computed(
  () => props.item.children && props.item.children.length > 0
);

const isExpanded = computed(
  () => props.expandedKeys?.includes(props.item.key) ?? false
);

const iconSrc = computed(() => {
  if (!props.item.icon) return '';
  if (isSelected.value) {
    const iconName = props.item.icon.split('/').pop()?.replace('.svg', '') ?? '';
    return getIconPath(iconName, true);
  }
  return props.item.icon;
});

function handleClick(): void {
  emit('select', props.item.key);
}
</script>

<style lang="scss" scoped>
.navigation-menu-item {
  width: 100%;
}

.menu-item {
  border-radius: 8px;
  margin: 2px 8px;
  min-height: 44px;
  color: #ffffff;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.item--active {
    background: #ffffff;
    color: #000000;

    .menu-icon {
      filter: none;
    }
  }
}

.menu-item__icon {
  min-width: 40px;
}

.menu-icon {
  width: 24px;
  height: 24px;
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
</style>
