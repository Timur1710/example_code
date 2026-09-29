<template>
  <div class="equipments-block">
    <q-expansion-item
      v-model="mainExpanded"
      :label="isEditing ? t('equipments') : `${t('equipments')} (${equipments.length})`"
      icon="precision_manufacturing"
      :header-class="isEditing ? 'bg-orange-1' : ''"
    >
      <div class="resource-group">
        <!-- Кнопка добавления в режиме редактирования -->
        <div v-if="isEditing" class="resource-group__header">
          <div class="resource-group__controls">
            <q-toggle v-model="isGroupMode" :label="t('group_mode')" color="primary" size="sm" />
            <q-btn
              :label="isGroupMode ? t('add_equipment_group') : t('add_equipment')"
              :icon="isGroupMode ? 'group_add' : 'add'"
              :color="isGroupMode ? 'secondary' : 'primary'"
              size="sm"
              @click="openDialog"
            />
          </div>
        </div>

        <!-- Пустое состояние -->
        <div v-if="equipments.length === 0" class="no-resources">
          {{ t('no_equipment') }}
        </div>

        <!-- Список оборудования в режиме редактирования -->
        <q-list v-else-if="isEditing" bordered separator>
          <q-item v-for="resource in equipments" :key="resource.r_id">
            <q-item-section avatar>
              <q-icon name="precision_manufacturing" color="orange" />
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
                @click="$emit('remove', resource.r_id)"
              >
                <q-tooltip>{{ t('delete') }}</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Список оборудования в режиме просмотра -->
        <q-list v-else bordered separator>
          <q-item
            v-for="resource in equipments"
            :key="resource.r_id"
            clickable
            @click="navigateToEquipment(resource)"
          >
            <q-item-section avatar>
              <q-icon name="precision_manufacturing" color="orange" />
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

    <!-- Диалог выбора оборудования -->
    <q-dialog v-model="dialogVisible" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">{{ t('select_equipment') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <ResourceSelectionTemplate
            resource-type="equipment"
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

    <!-- Диалог выбора группы оборудования -->
    <ProductionUnitSelectionDialog
      v-model="groupDialogVisible"
      entity-key="equipment"
      :title="t('select_equipment_group')"
      @confirm="handleGroupConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { OperationResource } from 'src/entities/operation';
import { useEquipmentStore } from 'src/entities/equipment';
import { ResourceSelectionTemplate, ProductionUnitSelectionDialog } from 'src/shared/templates';

interface Props {
  equipments: OperationResource[];
  isEditing: boolean;
}

interface Emits {
  (e: 'add', resources: OperationResource[]): void;
  (e: 'remove', resourceId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const router = useRouter();
const equipmentStore = useEquipmentStore();

// Состояние главного expansion-item
const mainExpanded = ref(false);

const isGroupMode = ref(false);

// Открываем главный expansion-item при включении режима редактирования
watch(
  () => props.isEditing,
  (newValue) => {
    mainExpanded.value = newValue;
  },
  { immediate: true }
);

// Проверяем наличие групп оборудования для обратной совместимости (только в режиме просмотра)
watch(
  () => props.equipments.map((e) => e.r_id),
  () => {
    if (!props.isEditing) {
      const hasGroups = props.equipments.some((equipment) => equipment.conditions?.[0]?.group === true);
      isGroupMode.value = hasGroups;
    }
  },
  { immediate: true }
);

// Сбрасываем все оборудование при переключении режима группы
watch(
  () => isGroupMode.value,
  (newValue, oldValue) => {
    // Сбрасываем только при явном переключении пользователем в режиме редактирования
    if (oldValue !== undefined && newValue !== oldValue && props.isEditing && props.equipments.length > 0) {
      // Берем копию ids перед удалением
      const idsToRemove = props.equipments.map((equipment) => equipment.r_id);
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
    // Открываем диалог выбора оборудования
    dialogVisible.value = true;
    // Предзаполняем selectedIds уже выбранным оборудованием для обратной совместимости
    selectedIds.value = props.equipments.map((e) => e.r_id);
    await loadEquipments();
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
  items.value = [];
  selectedIds.value = [];
};

const loadEquipments = async (search = '') => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      rowsPerPage: pagination.value.rowsPerPage,
      search,
      includeDescendants: true,
    };

    const response = await equipmentStore.fetchAll(params);

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
    console.error('Failed to load equipments:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = (query: string) => {
  void loadEquipments(query);
};

const handlePagination = (params: { page: number; rowsPerPage: number; search?: string }) => {
  pagination.value = { ...pagination.value, ...params };
  void loadEquipments(params.search || '');
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
  const currentIds = props.equipments.map((e) => e.r_id);
  const removedIds = currentIds.filter((id) => !ids.includes(id));
  removedIds.forEach((id) => {
    emit('remove', id);
  });

  const params = {
    page: 1,
    rowsPerPage: 10000, // Получаем все оборудование, чтобы найти имена по ID
    search: '',
    includeDescendants: true,
  };
  const response = await equipmentStore.fetchAll(params);
  const all_equipments = response.data.map((equipment)=>{
    return {
        _id: equipment._id,
        name: equipment.name,
    }
  });

  // 2. Добавляем только новые ресурсы (которых еще нет в списке)
  const newIds = ids.filter((id) => !currentIds.includes(id));
  const newResources: OperationResource[] = newIds
    .map((id) => {
      const item = all_equipments.find((r) => r._id === id);
      if (!item) return null;

      const resource: OperationResource = {
        r_id: id,
        name: item.name,
        type: 'equipments',
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
  return resource.name;
};

const navigateToEquipment = (resource: OperationResource): void => {
  const isGroup = resource.conditions?.[0]?.group === true;

  if (isGroup) {
    // Переход на страницу оборудования с открытием группы
    void router.push({
      name: 'equipments',
      query: { groupId: resource.r_id },
    });
  } else {
    // Обычный переход на детали оборудования
    void router.push({ name: 'equipment-details', params: { id: resource.r_id } });
  }
};

// Обработка выбора группы
const handleGroupConfirm = (groupId: string, groupName: string) => {
  const groupResource: OperationResource = {
    r_id: groupId,
    name: groupName,
    type: 'equipments',
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
.equipments-block {
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
  color: #ff9800;
}
</style>
