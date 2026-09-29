/**
 * Универсальный store для синхронизации состояния дерева между компонентами
 * Используется для связи левой панели (дерево) с правой панелью (контент)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TreeNode } from '../lib/entity-tree.types';

/**
 * Фабрика для создания store под конкретную сущность
 * Позволяет иметь независимые store для разных страниц/сущностей
 */
export function createEntityTreeStore(storeId: string) {
  return defineStore(`entityTree-${storeId}`, () => {
    // === State ===
    const nodes = ref<TreeNode[]>([]);
    const selectedNode = ref<TreeNode | null>(null);
    const expandedNodes = ref<string[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const filter = ref('');

    // === Getters ===
    const hasSelection = computed(() => selectedNode.value !== null);

    const selectedNodeId = computed(() => selectedNode.value?.id ?? null);

    const isExpanded = computed(
      () => (nodeId: string) => expandedNodes.value.includes(nodeId),
    );

    // === Actions ===

    /**
     * Установить узлы дерева
     */
    function setNodes(newNodes: TreeNode[]): void {
      nodes.value = newNodes;
    }

    /**
     * Выбрать узел
     */
    function selectNode(node: TreeNode | null): void {
      selectedNode.value = node;
    }

    /**
     * Очистить выбор
     */
    function clearSelection(): void {
      selectedNode.value = null;
    }

    /**
     * Добавить развёрнутый узел
     */
    function expandNode(nodeId: string): void {
      if (!expandedNodes.value.includes(nodeId)) {
        expandedNodes.value.push(nodeId);
      }
    }

    /**
     * Убрать узел из развёрнутых
     */
    function collapseNode(nodeId: string): void {
      const index = expandedNodes.value.indexOf(nodeId);
      if (index > -1) {
        expandedNodes.value.splice(index, 1);
      }
    }

    /**
     * Установить все развёрнутые узлы
     */
    function setExpandedNodes(nodeIds: string[]): void {
      expandedNodes.value = nodeIds;
    }

    /**
     * Установить состояние загрузки
     */
    function setLoading(loading: boolean): void {
      isLoading.value = loading;
    }

    /**
     * Установить ошибку
     */
    function setError(err: string | null): void {
      error.value = err;
    }

    /**
     * Установить фильтр
     */
    function setFilter(value: string): void {
      filter.value = value;
    }

    /**
     * Обновить дочерние узлы родителя
     */
    function updateNodeChildren(
      parentId: string,
      children: TreeNode[],
    ): void {
      const updateInTree = (nodeList: TreeNode[]): boolean => {
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

    /**
     * Найти узел по ID
     */
    function findNodeById(id: string): TreeNode | undefined {
      const findInTree = (nodeList: TreeNode[]): TreeNode | undefined => {
        for (const node of nodeList) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      return findInTree(nodes.value);
    }

    /**
     * Сбросить состояние
     */
    function reset(): void {
      nodes.value = [];
      selectedNode.value = null;
      expandedNodes.value = [];
      isLoading.value = false;
      error.value = null;
      filter.value = '';
    }

    return {
      // State
      nodes,
      selectedNode,
      expandedNodes,
      isLoading,
      error,
      filter,
      // Getters
      hasSelection,
      selectedNodeId,
      isExpanded,
      // Actions
      setNodes,
      selectNode,
      clearSelection,
      expandNode,
      collapseNode,
      setExpandedNodes,
      setLoading,
      setError,
      setFilter,
      updateNodeChildren,
      findNodeById,
      reset,
    };
  });
}

const entityTreeStores: Record<string, ReturnType<typeof createEntityTreeStore>> = {};

/**
 * Получить (или создать) store по ключу сущности
 */
export function getEntityTreeStore(storeId: string) {
  if (!entityTreeStores[storeId]) {
    entityTreeStores[storeId] = createEntityTreeStore(storeId);
  }

  return entityTreeStores[storeId];
}

/**
 * Store по умолчанию для общего использования
 */
export const useEntityTreeStore = getEntityTreeStore('default');
