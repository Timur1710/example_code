<template>
  <BasePageTemplate class="workers-page" title="Сотрудники">
    <template #search>
      <!-- Секция поиска -->
    </template>

    <template #tools>
      <!-- Секция инструментов -->
    </template>

    <template #left>
      <EntityTree
        ref="entityTreeRef"
        :entity-key="WORKERS_TREE_KEY"
        title="Оргструктура"
        :fetch-roots="fetchRoots"
        :fetch-children="fetchChildren"
        default-icon="folder"
        @select="handleNodeSelect"
        @dblclick="handleNodeDblClick"
        @create="handleCreateFolder"
        @delete="handleDeleteFolder"
        @bulk-create="handleBulkCreate"
      />
    </template>

    <template #right>
      <!-- Правая панель - здесь будут отображаться работники выбранной единицы -->
      <div class="workers-content">
        <div v-if="!selectedNode" class="workers-content__empty">
          <q-icon name="people" size="64px" color="grey-4" />
          <p>Выберите узел оргструктуры для просмотра работников</p>
        </div>
        <div v-else class="workers-content__selected">
          <div class="workers-content__header">
            <q-icon :name="selectedNode.icon || 'folder'" size="24px" color="primary" />
            <span class="workers-content__title">{{ selectedNode.label }}</span>
            <q-badge
              v-if="selectedNode.code"
              :label="selectedNode.code"
              color="grey-3"
              text-color="grey-8"
            />
          </div>
          <WorkersList
            :key="selectedNode.id"
            :production-unit-id="selectedNode.id"
            :selected-node-type="(selectedNode.type as string) ?? null"
            @delete="handleDeleteWorker"
          />
        </div>
      </div>
    </template>
  </BasePageTemplate>

  <BulkWorkerFormDialog
    v-model="isBulkCreateDialogOpen"
    :production-unit-id="bulkCreateNodeId"
    :default-name="bulkCreateDefaultName"
    @created="handleBulkCreateSuccess"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { BasePageTemplate } from 'src/shared';
import { EntityTree, useProductionUnitTree, type TreeNode } from 'src/widgets/entity-tree';
import type { CreateFolderPayload } from 'src/widgets';
import { WorkersList } from 'src/widgets/workers-list';
import { BulkWorkerFormDialog } from 'src/widgets';
import { useWorkerStore } from 'src/entities/worker';
import type { WorkerListItem } from 'src/entities/worker/model/worker.types';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { productionUnitApi } from 'src/entities';

defineOptions({
  name: 'WorkersPage',
});

const WORKERS_TREE_KEY = 'workers';

const $q = useQuasar();
const route = useRoute();

// Worker store для операций с работниками
const workerStore = useWorkerStore();

// Ref на компонент дерева
const entityTreeRef = ref<InstanceType<typeof EntityTree> | null>(null);

// Используем composable для дерева производственных единиц
const { fetchRoots, fetchChildren, selectedNode, createUnit, deleteFolder, setTreeRef, store } =
  useProductionUnitTree(WORKERS_TREE_KEY);

// Массовое создание работников
const isBulkCreateDialogOpen = ref(false);
const bulkCreateNodeId = ref<string | null>(null);
const bulkCreateDefaultName = ref('');

function handleBulkCreate(payload: { nodeId: string; nodeName: string }) {
  bulkCreateNodeId.value = payload.nodeId;
  bulkCreateDefaultName.value = payload.nodeName;
  isBulkCreateDialogOpen.value = true;
}

async function handleBulkCreateSuccess() {
  // Обновляем список работников через перевыбор текущего узла
  await entityTreeRef.value?.refresh();
}

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
    const breadcrumbs = await productionUnitApi.getBreadcrumbs(groupId, WORKERS_TREE_KEY);

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
  // Например, загрузку работников для выбранной единицы
}

/**
 * Обработка двойного клика
 */
function handleNodeDblClick(): void {
  // Здесь можно добавить логику для открытия детальной информации
}

/**
 * Обработка удаления работника
 */
async function handleDeleteWorker(row: TableRow): Promise<void> {
  const worker = row as unknown as WorkerListItem;

  const confirmed = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Подтверждение удаления',
      message: `Вы действительно хотите удалить работника "${worker.name}"?`,
      cancel: {
        label: 'Отмена',
        color: 'primary',
        flat: true,
      },
      ok: {
        label: 'Удалить',
        color: 'negative',
      },
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

  if (!confirmed) return;

  try {
    await workerStore.deleteWorker(worker._id);

    $q.notify({
      type: 'positive',
      message: `Работник "${worker.name}" успешно удален`,
    });
  } catch (error) {
    console.error('Failed to delete worker:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить работника',
    });
  }
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
.workers-page {
  background: #fff;
  height: 100%;
}

.workers-content {
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
