<template>
  <div class="description-tab__column">
    <div class="description-tab__title">
      {{ t('basic_information') }}
      <q-btn v-if="!isEditing" icon="edit" flat dense round color="primary" @click="editModeStart">
        <q-tooltip>{{ t('edit') }}</q-tooltip>
      </q-btn>
    </div>

    <template v-if="isEditing">
      <OperationForm
        :production-unit-id="null"
        :operation="selectedOperationListItem"
        mode="edit"
        :active="isEditing"
        show-actions
        :on-close="editModeStop"
        @updated="onOperationUpdated"
      />
    </template>

    <template v-else>
      <div class="description-tab__info-list">
        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('operation_modal.operation_name') }}</div>
          <div class="text-body1">{{ operation.name }}</div>
        </div>

        <div
          v-if="operation.description"
          class="description-tab__info-item description-tab__info-item--description"
        >
          <div class="text-caption text-grey-7">{{ t('description') }}</div>
          <div class="text-body1">{{ operation.description }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { OperationForm } from 'src/widgets';
import { type OperationInfoDto, type OperationListItem, useOperationStore } from 'src/entities/operation';
import { useI18n } from 'vue-i18n';

interface Props {
  operation: OperationInfoDto;
  formatDate: (date?: string | Date) => string;
}

interface Emits {
  (e: 'updated', operation: OperationInfoDto): void;
  (e: 'edit-mode-change', isEditing: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {});

const { t } = useI18n();
const emit = defineEmits<Emits>();
const operationStore = useOperationStore();
const isEditing = ref(false);

const editModeStart = () => {
  isEditing.value = true;
};

const editModeStop = () => {
  isEditing.value = false;
};

// Преобразуем OperationInfoDto в OperationListItem для формы
const selectedOperationListItem = computed<OperationListItem | null>(() => {
  if (!props.operation) return null;
  
  const result: OperationListItem = {
    _id: props.operation._id,
    name: props.operation.name,
    createdAt: props.operation.createdAt,
    updatedAt: props.operation.updatedAt,
  };
  
  if (props.operation.description) {
    result.description = props.operation.description;
  }
  
  return result;
});

async function onOperationUpdated(operation: OperationListItem): Promise<void> {
  // Обновляем информацию об операции в store
  await operationStore.fetchOperationInfo(operation._id);
  
  // Получаем обновленную информацию
  const updatedInfo = operationStore.operationInfo;
  if (updatedInfo) {
    emit('updated', updatedInfo);
  }
  
  editModeStop();
}
</script>

<style scoped lang="scss">
.description-tab {
  &__column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &--description {
      margin-top: 8px;
    }
  }
}
</style>

