/**
 * Composable для работы с навигацией
 */

import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useNavigationStore } from '../model/navigation.store';
import { usePermissions } from 'src/features/authorization';
import { MENU_ITEMS, getIconPath } from './navigation.config';
import type { MenuItemData } from './navigation.types';

export function useNavigation() {
  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const store = useNavigationStore();
  const { hasPermission, isAdmin, canManageUsers, canAccessSettings } = usePermissions();

  const { isCollapsed, isHovered, currentWidth, showLabels, showCollapseButton } =
    storeToRefs(store);

  // === Computed из роута ===

  /**
   * Текущий выбранный пункт меню (из роута)
   */
  const selectedItem = computed(() => route.name as string | null);

  /**
   * Раскрытые пункты меню (вычисляется из роута)
   */
  const expandedItems = computed(() => {
    const routeName = route.name as string;
    const menuItem = findMenuItem(routeName);

    // Если текущий роут — дочерний, раскрываем родителя
    if (menuItem?.parentKey) {
      return [menuItem.parentKey];
    }

    // Если текущий роут сам имеет детей, раскрываем его
    if (menuItem?.children?.length) {
      return [menuItem.key];
    }

    return [];
  });

  /**
   * Фильтрация меню по правам доступа
   */
  const filteredMenuItems = computed((): MenuItemData[] => {
    if (isAdmin.value) {
      return MENU_ITEMS;
    }

    const result: MenuItemData[] = [];

    for (const item of MENU_ITEMS) {
      const hasAccess = hasPermission(item.permission, 'view');

      // Если у пункта есть дети, проверяем их тоже
      if (item.children?.length) {
        const accessibleChildren = item.children.filter((child) =>
          hasPermission(child.permission, 'view')
        );

        // Если нет доступа к родителю, но есть к детям - используем первого ребёнка
        if (!hasAccess && accessibleChildren.length > 0) {
          const firstChild = accessibleChildren[0]!;
          result.push({
            key: firstChild.key,
            labelKey: firstChild.labelKey,
            icon: firstChild.icon,
            materialIcon: firstChild.materialIcon,
            permission: firstChild.permission,
          });
          continue;
        }

        // Если есть доступ к родителю - добавляем с отфильтрованными детьми
        if (hasAccess) {
          result.push({
            ...item,
            children: accessibleChildren.length > 0 ? accessibleChildren : undefined,
          });
          continue;
        }

        continue;
      }

      // Простой пункт без детей
      if (hasAccess) {
        result.push(item);
      }
    }

    return result;
  });

  /**
   * Получить иконку для пункта меню (зависит от состояния выбора)
   */
  function getItemIcon(item: MenuItemData): string {
    if (!item.icon) return '';

    const isSelected = selectedItem.value === item.key;
    if (isSelected) {
      const iconName = item.icon.split('/').pop()?.replace('.svg', '') ?? '';
      return getIconPath(iconName, true);
    }
    return item.icon;
  }

  /**
   * Перейти к маршруту
   */
  function navigateTo(key: string): void {
    void router.push({ name: key }).catch(() => {
      console.warn(`Route "${key}" not found`);
    });
  }

  /**
   * Найти пункт меню по ключу
   */
  function findMenuItem(key: string): MenuItemData | null {
    for (const item of MENU_ITEMS) {
      if (item.key === key) return item;
      if (item.children) {
        const child = item.children.find((c) => c.key === key);
        if (child) return child;
      }
    }
    return null;
  }

  /**
   * Получить label для пункта меню
   */
  function getItemLabel(item: MenuItemData): string {
    return t(item.labelKey);
  }

  /**
   * Проверить, выбран ли пункт меню
   */
  function isItemSelected(key: string): boolean {
    return selectedItem.value === key;
  }

  /**
   * Проверить, раскрыт ли пункт меню
   */
  function isExpanded(key: string): boolean {
    return expandedItems.value.includes(key);
  }

  return {
    // State
    isCollapsed,
    isHovered,
    selectedItem,
    expandedItems,
    currentWidth,
    showLabels,
    showCollapseButton,
    // Computed
    filteredMenuItems,
    canManageUsers,
    canAccessSettings,
    isAdmin,
    // Methods
    toggle: store.toggle,
    setHovered: store.setHovered,
    getItemIcon,
    getItemLabel,
    navigateTo,
    isItemSelected,
    isExpanded,
  };
}
