<template>
  <BasePageTemplate class="orders-page" title="Заказы">
    <template #search>
      <!-- Секция поиска -->
    </template>

    <template #tools>
      <!-- Секция инструментов -->
    </template>

    <template #left>
      <EntityTree
        ref="entityTreeRef"
        :entity-key="ORDERS_TREE_KEY"
        title="Производственная структура"
        :fetch-roots="fetchRoots"
        :fetch-children="fetchChildren"
        default-icon="folder"
        @select="handleNodeSelect"
        @dblclick="handleNodeDblClick"
        @create="handleCreateFolder"
        @delete="handleDeleteFolder"
      />
    </template>

    <template #right>
      <!-- Правая панель - здесь будут отображаться заказы выбранной единицы -->
      <div class="orders-content">
        <div v-if="!selectedNode" class="orders-content__empty">
          <q-icon name="receipt_long" size="64px" color="grey-4" />
          <p>Выберите узел производственной структуры для просмотра заказов</p>
        </div>
        <div v-else class="orders-content__selected">
          <div class="orders-content__header">
            <q-icon :name="selectedNode.icon || 'folder'" size="24px" color="primary" />
            <span class="orders-content__title">{{ selectedNode.label }}</span>
            <q-badge
              v-if="selectedNode.code"
              :label="selectedNode.code"
              color="grey-3"
              text-color="grey-8"
            />
          </div>
          <OrdersList :key="selectedNode.id" :production-unit-id="selectedNode.id" />
        </div>
      </div>
    </template>
  </BasePageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { BasePageTemplate } from 'src/shared';
import { EntityTree, useProductionUnitTree, type TreeNode } from 'src/widgets/entity-tree';
import type { CreateFolderPayload } from 'src/widgets';
import { OrdersList } from 'src/widgets/order-list';
import { productionUnitApi } from 'src/entities';

defineOptions({
  name: 'OrdersPage',
});

const ORDERS_TREE_KEY = 'orders';

const $q = useQuasar();
const route = useRoute();

// Ref на компонент дерева
const entityTreeRef = ref<InstanceType<typeof EntityTree> | null>(null);

// Используем composable для дерева производственных единиц
const { fetchRoots, fetchChildren, selectedNode, createUnit, deleteFolder, setTreeRef, store } =
  useProductionUnitTree(ORDERS_TREE_KEY);

// Устанавливаем ссылку на дерево после монтирования
onMounted(async () => {
  if (entityTreeRef.value) {
    setTreeRef(entityTreeRef.value);
  }

  // Проверяем, есть ли groupId в query параметрах
  await handleGroupIdFromQuery();
});

// Следим за изменениями query параметра groupId
watch(
  () => route.query.groupId,
  async () => {
    await handleGroupIdFromQuery();
  }
);

/**
 * Обработка groupId из query параметров
 */
async function handleGroupIdFromQuery(): Promise<void> {
  const groupId = route.query.groupId as string | undefined;

  if (!groupId) return;

  try {
    // Получаем путь к узлу (breadcrumbs)
    const breadcrumbs = await productionUnitApi.getBreadcrumbs(groupId, ORDERS_TREE_KEY);

    // Разворачиваем все родительские узлы
    for (const breadcrumb of breadcrumbs) {
      if (breadcrumb.id !== groupId) {
        store.expandNode(breadcrumb.id);
        // Загружаем дочерние элементы для каждого родителя
        await fetchChildren(breadcrumb.id);
      }
    }

    // Ждем следующего тика для применения изменений
    await nextTick();

    // Находим узел в дереве
    const targetNode = store.findNodeById(groupId);
    if (targetNode) {
      // Выбираем целевой узел
      store.selectNode(targetNode);
    }
  } catch (error) {
    console.error('Failed to open group:', error);
  }
}

/**
 * Обработка выбора узла
 */
function handleNodeSelect(): void {
  // Здесь можно добавить дополнительную логику при выборе узла
}

/**
 * Обработка двойного клика
 */
function handleNodeDblClick(): void {
  // Здесь можно добавить логику для открытия детальной информации
}

/**
 * Обработка создания папки
 */
async function handleCreateFolder(payload: CreateFolderPayload): Promise<void> {
  try {
    await createUnit(payload.name, payload.parentId, payload.type);

    $q.notify({
      type: 'positive',
      message: `Папка "${payload.name}" успешно создана`,
    });

    // Обновляем дерево после создания
    await entityTreeRef.value?.refresh();
  } catch (error) {
    console.error('Failed to create folder:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании папки',
    });
  }
}

/**
 * Обработка удаления папки
 */
async function handleDeleteFolder(payload: { nodeId: string; node: TreeNode }): Promise<void> {
  try {
    await deleteFolder(payload.nodeId);

    $q.notify({
      type: 'positive',
      message: `Папка "${payload.node.label}" удалена вместе с вложенными элементами`,
    });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить папку',
    });
  }
}
</script>

<style lang="scss" scoped>
.orders-page {
  background: #fff;
  height: 100%;
}

.orders-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: #9e9e9e;
    text-align: center;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__selected {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f5f5f5;
    // border-radius: 8px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  &__placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    color: #9e9e9e;

    p {
      margin: 0;
    }
  }
}
</style>





