<template>
  <div class="workers-block">
    <q-expansion-item
      v-model="mainExpanded"
      :label="isEditing ? t('workers') : `${t('workers')} (${workers.length})`"
      icon="person"
      :header-class="isEditing ? 'bg-green-1' : ''"
    >
      <div class="resource-group">
        <!-- Кнопка добавления в режиме редактирования -->
        <div v-if="isEditing" class="resource-group__header">
          <div class="resource-group__controls">
            <q-toggle v-model="isGroupMode" :label="t('group_mode')" color="primary" size="sm" />
            <q-btn
              :label="isGroupMode ? t('add_worker_group') : t('add_worker')"
              :icon="isGroupMode ? 'group_add' : 'add'"
              :color="isGroupMode ? 'secondary' : 'primary'"
              size="sm"
              @click="openDialog"
            />
          </div>
        </div>

        <!-- Пустое состояние -->
        <div v-if="workers.length === 0" class="no-resources">
          {{ t('no_workers') }}
        </div>

        <!-- Список работников в режиме редактирования -->
        <q-list v-else-if="isEditing" bordered separator>
          <q-expansion-item
            v-for="resource in workers"
            :key="resource.r_id"
            :model-value="expandedItems[resource.r_id] ?? false"
            @update:model-value="(val) => (expandedItems[resource.r_id] = val)"
            :label="resource.name"
            icon="person"
          >
            <template #header>
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ resource.name }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  icon="delete"
                  flat
                  dense
                  round
                  color="negative"
                  @click.stop="$emit('remove', resource.r_id)"
                >
                  <q-tooltip>{{ t('delete') }}</q-tooltip>
                </q-btn>
              </q-item-section>
            </template>

            <q-card>
              <q-card-section>
                <ResourceConditionParamsForm
                  v-if="resource.conditions?.[0]"
                  resource-type="worker"
                  :condition="resource.conditions[0]"
                  :show-actions="false"
                  @save="(params) => $emit('update-params', resource.r_id, params)"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>

        <!-- Список работников в режиме просмотра -->
        <q-list v-else bordered separator>
          <q-item
            v-for="resource in workers"
            :key="resource.r_id"
            clickable
            @click="navigateToWorker(resource)"
          >
            <q-item-section avatar>
              <q-icon name="person" color="green" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <span v-if="resource.conditions?.[0]?.group" class="resource-group-label"
                  >Группа </span
                >{{ resource.name }}
              </q-item-label>
              <q-item-label caption>
                {{ formatResourceInfo(resource) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-expansion-item>

    <!-- Диалог выбора работников -->
    <q-dialog v-model="dialogVisible" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">{{ t('select_workers') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <ResourceSelectionTemplate
            resource-type="worker"
            :items="items"
            :selected-items="selectedIds"
            :pagination="pagination"
            :loading="loading"
            @search="handleSearch"
            @pagination="handlePagination"
            @toggle="handleToggle"
            @select-all="handleSelectAll"
            @confirm="handleConfirm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn :label="t('close')" color="grey" flat @click="closeDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог выбора группы работников -->
    <ProductionUnitSelectionDialog
      v-model="groupDialogVisible"
      entity-key="workers"
      :title="t('select_worker_group')"
      @confirm="handleGroupConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { OperationResource, ResourceCondition } from 'src/entities/operation';
import { useWorkerStore } from 'src/entities/worker';
import ResourceConditionParamsForm from '../../ui/ResourceConditionParamsForm.vue';
import { ResourceSelectionTemplate, ProductionUnitSelectionDialog } from 'src/shared/templates';

interface Props {
  workers: OperationResource[];
  isEditing: boolean;
}

interface Emits {
  (e: 'add', resources: OperationResource[]): void;
  (e: 'remove', resourceId: string): void;
  (e: 'update-params', resourceId: string, params: Partial<ResourceCondition>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const router = useRouter();
const workerStore = useWorkerStore();

// Состояния expansion-item'ов
const mainExpanded = ref(false);
const expandedItems = ref<Record<string, boolean>>({});

// Состояние режима группы (должно быть объявлено перед watcher'ами)
const isGroupMode = ref(false);

// Инициализируем состояния всех expansion-item'ов
const initializeExpandedItems = () => {
  const newExpandedItems: Record<string, boolean> = {};
  props.workers.forEach((worker) => {
    newExpandedItems[worker.r_id] = props.isEditing;
  });
  expandedItems.value = newExpandedItems;
};

// Открываем все expansion-item'ы при включении режима редактирования
watch(
  () => props.isEditing,
  (newValue) => {
    mainExpanded.value = newValue;
    if (newValue) {
      initializeExpandedItems();
    }
  },
  { immediate: true }
);

watch(
  () => props.workers.map((w) => w.r_id),
  () => {
    if (props.isEditing) {
      props.workers.forEach((worker) => {
        if (!(worker.r_id in expandedItems.value)) {
          expandedItems.value[worker.r_id] = true;
        }
      });
    } else {
      // Только в режиме просмотра - обновляем isGroupMode на основе данных
      const hasGroups = props.workers.some((worker) => worker.conditions?.[0]?.group === true);
      isGroupMode.value = hasGroups;
    }
  },
  { immediate: true }
);

// Сбрасываем всех работников при переключении режима группы
watch(
  () => isGroupMode.value,
  (newValue, oldValue) => {
    // Сбрасываем только при явном переключении пользователем в режиме редактирования
    if (oldValue !== undefined && newValue !== oldValue && props.isEditing && props.workers.length > 0) {
      // Берем копию ids перед удалением
      const idsToRemove = props.workers.map((worker) => worker.r_id);
      idsToRemove.forEach((id) => {
        emit('remove', id);
      });
    }
  }
);

const dialogVisible = ref(false);
const groupDialogVisible = ref(false);
const items = ref<Array<{ _id: string; name: string; description?: string }>>([]);
const selectedIds = ref<string[]>([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  pagesNumber: 1,
});

const openDialog = async () => {
  if (isGroupMode.value) {
    // Открываем диалог выбора группы
    groupDialogVisible.value = true;
  } else {
    // Открываем диалог выбора работников
    dialogVisible.value = true;
    selectedIds.value = props.workers.map((w) => w.r_id);
    await loadWorkers();
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  items.value = [];
  selectedIds.value = [];
};

const loadWorkers = async (search = '') => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      rowsPerPage: pagination.value.rowsPerPage,
      search,
      includeDescendants: true,
    };

    const response = await workerStore.fetchAll(params);

    if (response) {
      items.value = response.data.map(
        (item: { _id: string; name: string; description?: string | null }) => {
          const result: { _id: string; name: string; description?: string } = {
            _id: item._id,
            name: item.name,
          };
          if (item.description) {
            result.description = item.description;
          }
          return result;
        }
      );
      pagination.value = response.pagination;
    }
  } catch (error) {
    console.error('Failed to load workers:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = (query: string) => {
  void loadWorkers(query);
};

const handlePagination = (params: { page: number; rowsPerPage: number; search?: string }) => {
  pagination.value = { ...pagination.value, ...params };
  void loadWorkers(params.search || '');
};

const handleToggle = (item: { _id: string; name: string }) => {
  const index = selectedIds.value.indexOf(item._id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(item._id);
  }
};

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedIds.value = items.value.map((item) => item._id);
  } else {
    selectedIds.value = [];
  }
};

 const handleConfirm = async (ids: string[]) => {
  // 1. Удаляем ресурсы, которые были сняты
  const currentIds = props.workers.map((w) => w.r_id);
  const removedIds = currentIds.filter((id) => !ids.includes(id));
  removedIds.forEach((id) => {
    emit('remove', id);
  });

  const params = {
      page: 1,
      rowsPerPage: 10000, // Получаем всех работников, чтобы найти имена по ID
      search: '',
      includeDescendants: true,
  };
  const response = await workerStore.fetchAll(params);
  const all_workers = response.data.map((worker)=>{
    return {
        _id: worker._id,
        name: worker.name,
    }
  });
  // 2. Добавляем только новые ресурсы (которых еще нет в списке)
  const newIds = ids.filter((id) => !currentIds.includes(id));
  const newResources: OperationResource[] = newIds
    .map((id) => {
      const item = all_workers.find((r) => r._id === id);
      if (!item) return null;

      const resource: OperationResource = {
        r_id: id,
        name: item.name,
        type: 'worker',
        status: true,
        conditions: [
          {
            a_id: id,
            name: item.name,
            measure: '',
            group: isGroupMode.value,
            r_index: 0,
          },
        ],
      };
      return resource;
    })
    .filter((r): r is OperationResource => r !== null);

  emit('add', newResources);
  closeDialog();
};

const formatResourceInfo = (resource: OperationResource): string => {
  const condition = resource.conditions?.[0];
  if (!condition) return t('no_parameters');

  const parts: string[] = [];

  if (condition.worker_params) {
    if (condition.worker_params.worker_count) {
      parts.push(`${t('count')}: ${condition.worker_params.worker_count}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : '';
};

const navigateToWorker = (resource: OperationResource): void => {
  const isGroup = resource.conditions?.[0]?.group === true;

  if (isGroup) {
    // Переход на страницу работников с открытием группы
    void router.push({
      name: 'workers',
      query: { groupId: resource.r_id },
    });
  } else {
    // Обычный переход на детали работника
    void router.push({ name: 'worker-details', params: { id: resource.r_id } });
  }
};

// Обработка выбора группы
const handleGroupConfirm = (groupId: string, groupName: string) => {
  const groupResource: OperationResource = {
    r_id: groupId,
    name: groupName,
    type: 'worker',
    status: true,
    conditions: [
      {
        a_id: groupId,
        name: groupName,
        measure: '',
        group: true,
        r_index: 0,
      },
    ],
  };

  emit('add', [groupResource]);
  groupDialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.workers-block {
  display: flex;
  flex-direction: column;
}

.resource-group {
  padding: 16px;

  &__header {
    margin-bottom: 16px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.no-resources {
  padding: 16px;
  text-align: center;
  color: #999;
  font-style: italic;
}

.resource-group-label {
  font-weight: 600;
  color: #4caf50;
}
</style>
