<template>
  <div class="resources-manager">
    <div class="resources-manager__header">
      <div class="resources-manager__title">
        {{ t('resources_management') }}
      </div>
      <q-btn
        v-if="!isEditing"
        icon="edit"
        flat
        dense
        round
        color="primary"
        @click="startEdit"
      >
        <q-tooltip>{{ t('edit') }}</q-tooltip>
      </q-btn>
    </div>

    <div class="resources-manager__content">
      <!-- Блок материалов -->
      <OperationMaterialsBlock
        :materials="materialResources"
        :is-editing="isEditing"
        @add="handleAddMaterials"
        @remove="handleRemoveResource"
        @update-params="handleUpdateParams"
      />

      <!-- Блок работников -->
      <OperationWorkersBlock
        :workers="workerResources"
        :is-editing="isEditing"
        @add="handleAddWorkers"
        @remove="handleRemoveResource"
        @update-params="handleUpdateParams"
      />

      <!-- Блок оборудования -->
      <OperationEquipmentsBlock
        :equipments="equipmentResources"
        :is-editing="isEditing"
        @add="handleAddEquipments"
        @remove="handleRemoveResource"
      />
    </div>

    <!-- Кнопки действий в режиме редактирования -->
    <div v-if="isEditing" class="resources-manager__actions">
      <q-btn
        :label="t('cancel')"
        color="grey"
        outline
        @click="cancelEdit"
      />
      <q-btn
        :label="t('save')"
        color="primary"
        @click="saveChanges"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  OperationInfoDto,
  OperationResource,
  ResourceCondition,
} from 'src/entities/operation';
import { useOperationStore } from 'src/entities/operation';
import OperationMaterialsBlock from './OperationMaterialsBlock.vue';
import OperationWorkersBlock from './OperationWorkersBlock.vue';
import OperationEquipmentsBlock from './OperationEquipmentsBlock.vue';

interface Props {
  operation: OperationInfoDto;
}

interface Emits {
  (e: 'updated', operation: OperationInfoDto): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const operationStore = useOperationStore();

const isEditing = ref(false);
const localResources = ref<OperationResource[]>([]);

// Вычисляемые свойства для фильтрации ресурсов по типам
// В режиме просмотра используем props.operation.resources, в режиме редактирования - localResources
const materialResources = computed(() => {
  const resources = isEditing.value ? localResources.value : (props.operation.resources || []);
  return resources.filter((r) => r.type === 'material');
});

const workerResources = computed(() => {
  const resources = isEditing.value ? localResources.value : (props.operation.resources || []);
  return resources.filter((r) => r.type === 'worker');
});

const equipmentResources = computed(() => {
  const resources = isEditing.value ? localResources.value : (props.operation.resources || []);
  return resources.filter((r) => r.type === 'equipments');
});

const startEdit = () => {
  localResources.value = JSON.parse(JSON.stringify(props.operation.resources || []));
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  localResources.value = [];
};

const saveChanges = async () => {
  try {
    const updateData = {
      _id: props.operation._id,
      resources: localResources.value,
    };

    await operationStore.updateOperation(updateData);
    await operationStore.fetchOperationInfo(props.operation._id);

    const updatedInfo = operationStore.operationInfo;
    if (updatedInfo) {
      emit('updated', updatedInfo);
    }

    isEditing.value = false;
  } catch (error) {
    console.error('Failed to update resources:', error);
  }
};

const handleAddMaterials = (resources: OperationResource[]) => {
  resources.forEach((resource) => {
    if (!localResources.value.find((r) => r.r_id === resource.r_id)) {
      localResources.value.push(resource);
    }
  });
};

const handleAddWorkers = (resources: OperationResource[]) => {
  resources.forEach((resource) => {
    if (!localResources.value.find((r) => r.r_id === resource.r_id)) {
      localResources.value.push(resource);
    }
  });
};

const handleAddEquipments = (resources: OperationResource[]) => {
  resources.forEach((resource) => {
    if (!localResources.value.find((r) => r.r_id === resource.r_id)) {
      localResources.value.push(resource);
    }
  });
};

const handleRemoveResource = (resourceId: string) => {
  const index = localResources.value.findIndex((r) => r.r_id === resourceId);
  if (index > -1) {
    localResources.value.splice(index, 1);
  }
};

const handleUpdateParams = (resourceId: string, params: Partial<ResourceCondition>) => {
  const resource = localResources.value.find((r) => r.r_id === resourceId);
  if (resource && resource.conditions && resource.conditions[0]) {
    Object.assign(resource.conditions[0], params);
  }
};
</script>

<style scoped lang="scss">
.resources-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }
}
</style>

