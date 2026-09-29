<template>
  <div class="description-tab__column">
    <div class="description-tab__title">
      {{ t('basic_information') }}
      <q-btn v-if="!isEditing" icon="edit" flat dense round color="primary" @click="editModeStart">
        <q-tooltip>{{ t('edit') }}</q-tooltip>
      </q-btn>
    </div>

    <template v-if="isEditing">
      <WorkerForm
        :production-unit-id="worker.p_id"
        :worker="workerListItem"
        mode="edit"
        :active="isEditing"
        :show-actions="true"
        :on-close="editModeStop"
        @updated="onWorkerUpdated"
      />
    </template>

    <template v-else>
      <div class="description-tab__info-list">
        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">Имя</div>
          <div class="text-body1">{{ worker.name }}</div>
        </div>

        <div class="description-tab__info-item">
          <div class="text-caption text-grey-7">{{ t('graph') }}</div>
          <div class="text-body1">{{ scheduleLabel }}</div>
        </div>

        <div
          v-if="workerDescription"
          class="description-tab__info-item description-tab__info-item--description"
        >
          <div class="text-caption text-grey-7">{{ t('description') }}</div>
          <div class="text-body1">
            {{ workerDescription }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { WorkerDetail, WorkerListItem, UpdateWorkerResponse } from 'src/entities/worker';
import { useWorkerStore } from 'src/entities/worker';
import { WorkerForm } from 'src/widgets';
import { useI18n } from 'vue-i18n';
interface Props {
  worker: WorkerDetail;
  formatDate: (date?: string | Date) => string;
  formatGender: (gender?: string) => string;
}

interface Emits {
  (e: 'updated', worker: WorkerDetail): void;
}

const props = defineProps<Props>();
const { t } = useI18n();
const emit = defineEmits<Emits>();
const isEditing = ref(false);

// Используем store для обновления данных
const workerStore = useWorkerStore();

const scheduleLabel = computed(() => {
  const schedule = props.worker.scheduleTemplateData?.name;
  if (!schedule) return '—';
  return schedule;
});

const workerDescription = computed(() => {
  // WorkerDetail может иметь description в value или как отдельное поле
  const workerWithDescription = props.worker as WorkerDetail & { description?: string };
  return workerWithDescription.description || undefined;
});

// Преобразуем WorkerDetail в WorkerListItem для формы
const workerListItem = computed<WorkerListItem>(() => {
  const workerWithDescription = props.worker as WorkerDetail & { description?: string };
  const result: Partial<WorkerListItem> = {
    _id: props.worker._id,
    p_id: props.worker.p_id,
    name: props.worker.name,
    operation: props.worker.operation.map((op) => ({
      o_id: op.o_id,
      name: op.name ?? '',
    })),
  };

  // Добавляем опциональные поля только если они определены
  if (props.worker.amount !== undefined) {
    result.amount = props.worker.amount;
  }
  if (props.worker.dob !== undefined && props.worker.dob !== null) {
    const dobValue =
      typeof props.worker.dob === 'string'
        ? props.worker.dob
        : props.worker.dob.toISOString().split('T')[0];
    if (dobValue !== undefined) {
      result.dob = dobValue;
    }
  }
  if (props.worker.gender !== undefined) {
    result.gender = props.worker.gender;
  }
  if (props.worker.contacts !== undefined) {
    result.contacts = props.worker.contacts;
  }
  if (props.worker.multitasking !== undefined) {
    result.multitasking = props.worker.multitasking;
  }
  if (props.worker.userRole !== undefined) {
    result.userRole = props.worker.userRole;
  }
  if (props.worker.created !== undefined && props.worker.created !== null) {
    result.created =
      typeof props.worker.created === 'string'
        ? props.worker.created
        : props.worker.created.toISOString();
  }
  if (props.worker.updated !== undefined && props.worker.updated !== null) {
    result.updated =
      typeof props.worker.updated === 'string'
        ? props.worker.updated
        : props.worker.updated.toISOString();
  }
  const description = workerWithDescription.description;
  if (description !== undefined && description !== null && typeof description === 'string') {
    result.description = description;
  }

  return result as WorkerListItem;
});

const editModeStart = () => {
  isEditing.value = true;
};

const editModeStop = () => {
  isEditing.value = false;
};

async function onWorkerUpdated(worker: UpdateWorkerResponse): Promise<void> {
  // Обновляем данные работника через store
  await workerStore.fetchWorkerById(worker._id);
  const updatedWorker = workerStore.selectedWorker;
  if (updatedWorker) {
    emit('updated', updatedWorker);
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
