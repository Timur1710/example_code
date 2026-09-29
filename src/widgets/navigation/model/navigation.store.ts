/**
 * Store для состояния навигации (только UI состояние сайдбара)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DEFAULT_NAVIGATION_CONFIG, type NavigationConfig } from '../lib/navigation.types';

const STORAGE_KEY = 'navigation_collapsed';

export const useNavigationStore = defineStore('navigation', () => {
  // === Config ===
  const config = ref<NavigationConfig>({ ...DEFAULT_NAVIGATION_CONFIG });

  // === State ===
  const isCollapsed = ref(false);
  const isHovered = ref(false);

  // === Getters ===
  const currentWidth = computed(() =>
    isCollapsed.value && !isHovered.value ? config.value.collapsedWidth : config.value.expandedWidth
  );

  const showLabels = computed(() => !isCollapsed.value || isHovered.value);

  const showCollapseButton = computed(() => isHovered.value);

  // === Actions ===

  /**
   * Инициализация состояния из localStorage
   */
  function init(): void {
    const savedCollapsed = localStorage.getItem(STORAGE_KEY);
    if (savedCollapsed !== null) {
      isCollapsed.value = savedCollapsed === 'true';
    } else {
      // Автоматическое сворачивание при маленьком экране
      isCollapsed.value = window.innerWidth < config.value.autoCollapseBreakpoint;
    }
  }

  /**
   * Переключить состояние сворачивания
   */
  function toggle(): void {
    isCollapsed.value = !isCollapsed.value;
    localStorage.setItem(STORAGE_KEY, String(isCollapsed.value));
  }

  /**
   * Установить состояние hover
   */
  function setHovered(value: boolean): void {
    isHovered.value = value;
  }

  return {
    // Config
    config,
    // State
    isCollapsed,
    isHovered,
    // Getters
    currentWidth,
    showLabels,
    showCollapseButton,
    // Actions
    init,
    toggle,
    setHovered,
  };
});
