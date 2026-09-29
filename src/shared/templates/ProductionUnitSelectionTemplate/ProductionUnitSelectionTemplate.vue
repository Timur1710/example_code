<template>
  <div class="production-unit-selection-template">
    <!-- Дерево производственных единиц -->
    <div class="tree-container">
      <div v-if="isLoading" class="tree-loading">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else-if="error" class="tree-error">
        <q-icon name="error" color="negative" size="24px" />
        <span>{{ error }}</span>
      </div>

      <div v-else-if="!hasNodes" class="tree-empty">
        <q-icon name="folder_open" size="48px" color="grey-5" />
        <span>{{ emptyTextValue }}</span>
      </div>

      <q-tree
        v-else
        ref="treeRef"
        v-model:selected="selectedNodeId"
        v-model:expanded="expandedNodeIds"
        :nodes="treeNodes"
        node-key="id"
        label-key="label"
        :no-nodes-label="emptyTextValue"
        :no-results-label="noResultsTextValue"
        expand-icon="folder"
        expanded-icon="folder_open"
        class="production-unit-tree"
        @lazy-load="handleLazyLoad"
        @update:selected="handleSelect"
      >
        <template #default-header="prop">
          <div
            class="tree-node"
            :class="{ 'tree-node--selected': selectedNodeId === prop.node.id }"
            @click.stop="handleNodeClick(prop.node)"
          >
            <q-icon :name="prop.node.icon || 'folder'" size="xs" class="tree-node__icon" />
            <span class="tree-node__label">{{ prop.node.label }}</span>
          </div>
        </template>
      </q-tree>
    </div>

    <!-- Информация о выбранной группе -->
    <div v-if="selectedGroup" class="selected-group">
      <q-separator class="q-my-md" />
      <div class="selected-group__content">
        <q-icon name="check_circle" color="positive" size="20px" />
        <div class="selected-group__text">
          <span class="selected-group__label">{{ t('selected_group') }}:</span>
          <span class="selected-group__name">{{ selectedGroup.name }}</span>
        </div>
      </div>
    </div>

    <!-- Кнопка сохранения -->
    <div class="actions">
      <q-btn :label="t('cancel')" color="grey" flat @click="emit('cancel')" />
      <q-btn :label="t('save')" color="primary" :disable="!selectedGroup" @click="handleConfirm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTree, QTreeLazyLoadParams } from 'quasar';
import { productionUnitApi } from 'src/entities/production-unit';
import type { ProductionUnitTreeNode } from 'src/entities/production-unit';
import type { ProductionUnitSelectionTemplateProps } from './model/types';

const props = withDefaults(defineProps<ProductionUnitSelectionTemplateProps>(), {
  isActive: true,
  loading: false,
});

const emit = defineEmits<{
  select: [groupId: string, groupName: string];
  confirm: [groupId: string, groupName: string];
  cancel: [];
}>();

const { t } = useI18n();

// Refs
const treeRef = ref<QTree>();
const treeNodes = ref<ProductionUnitTreeNode[]>([]);
const selectedNodeId = ref<string | null>(null);
const expandedNodeIds = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Вычисляемые значения
const emptyTextValue = computed(() => props.emptyText ?? t('no_groups'));
const noResultsTextValue = computed(() => props.noResultsText ?? t('no_results'));
const hasNodes = computed(() => treeNodes.value.length > 0);

const selectedGroup = computed(() => {
  if (!selectedNodeId.value) return null;

  const findNode = (nodes: ProductionUnitTreeNode[]): ProductionUnitTreeNode | null => {
    for (const node of nodes) {
      if (node.id === selectedNodeId.value) return node;
      if (node.children) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const node = findNode(treeNodes.value);
  return node ? { id: node.id, name: node.label } : null;
});

// Загрузка корневых элементов
const loadRoots = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const roots = await productionUnitApi.getRoots(props.entityKey, props.isActive);
    treeNodes.value = roots.map((node) => ({
      ...node,
      lazy: node.expandable ?? false,
    }));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : t('error_loading_tree');
    error.value = errorMessage;
    console.error('Failed to load production unit tree:', err);
  } finally {
    isLoading.value = false;
  }
};

// Ленивая загрузка дочерних элементов
const handleLazyLoad = async ({ node, done }: QTreeLazyLoadParams) => {
  try {
    const children = await productionUnitApi.getChildren(
      node.id as string,
      props.entityKey,
      props.isActive
    );

    const childNodes = children.map((child) => ({
      ...child,
      lazy: child.expandable ?? false,
    }));

    done(childNodes);
  } catch (err) {
    console.error('Failed to load children:', err);
    done([]);
  }
};

// Обработка выбора узла
const handleNodeClick = (node: ProductionUnitTreeNode) => {
  selectedNodeId.value = node.id;
  emit('select', node.id, node.label);
};

const handleSelect = (nodeId: string | null) => {
  if (nodeId && selectedGroup.value) {
    emit('select', selectedGroup.value.id, selectedGroup.value.name);
  }
};

// Подтверждение выбора
const handleConfirm = () => {
  if (selectedGroup.value) {
    emit('confirm', selectedGroup.value.id, selectedGroup.value.name);
  }
};

// Инициализация
onMounted(() => {
  void loadRoots();
});

// Перезагрузка при изменении entityKey
watch(
  () => props.entityKey,
  () => {
    selectedNodeId.value = null;
    expandedNodeIds.value = [];
    void loadRoots();
  }
);
</script>

<style scoped lang="scss">
.production-unit-selection-template {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;

  .tree-container {
    flex: 1;
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
  }

  .tree-loading,
  .tree-error,
  .tree-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 16px;
    text-align: center;
    color: #666;
  }

  .production-unit-tree {
    .tree-node {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &--selected {
        background-color: #e3f2fd;
      }

      &__icon {
        color: #1976d2;
      }

      &__label {
        flex: 1;
        font-size: 14px;
      }
    }
  }

  .selected-group {
    &__content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: #f1f8e9;
      border-radius: 4px;
    }

    &__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    &__label {
      font-size: 12px;
      color: #666;
    }

    &__name {
      font-size: 14px;
      font-weight: 500;
      color: #2e7d32;
    }
  }

  .actions {
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
  }
}
</style>
