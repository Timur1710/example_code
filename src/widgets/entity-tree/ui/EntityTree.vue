<template>
  <div class="entity-tree" ref="rootRef">
    <!-- Заголовок -->
    <div v-if="title" class="entity-tree__header">
      <span class="entity-tree__title">{{ title }}</span>
      <div class="entity-tree__header-actions">
        <q-btn
          v-if="showAddButton"
          flat
          dense
          round
          icon="create_new_folder"
          size="sm"
          class="entity-tree__add-btn"
          @click="createRootFolder"
        >
          <q-tooltip>
            {{ 'Создать корневую папку' }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="showRefresh"
          flat
          dense
          round
          icon="refresh"
          size="sm"
          class="entity-tree__refresh"
          :loading="isLoading"
          @click="handleRefresh"
        />
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="isLoading && !hasNodes" class="entity-tree__loading">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="entity-tree__error">
      <q-icon name="error" color="negative" size="24px" />
      <span>{{ error }}</span>
      <q-btn flat dense color="primary" label="Повторить" @click="handleRefresh" />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!hasNodes" class="entity-tree__empty">
      <q-icon name="folder_open" size="48px" color="grey-5" />
      <span>{{ emptyText }}</span>
    </div>

    <!-- Дерево -->
    <q-tree
      v-else
      ref="treeRef"
      v-model:selected="selectedNodeId"
      v-model:expanded="expandedNodeIds"
      :nodes="treeNodes"
      node-key="id"
      label-key="label"
      :filter="filterText"
      :filter-method="customFilter"
      :no-nodes-label="emptyText"
      :no-results-label="noResultsText"
      expand-icon="folder"
      expanded-icon="folder_open"
      class="entity-tree__tree"
      @lazy-load="handleLazyLoad"
      @update:selected="handleSelect"
      @update:expanded="handleExpandChange"
    >
      <!-- Кастомный рендеринг узла -->
      <template #default-header="prop">
        <div
          class="entity-tree__node"
          :data-selected="persistentlySelectedNodeId === prop.node.id"
          @click.stop="handleNodeClick(prop.node)"
          @dblclick.stop="handleDblClick(prop.node)"
          @contextmenu.prevent="contextMenuHandler(prop.node.id)"
        >
          <q-icon
            v-if="showIcons && getNodeIcon(prop.node)"
            :name="getNodeIcon(prop.node)"
            size="xs"
            class="entity-tree__node-icon"
          />
          <span class="entity-tree__node-label">{{ prop.node.label }}</span>
          <q-badge
            v-if="prop.node.code"
            :label="prop.node.code"
            color="grey-4"
            text-color="grey-8"
            class="entity-tree__node-badge"
          />
          <q-menu context-menu>
            <q-list style="min-width: 150px">
              <q-item
                v-if="nodeSupportsChildCreation(prop.node)"
                v-close-popup
                clickable
                @click="addFolderHandler"
              >
                <q-item-section avatar>
                  <q-icon name="add" color="primary" />
                </q-item-section>
                <q-item-section>Добавить</q-item-section>
              </q-item>
              <q-item
                v-if="nodeShowsBulkCreate(prop.node)"
                v-close-popup
                clickable
                @click="bulkCreateHandler"
              >
                <q-item-section avatar>
                  <q-icon name="group_add" color="primary" />
                </q-item-section>
                <q-item-section>Массовое создание</q-item-section>
              </q-item>
              <q-separator v-if="contextMenuHasTopActions(prop.node)" />
              <q-item
                v-if="nodeSupportsChildCreation(prop.node)"
                v-close-popup
                clickable
                @click="editFolderHandler"
              >
                <q-item-section avatar>
                  <q-icon name="edit" color="primary" />
                </q-item-section>
                <q-item-section>Изменить</q-item-section>
              </q-item>
              <q-separator v-if="nodeSupportsChildCreation(prop.node)" />
              <q-item v-close-popup clickable @click="deleteFolderHandler">
                <q-item-section avatar>
                  <q-icon name="delete" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Удалить</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </template>
    </q-tree>

    <!-- Диалог создания папки -->
    <FolderFormDialog
      v-model="isCreateDialogOpen"
      :parent-node="createParentNode"
      :allowed-types="allowedTypes"
      @create="handleCreateFolder"
    />
    <!-- Диалог обновления папки -->
    <FolderFormDialog
      v-model="isUpdateDialogOpen"
      :parent-node="createParentNode"
      :selectedNode="selectedNode"
      :mode="'edit'"
      @updeted="handleUpdateFolder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { QTree } from 'quasar';
import type { TreeNode, FetchRootsFn, FetchChildrenFn } from '../lib/entity-tree.types';
import { getEntityTreeStore } from '../model/entity-tree.store';
import {
  contextMenuHasLeadingSection,
  isBulkCreateMenuShownForNode,
  isChildCreationAllowedForNode,
} from '../config';
import { FolderFormDialog } from 'src/widgets';
import { useProductionUnitTree } from '../lib/useProductionUnitTree';
import { useQuasar } from 'quasar';
import type { UpdateFolderPayload, CreateFolderPayload, ParentNodeInfo } from 'src/widgets';

defineOptions({
  name: 'EntityTree',
});

const $q = useQuasar();

// === Props ===
const props = withDefaults(
  defineProps<{
    /** Идентификатор сущности для store */
    entityKey: string;

    /** Функция загрузки корневых элементов */
    fetchRoots: FetchRootsFn;

    /** Функция загрузки дочерних элементов */
    fetchChildren?: FetchChildrenFn;

    /** Заголовок дерева */
    title?: string;

    /** Иконка по умолчанию */
    defaultIcon?: string;

    /** Показывать иконки */
    showIcons?: boolean;

    /** Показывать кнопку обновления */
    showRefresh?: boolean;

    /** Показывать кнопку добавления папки */
    showAddButton?: boolean;

    /** Включить фильтрацию */
    filterable?: boolean;

    /** Текст при пустом дереве */
    emptyText?: string;

    /** Текст при отсутствии результатов поиска */
    noResultsText?: string;

    /** Загружать данные автоматически при монтировании */
    autoLoad?: boolean;
  }>(),
  {
    defaultIcon: 'folder',
    showIcons: true,
    showRefresh: true,
    showAddButton: true,
    filterable: true,
    emptyText: 'Нет данных',
    noResultsText: 'Ничего не найдено',
    autoLoad: true,
  }
);

// === Emits ===
const emit = defineEmits<{
  (e: 'select', node: TreeNode | null): void;
  (e: 'expand', nodeId: string): void;
  (e: 'collapse', nodeId: string): void;
  (e: 'dblclick', node: TreeNode): void;
  (e: 'loaded'): void;
  (e: 'create', payload: { name: string; parentId: string | null; type: string }): void;
  (e: 'created', createdId: string): void;
  (e: 'delete', payload: { nodeId: string; node: TreeNode }): void;
  (e: 'bulkCreate', payload: { nodeId: string; nodeName: string }): void;
}>();

// === Store ===
const useStore = getEntityTreeStore(props.entityKey);
const store = useStore();

const { createUnit, deleteFolder, updateFolder, fetchAllowedTypes } = useProductionUnitTree(
  props.entityKey
);

// === Refs ===
const treeRef = ref<QTree | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const filterText = ref('');
const isCreateDialogOpen = ref(false);
const isUpdateDialogOpen = ref(false);
const createParentNode = ref<ParentNodeInfo | null>(null);
const allowedTypes = ref<string[]>([]);

// === Computed ===
const treeNodes = computed(() => store.nodes);
const hasNodes = computed(() => treeNodes.value.length > 0);
const isLoading = computed(() => store.isLoading);
const error = computed(() => store.error);

const selectedNodeId = computed({
  get: () => store.selectedNodeId,
  set: (value: string | null) => {
    if (value === null) return; // не снимаем выделение при кликах вне дерева
    const node = store.findNodeById(value);
    if (node) {
      store.selectNode(node);
    }
  },
});

const expandedNodeIds = computed({
  get: () => store.expandedNodes,
  set: (value: string[]) => store.setExpandedNodes(value),
});

const selectedNode = computed(() => store.selectedNode);

// Отслеживание выбранного узла для стилизации
const persistentlySelectedNodeId = ref<string | null>(null);

// === Methods ===

/**
 * Получить иконку узла
 */
function getNodeIcon(node: TreeNode): string {
  // Если узел развернут, показываем открытую папку

  return (node.icon as string) || props.defaultIcon || 'folder';
}

/**
 * Загрузить данные
 */
async function loadData(): Promise<void> {
  store.setLoading(true);
  store.setError(null);

  try {
    const roots = await props.fetchRoots();
    // Помечаем узлы для ленивой загрузки если есть fetchChildren
    const processedRoots = roots.map((node) => ({
      ...node,
      lazy: props.fetchChildren !== undefined && node.expandable !== false,
    }));
    store.setNodes(processedRoots);
    isTreeLoaded.value = true;
    emit('loaded');
    await nextTick();
  } catch (e) {
    store.setError('Ошибка загрузки данных');
    console.error('EntityTree load error:', e);
  } finally {
    store.setLoading(false);
  }
}

/**
 * Обработка ленивой загрузки
 */
async function handleLazyLoad({
  node,
  done,
  fail,
}: {
  node: TreeNode;
  done: (children?: TreeNode[]) => void;
  fail: () => void;
}): Promise<void> {
  if (!props.fetchChildren) {
    done([]);
    return;
  }

  try {
    const children = await props.fetchChildren(node.id);
    // Помечаем дочерние узлы для ленивой загрузки
    const processedChildren = children.map((child) => ({
      ...child,
      lazy: child.expandable !== false,
    }));
    store.updateNodeChildren(node.id, processedChildren);
    done(processedChildren);
    emit('expand', node.id);
  } catch (e) {
    console.error('EntityTree lazy load error:', e);
    fail();
  }
}

/**
 * Обработка выбора узла
 */
function handleSelect(nodeId: string | null): void {
  if (nodeId === null) {
    // q-tree пытается снять выделение при клике вне; сохраняем текущее выделение
    persistentlySelectedNodeId.value = store.selectedNodeId;
    return;
  }

  const node = store.findNodeById(nodeId);
  if (node) {
    store.selectNode(node);
    persistentlySelectedNodeId.value = node.id;
    emit('select', node);
  }
}

/**
 * Обработка клика на ноду — только выбор
 */
function handleNodeClick(node: TreeNode): void {
  handleSelect(node.id);
}

/**
 * Обработка двойного клика
 */
function handleDblClick(node: TreeNode): void {
  toggleExpand(node);
  emit('dblclick', node);
}

/**
 * Переключить раскрытие узла
 */
function toggleExpand(node: TreeNode): void {
  const isExpanded = expandedNodeIds.value.includes(node.id);
  const nextState = !isExpanded;

  // Используем API q-tree, чтобы корректно отрабатывать lazy-load на глубоких уровнях
  if (treeRef.value) {
    treeRef.value.setExpanded(node.id, nextState);
  } else {
    if (nextState) {
      store.expandNode(node.id);
    } else {
      store.collapseNode(node.id);
    }
  }

  if (nextState) {
    emit('expand', node.id);
  } else {
    emit('collapse', node.id);
  }
}

/**
 * Обработка изменения состояния expanded (когда открывают через стрелку)
 */
function handleExpandChange(expanded: readonly string[]): void {
  // Обновляем store при изменении expanded через стрелку
  store.setExpandedNodes([...expanded] as string[]);
}

/**
 * Обновить данные
 */
async function handleRefresh(): Promise<void> {
  await loadData();
}

/**
 * Кастомная фильтрация
 */
function customFilter(node: TreeNode, filter: string): boolean {
  const label = node.label?.toLowerCase() || '';
  const code = (node.code as string)?.toLowerCase() || '';
  const search = filter.toLowerCase();
  return label.includes(search) || code.includes(search);
}

/**
 * Открыть диалог создания папки
 */
function openCreateDialog(): void {
  isCreateDialogOpen.value = true;
}

/**
 * Открыть диалог изменения папки
 */
function openUpdateDialog(): void {
  isUpdateDialogOpen.value = true;
}

/**
 * Создать узел в корне дерева
 */
async function createRootFolder() {
  createParentNode.value = null;
  try {
    const { allowedTypes: types } = await fetchAllowedTypes(null);
    allowedTypes.value = types;
    if (types.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Нет допустимых типов узла для создания в корне дерева',
      });
      return;
    }
  } catch {
    allowedTypes.value = [];
    $q.notify({
      type: 'warning',
      message: 'Не удалось получить допустимые типы узлов',
    });
    return;
  }
  openCreateDialog();
}

/**
 * Обработка создания папки из диалога
 */
async function handleCreateFolder(payload: CreateFolderPayload): Promise<void> {
  try {
    const { _id } = await createUnit(payload.name, payload.parentId, payload.type);
    $q.notify({
      type: 'positive',
      message: `"${payload.name}" успешно создан`,
    });
    // Обновляем дерево после создания
    if (payload.parentId) {
      await reloadChildren(payload.parentId, _id);
    } else {
      await loadData();
      handleSelect(_id);
    }
  } catch (error) {
    console.error('Failed to create unit:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании узла',
    });
  }
}

async function reloadChildren(parentId: string, selectedId?: string) {
  if (!props.fetchChildren) return;
  if (!expandedNodeIds.value.includes(parentId)) {
    expandedNodeIds.value = [...expandedNodeIds.value, parentId];
  }
  const children = await props.fetchChildren(parentId);
  const processedChildren = children.map((child) => ({
    ...child,
    lazy: child.expandable !== false,
  }));
  store.updateNodeChildren(parentId, processedChildren);
  if (selectedId) {
    await nextTick();
    handleSelect(selectedId);
  }
}
const isTreeLoaded = ref(false);
async function expandTreeToSelected() {
  if (!store.selectedNode || !store.selectedNode.path || !treeRef.value) return;
  const pathIds = store.selectedNode?.path.split('/').filter(Boolean); // получаем массив ID узлов

  for (const id of pathIds) {
    const node = store.findNodeById(id);
    if (!node) continue;
    if (
      node &&
      node.lazy &&
      (!node.children || node.children.length === 0) &&
      props.fetchChildren
    ) {
      const children = await props.fetchChildren(id);
      node.children = children.map((c) => ({ ...c, lazy: c.expandable !== false }));
      store.updateNodeChildren(id, node.children);
      await nextTick();
    }
    if (id !== selectedNodeId.value) {
      expandedNodeIds.value = [...expandedNodeIds.value, id];
      treeRef.value.setExpanded(id, true);
      await nextTick();
    }
  }
}

async function handleUpdateFolder(payload: UpdateFolderPayload) {
  if (!selectedNodeId.value) return;
  try {
    const id = selectedNode.value?.id;
    const parentId = selectedNode.value?.parentId;
    await updateFolder(selectedNodeId.value, payload.name);
    $q.notify({
      type: 'positive',
      message: `Папка "${selectedNode.value?.label}" успешно переименована на "${payload.name}"`,
    });
    // Обновляем дерево после изменения папки
    if (parentId) {
      await reloadChildren(parentId, id);
    } else {
      await loadData();
    }
  } catch (error) {
    console.error('Failed to updete folder:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при изменении папки',
    });
  }
}

/**
 * Обработка удаления папки
 */
function handleDeleteClick(id: string, label: string): void {
  $q.dialog({
    title: 'Удалить папку',
    message: `Удалить папку "${label}" и все вложенные элементы? Действие нельзя отменить.`,
    cancel: {
      flat: true,
      label: 'Отмена',
      color: 'primary',
    },
    ok: {
      label: 'Удалить',
      color: 'negative',
    },
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const parentId = selectedNode.value?.parentId;
        await deleteFolder(id);
        $q.notify({
          type: 'positive',
          message: `Папка "${label}" удалена вместе с вложенными элементами`,
        });
        if (parentId) {
          // Для перезагрузки детей для parentId после удаления (также передаем parentId вторым агрументом для его выделения)
          await reloadChildren(parentId, parentId);
        } else {
          await loadData();
        }
      } catch (error) {
        console.error('Failed to delete folder:', error);
        $q.notify({
          type: 'negative',
          message: 'Не удалось удалить папку',
        });
      }
    })();
  });
}

/**
 * Сброс выбранной ноды и оповещение родителя
 */
/*
function clearSelection(): void {
  store.clearSelection();
  emit('select', null);
}*/

/**
 * Снятие выделения при клике вне компонента
 */
function handleClickOutside(): void {
  /*
  const root = rootRef.value;
  if (!root) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;

  // Игнорируем клики внутри дерева или диалога создания папки
  if (root.contains(target)) return;
  if (target.closest('.folder-form-dialog')) return;

  if (store.selectedNodeId) {
    clearSelection();
  }*/
}

/**
 * Обработчик контекстного меню (выбор id папки)
 */
function contextMenuHandler(nodeId: string) {
  handleSelect(nodeId);
}

/** Обёртки над политикой меню (`config/entity-tree-menu.policy.ts`) — только проброс entityKey. */
function nodeSupportsChildCreation(node: TreeNode): boolean {
  return isChildCreationAllowedForNode(props.entityKey, node.type);
}

function nodeShowsBulkCreate(node: TreeNode): boolean {
  return isBulkCreateMenuShownForNode(props.entityKey, node.type);
}

function contextMenuHasTopActions(node: TreeNode): boolean {
  return contextMenuHasLeadingSection(props.entityKey, node.type);
}

/**
 * Добавление папки из контекстного меню
 */
async function addFolderHandler() {
  if (!selectedNode.value || !nodeSupportsChildCreation(selectedNode.value)) {
    return;
  }
  createParentNode.value = {
    id: selectedNode.value.id,
    label: selectedNode.value.label,
    icon: selectedNode.value.icon as string,
  };
  try {
    const { allowedTypes: types } = await fetchAllowedTypes(selectedNode.value.id);
    allowedTypes.value = types;
    if (types.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Для выбранного узла нельзя создать дочерний элемент',
      });
      return;
    }
  } catch {
    allowedTypes.value = [];
    $q.notify({
      type: 'warning',
      message: 'Не удалось получить допустимые типы узлов',
    });
    return;
  }
  openCreateDialog();
}

/**
 * Изменение папки из контекстного меню
 */
function editFolderHandler() {
  if (!selectedNode.value || !nodeSupportsChildCreation(selectedNode.value)) {
    return;
  }
  openUpdateDialog();
}

/**
 * Массовое создание из контекстного меню
 */
function bulkCreateHandler() {
  if (!selectedNode.value) return;
  emit('bulkCreate', {
    nodeId: selectedNode.value.id,
    nodeName: selectedNode.value.label,
  });
}

/**
 * Удаление папки из контекстного меню
 */
function deleteFolderHandler() {
  if (!selectedNode.value) return;
  handleDeleteClick(selectedNode.value.id, selectedNode.value.label);
}

// === Expose ===
defineExpose({
  /** Перезагрузить данные */
  refresh: handleRefresh,
  /** Получить store */
  getStore: () => store,
  /** Получить ссылку на q-tree */
  getTreeRef: () => treeRef.value,
});

// === Lifecycle ===
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  if (props.autoLoad) {
    void loadData();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Синхронизация фильтра со store
watch(filterText, (value) => {
  store.setFilter(value);
});

// При смене entityKey (если компонент переиспользуют с другим ключом) сбрасываем состояние и перезагружаем
watch(
  () => props.entityKey,
  async () => {
    store.reset();
    if (props.autoLoad) {
      await loadData();
    }
  }
);

watch(
  () => store.selectedNode,
  (node) => {
    if (node?.id) {
      persistentlySelectedNodeId.value = node.id;
    }
  },
  { immediate: true }
);

watch(
  [() => store.selectedNodeId, isTreeLoaded],
  async ([id, loaded]) => {
    if (!id || !loaded) return;
    await nextTick();
    await expandTreeToSelected();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.entity-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  border-radius: 8px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #fff;
    border-radius: 8px 8px 0 0;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  &__add-btn {
    color: #1976d2;
  }

  &__refresh {
    color: #666;
  }

  &__delete-btn {
    color: #c62828;
  }

  &__filter {
    padding: 12px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
  }

  &__filter-input {
    :deep(.q-field__control) {
      border-radius: 6px;
    }
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px;
    color: #666;
    text-align: center;
    flex: 1;
  }

  &__error {
    color: #c10015;
  }

  &__tree {
    flex: 1;
    overflow: auto;
    padding: 8px;

    :deep(.q-tree__node-header) {
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
      width: 100%;
    }

    :deep(.q-tree__node-header:hover) {
      background: #eef2fb;
    }

    :deep(.q-tree__node-header:has(.entity-tree__node[data-selected='true'])) {
      background: #cbcbcb;
    }
  }

  &__node {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    padding: 4px 8px;
    margin: -4px -8px;
    border-radius: 6px;
    transition: background-color 0.15s;
    width: 100%;
    background: transparent;
  }

  &__node-icon {
    color: #5f6368;
    flex-shrink: 0;
  }

  &__node-label {
    font-size: 13px;
    color: #202124;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__node-badge {
    font-size: 10px;
    padding: 2px 6px;
    flex-shrink: 0;
  }
}
</style>
