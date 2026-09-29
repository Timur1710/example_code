<template>
  <div class="materials-block">
    <q-expansion-item
      v-model="mainExpanded"
      :label="isEditing ? t('materials') : `${t('materials')} (${materials.length})`"
      icon="inventory_2"
      :header-class="isEditing ? 'bg-blue-1' : ''"
    >
      <div class="resource-group">
        <!-- Кнопка добавления в режиме редактирования -->
        <div v-if="isEditing" class="resource-group__header">
          <div class="resource-group__controls">
            <!-- Групповой режим закомментирован
            <q-toggle v-model="isGroupMode" :label="t('group_mode')" color="primary" size="sm" />
            -->
            <q-btn
              :label="t('add_material')"
              icon="add"
              color="primary"
              size="sm"
              @click="openDialog"
            />
          </div>
        </div>

        <!-- Пустое состояние -->
        <div v-if="materials.length === 0" class="no-resources">
          {{ t('no_materials') }}
        </div>

        <!-- Список материалов в режиме редактирования -->
        <q-list v-else-if="isEditing" bordered separator>
          <q-expansion-item
            v-for="resource in materials"
            :key="resource.r_id"
            :model-value="expandedItems[resource.r_id] ?? false"
            @update:model-value="(val) => (expandedItems[resource.r_id] = val)"
            :label="resource.name"
            icon="category"
          >
            <template #header>
              <q-item-section avatar>
                <q-icon name="category" />
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
                  resource-type="material"
                  :condition="resource.conditions[0]"
                  :show-actions="false"
                  @save="(params) => $emit('update-params', resource.r_id, params)"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>

        <!-- Список материалов в режиме просмотра -->
        <q-list v-else bordered separator>
          <q-item
            v-for="resource in materials"
            :key="resource.r_id"
            clickable
            @click="navigateToMaterial(resource)"
          >
            <q-item-section avatar>
              <q-icon name="category" color="blue" />
            </q-item-section>
            <q-item-section>
              <q-item-label>
                <!-- Групповой режим закомментирован
                <span v-if="resource.conditions?.[0]?.group" class="resource-group-label"
                  >Группа </span
                >
                -->{{ resource.name }}
              </q-item-label>
              <q-item-label caption>
                {{ formatResourceInfo(resource) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-expansion-item>

    <!-- Диалог выбора материалов -->
    <q-dialog v-model="dialogVisible" persistent>
      <q-card class="overflow-hidden" style="min-width: 600px; max-width: 800px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 q-px-md">{{ t('select_materials') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense  @click="closeDialog" />
        </q-card-section>

        <q-card-section class="q-py-none">
          <ResourceSelectionTemplate
            resource-type="material"
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
      </q-card>
    </q-dialog>

    <!-- Групповой режим закомментирован
    <ProductionUnitSelectionDialog
      v-model="groupDialogVisible"
      entity-key="materials"
      :title="t('select_material_group')"
      @confirm="handleGroupConfirm"
    />
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { OperationResource, ResourceCondition } from 'src/entities/operation';
import { useMaterialStore } from 'src/entities/material';
import ResourceConditionParamsForm from '../../ui/ResourceConditionParamsForm.vue';
import { ResourceSelectionTemplate } from 'src/shared/templates';
// ProductionUnitSelectionDialog - групповой режим закомментирован

interface Props {
  materials: OperationResource[];
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
const materialStore = useMaterialStore();

// Состояния expansion-item'ов
const mainExpanded = ref(false);
const expandedItems = ref<Record<string, boolean>>({});

// Групповой режим закомментирован
// const isGroupMode = ref(false);

// Инициализируем состояния всех expansion-item'ов
const initializeExpandedItems = () => {
  const newExpandedItems: Record<string, boolean> = {};
  props.materials.forEach((material) => {
    newExpandedItems[material.r_id] = props.isEditing;
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

// Обновляем expansion-item'ы при изменении списка материалов
watch(
  () => props.materials.map((m) => m.r_id),
  () => {
    if (props.isEditing) {
      props.materials.forEach((material) => {
        if (!(material.r_id in expandedItems.value)) {
          expandedItems.value[material.r_id] = true;
        }
      });
    } else {
      // Групповой режим закомментирован
      // const hasGroups = props.materials.some((material) => material.conditions?.[0]?.group === true);
      // isGroupMode.value = hasGroups;
    }
  },
  { immediate: true }
);

// Групповой режим закомментирован - сброс материалов при переключении режима группы
// watch(
//   () => isGroupMode.value,
//   (newValue, oldValue) => {
//     if (oldValue !== undefined && newValue !== oldValue && props.isEditing && props.materials.length > 0) {
//       const idsToRemove = props.materials.map((material) => material.r_id);
//       idsToRemove.forEach((id) => {
//         emit('remove', id);
//       });
//     }
//   }
// );

const dialogVisible = ref(false);
// const groupDialogVisible = ref(false);
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
  // Групповой режим закомментирован - всегда открываем диалог выбора материалов
  // if (isGroupMode.value) {
  //   groupDialogVisible.value = true;
  // } else {
  dialogVisible.value = true;
  selectedIds.value = props.materials.map((m) => m.r_id);
  await loadMaterials();
  // }
};

const closeDialog = () => {
  dialogVisible.value = false;
  items.value = [];
  selectedIds.value = [];
};

const loadMaterials = async (search = '') => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      rowsPerPage: pagination.value.rowsPerPage,
      search,
      includeDescendants: true,
    };

    const response = await materialStore.fetchAll(params);

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
    console.error('Failed to load materials:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = (query: string) => {
  void loadMaterials(query);
};

const handlePagination = (params: { page: number; rowsPerPage: number; search?: string }) => {
  pagination.value = { ...pagination.value, ...params };
  void loadMaterials(params.search || '');
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
  const currentIds = props.materials.map((m) => m.r_id);
  const removedIds = currentIds.filter((id) => !ids.includes(id));
  removedIds.forEach((id) => {
    emit('remove', id);
  });

  const params = {
    page: 1,
    rowsPerPage: 10000, // Получаем все материалы, чтобы найти имена по ID
    search: '',
    includeDescendants: true,
  };

  const response = await materialStore.fetchAll(params);
  const all_materials = response.data.map((material)=>{
    return {
        _id: material._id,
        name: material.name,
    }
  });

  // 2. Добавляем только новые ресурсы (которых еще нет в списке)
  const newIds = ids.filter((id) => !currentIds.includes(id));
  const newResources: OperationResource[] = newIds
    .map((id) => {
      const item = all_materials.find((r) => r._id === id);
      if (!item) return null;

      const resource: OperationResource = {
        r_id: id,
        name: item.name,
        type: 'material',
        status: true,
        conditions: [
          {
            a_id: id,
            name: item.name,
            measure: '',
            group: false, // isGroupMode.value - групповой режим закомментирован
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

  if (condition.material_params?.quantity_consumed !== undefined) {
    parts.push(`${t('consumed')}: ${condition.material_params.quantity_consumed}`);
  }

  if (condition.material_params?.quantity_returned !== undefined) {
    parts.push(`${t('returned')}: ${condition.material_params.quantity_returned}`);
  }

  return parts.length > 0 ? parts.join(', ') : '';
};

const navigateToMaterial = (resource: OperationResource): void => {
  // Групповой режим закомментирован - всегда переход на детали материала
  // const isGroup = resource.conditions?.[0]?.group === true;
  // if (isGroup) {
  //   void router.push({
  //     name: 'materials',
  //     query: { groupId: resource.r_id },
  //   });
  // } else {
  void router.push({ name: 'material-details', params: { id: resource.r_id } });
  // }
};

// Групповой режим закомментирован - обработка выбора группы
// const handleGroupConfirm = (groupId: string, groupName: string) => {
//   const groupResource: OperationResource = {
//     r_id: groupId,
//     name: groupName,
//     type: 'material',
//     status: true,
//     conditions: [
//       {
//         a_id: groupId,
//         name: groupName,
//         measure: '',
//         group: true,
//         r_index: 0,
//       },
//     ],
//   };
//
//   emit('add', [groupResource]);
//   groupDialogVisible.value = false;
// };
</script>

<style scoped lang="scss">
.materials-block {
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
  color: #1976d2;
}
</style>
