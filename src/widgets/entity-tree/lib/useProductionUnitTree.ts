/**
 * Composable для использования дерева производственных единиц
 * Предоставляет готовые функции для EntityTree компонента
 */

import { computed, ref } from 'vue';
import { productionUnitApi, ProductionUnitIcons, ProductionUnitType } from 'src/entities';
import type { ProductionUnitTreeNode, CreateProductionUnitResponse, ProductionUnitResponseDto } from 'src/entities';
import { getEntityTreeStore } from '../model/entity-tree.store';
import type { TreeNode } from '../lib/entity-tree.types';
import type { AllowedChildTypesDto } from 'src/entities';

/**
 * Store для дерева производственных единиц
 */
export const useProductionUnitTreeStore = getEntityTreeStore('productionUnit');

/**
 * Composable для работы с деревом производственных единиц
 */
export function useProductionUnitTree(storeKey = 'productionUnit', entityKey?: string) {
  const store = getEntityTreeStore(storeKey)();
  const treeRef = ref<{ refresh: () => Promise<void> } | null>(null);
  const normalizedEntityKey = (entityKey || storeKey || 'common').trim();

  /**
   * Загрузить корневые элементы
   */
  async function fetchRoots(): Promise<TreeNode[]> {
    const roots = await productionUnitApi.getRoots(normalizedEntityKey, true);
    // Добавляем иконки на основе типа
    return roots.map((node: ProductionUnitTreeNode) => ({
      ...node,
      icon: ProductionUnitIcons[node.type as ProductionUnitType] || 'folder',
      expandable: node.expandable !== false,
    }));
  }

  /**
   * Загрузить дочерние элементы
   */
  async function fetchChildren(parentId: string): Promise<TreeNode[]> {
    const children = await productionUnitApi.getChildren(
      parentId,
      normalizedEntityKey,
      true,
    );
    // Добавляем иконки на основе типа
    return children.map((node: ProductionUnitTreeNode) => ({
      ...node,
      icon: ProductionUnitIcons[node.type as ProductionUnitType] || 'folder',
      expandable: node.expandable !== false,
    }));
  }

  /**
   * Получить допустимые дочерние типы для родителя
   */
  async function fetchAllowedTypes(parentId?: string | null): Promise<AllowedChildTypesDto> {
    return productionUnitApi.getAllowedTypes(normalizedEntityKey, parentId);
  }

  /**
   * Создать производственную единицу
   */
  async function createUnit(
    name: string,
    parentId: string | null,
    type: ProductionUnitType | string = ProductionUnitType.FOLDER
  ): Promise<CreateProductionUnitResponse> {
    return productionUnitApi.create({
      name,
      entityKey: normalizedEntityKey,
      type,
      parentId,
      isActive: true,
    });
  }

  /**
   * Создать папку (обратная совместимость)
   */
  async function createFolder(
    name: string,
    parentId: string | null
  ): Promise<CreateProductionUnitResponse> {
    return createUnit(name, parentId, ProductionUnitType.FOLDER);
  }

  /**
   * Удалить папку (производственную единицу) вместе с дочерними
   */
  async function deleteFolder(unitId: string): Promise<void> {
    await productionUnitApi.delete(unitId, true, normalizedEntityKey);
    store.clearSelection();
    await refreshTree();
  }

  /**
   * Обновить папку (производственную единицу)
   */
  async function updateFolder(id: string, name: string): Promise<ProductionUnitResponseDto> {
    const result = await productionUnitApi.update({ id, name })
    return result
  }

  /**
   * Обновить дерево
   */
  async function refreshTree(): Promise<void> {
    if (treeRef.value) {
      await treeRef.value.refresh();
    }
  }

  /**
   * Установить ссылку на компонент дерева
   */
  function setTreeRef(ref: { refresh: () => Promise<void> } | null): void {
    treeRef.value = ref;
  }

  /**
   * Выбранный узел
   */
  const selectedNode = computed(() => store.selectedNode);

  /**
   * ID выбранного узла
   */
  const selectedNodeId = computed(() => store.selectedNodeId);

  /**
   * Есть ли выбранный узел
   */
  const hasSelection = computed(() => store.hasSelection);

  /**
   * Загрузка
   */
  const isLoading = computed(() => store.isLoading);

  return {
    // Store
    store,
    // Ref для дерева
    treeRef,
    setTreeRef,
    // Функции для EntityTree
    fetchRoots,
    fetchChildren,
    fetchAllowedTypes,
    // Действия
    createUnit,
    createFolder,
    deleteFolder,
    updateFolder,
    refreshTree,
    // Computed
    selectedNode,
    selectedNodeId,
    hasSelection,
    isLoading,
  };
}
