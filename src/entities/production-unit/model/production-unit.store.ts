/**
 * Pinia store для производственных единиц
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  ProductionUnitTreeNode,
  ProductionUnitBreadcrumb,
  ProductionUnitDetail,
} from './production-unit.types';
import { productionUnitApi } from '../api/production-unit.api';

export const useProductionUnitStore = defineStore('productionUnit', () => {
  // === State ===
  const nodes = ref<ProductionUnitTreeNode[]>([]);
  const selectedNode = ref<ProductionUnitTreeNode | null>(null);
  const expandedNodes = ref<string[]>([]);
  const breadcrumbs = ref<ProductionUnitBreadcrumb[]>([]);
  const currentDetail = ref<ProductionUnitDetail | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // === Getters ===
  const hasNodes = computed(() => nodes.value.length > 0);

  const selectedNodeId = computed(() => selectedNode.value?.id ?? null);

  const getNodeById = computed(
    () =>
      (id: string): ProductionUnitTreeNode | undefined => {
        const findNode = (
          nodeList: ProductionUnitTreeNode[],
        ): ProductionUnitTreeNode | undefined => {
          for (const node of nodeList) {
            if (node.id === id) return node;
            if (node.children) {
              const found = findNode(node.children);
              if (found) return found;
            }
          }
          return undefined;
        };
        return findNode(nodes.value);
      },
  );

  // === Actions ===

  /**
   * Загрузить корневые узлы
   */
  async function fetchRoots(entityKey: string, isActive?: boolean): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      nodes.value = await productionUnitApi.getRoots(entityKey, isActive);
    } catch (e) {
      error.value = 'Ошибка загрузки производственных единиц';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Загрузить дочерние узлы (для ленивой загрузки)
   */
  async function fetchChildren(
    parentId: string,
    entityKey: string,
    isActive?: boolean,
  ): Promise<ProductionUnitTreeNode[]> {
    try {
      return await productionUnitApi.getChildren(parentId, entityKey, isActive);
    } catch (e) {
      error.value = 'Ошибка загрузки дочерних элементов';
      throw e;
    }
  }

  /**
   * Загрузить хлебные крошки для узла
   */
  async function fetchBreadcrumbs(unitId: string, entityKey?: string): Promise<void> {
    try {
      breadcrumbs.value = await productionUnitApi.getBreadcrumbs(unitId, entityKey);
    } catch (e) {
      error.value = 'Ошибка загрузки хлебных крошек';
      throw e;
    }
  }

  /**
   * Загрузить детальную информацию
   */
  async function fetchDetail(unitId: string, entityKey?: string): Promise<ProductionUnitDetail> {
    isLoading.value = true;
    try {
      currentDetail.value = await productionUnitApi.getDetail(unitId, entityKey);
      return currentDetail.value;
    } catch (e) {
      error.value = 'Ошибка загрузки информации';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Выбрать узел
   */
  function selectNode(node: ProductionUnitTreeNode | null): void {
    selectedNode.value = node;
    if (node) {
      void fetchBreadcrumbs(node.id, node.entityKey);
    } else {
      breadcrumbs.value = [];
    }
  }

  /**
   * Установить развёрнутые узлы
   */
  function setExpandedNodes(nodeIds: string[]): void {
    expandedNodes.value = nodeIds;
  }

  /**
   * Очистить выбор
   */
  function clearSelection(): void {
    selectedNode.value = null;
    breadcrumbs.value = [];
    currentDetail.value = null;
  }

  /**
   * Обновить дочерние узлы родителя в дереве
   */
  function updateNodeChildren(
    parentId: string,
    children: ProductionUnitTreeNode[],
  ): void {
    const updateInTree = (nodeList: ProductionUnitTreeNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === parentId) {
          node.children = children;
          return true;
        }
        if (node.children && updateInTree(node.children)) {
          return true;
        }
      }
      return false;
    };
    updateInTree(nodes.value);
  }

  return {
    // State
    nodes,
    selectedNode,
    expandedNodes,
    breadcrumbs,
    currentDetail,
    isLoading,
    error,
    // Getters
    hasNodes,
    selectedNodeId,
    getNodeById,
    // Actions
    fetchRoots,
    fetchChildren,
    fetchBreadcrumbs,
    fetchDetail,
    selectNode,
    setExpandedNodes,
    clearSelection,
    updateNodeChildren,
  };
});
