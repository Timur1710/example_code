<template>
  <div class="advanced-params-block">
    <div class="advanced-params-block__header">
      <div class="advanced-params-block__title">
        {{ t('advanced_parameters') }}
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

    <template v-if="isEditing">
      <div class="advanced-params-block__form">
        <!-- Требуется непрерывное выполнение -->
        <q-toggle
          v-model="formData.constraints.requires_continuous_execution"
          :label="t('requires_continuous_execution')"
        />

        <!-- Время подготовки и завершения операции -->
        <div class="advanced-params-block__time-fields">
          <div class="advanced-params-block__subtitle">{{ t('operation_time_params') }}</div>

          <q-input
            v-model.number="formData.preparation_time"
            :label="t('preparation_time')"
            outlined
            dense
            type="number"
            min="0"
            :hint="t('minutes')"
          />

          <q-input
            v-model.number="formData.completion_time"
            :label="t('completion_time')"
            outlined
            dense
            type="number"
            min="0"
            :hint="t('minutes')"
          />
        </div>

        <!-- Временные ограничения -->
        <div class="advanced-params-block__time-constraints">
          <div class="advanced-params-block__subtitle">{{ t('time_constraints') }}</div>
          
          <q-input
            v-model.number="formData.constraints.time_constraints.min_duration"
            :label="t('min_duration')"
            outlined
            dense
            type="number"
            :hint="t('minutes')"
          />

          <q-input
            v-model.number="formData.constraints.time_constraints.max_duration"
            :label="t('max_duration')"
            outlined
            dense
            type="number"
            :hint="t('minutes')"
          />
        </div>

        <!-- Описание операции -->
        <q-input
          v-model="formData.description"
          outlined
          :label="t('description')"
          type="textarea"
          autogrow
          counter
          maxlength="1000"
          class="custom-textarea"
        />

        <!-- Кнопки действий -->
        <div class="advanced-params-block__actions">
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

    <template v-else>
      <div class="advanced-params-block__info">
        <div class="advanced-params-block__info-item">
          <div class="text-caption text-grey-7">{{ t('operation_time_params') }}</div>
          <div class="text-body1">{{ formatOperationTimeParams() }}</div>
        </div>

        <div class="advanced-params-block__info-item">
          <div class="text-caption text-grey-7">{{ t('description') }}</div>
          <div class="text-body1">{{ operation.description || '—' }}</div>
        </div>

        <div v-if="operation.constraints" class="advanced-params-block__constraints">
          <div class="advanced-params-block__info-item">
            <div class="text-caption text-grey-7">{{ t('requires_continuous_execution') }}</div>
            <div class="text-body1">{{ operation.constraints.requires_continuous_execution ? t('yes') : t('no') }}</div>
          </div>

          <div
            v-if="operation.constraints.time_constraints"
            class="advanced-params-block__info-item"
          >
            <div class="text-caption text-grey-7">{{ t('time_constraints') }}</div>
            <div class="text-body1">
              {{ formatTimeConstraints(operation.constraints.time_constraints) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OperationInfoDto, TimeConstraints } from 'src/entities/operation';
import { useOperationStore } from 'src/entities/operation';

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

interface FormData {
  description: string;
  preparation_time: number;
  completion_time: number;
  constraints: {
    requires_continuous_execution: boolean;
    time_constraints: {
      min_duration: number;
      max_duration: number;
    };
  };
}

const formData = ref<FormData>({
  description: '',
  preparation_time: 0,
  completion_time: 0,
  constraints: {
    requires_continuous_execution: false,
    time_constraints: {
      min_duration: 0,
      max_duration: 0,
    },
  },
});

const formatOperationTimeParams = (): string => {
  const parts: string[] = [];
  const prep = props.operation.preparation_time ?? 0;
  const compl = props.operation.completion_time ?? 0;
  if (prep > 0) {
    parts.push(`${t('preparation_time')}: ${prep} ${t('minutes')}`);
  }
  if (compl > 0) {
    parts.push(`${t('completion_time')}: ${compl} ${t('minutes')}`);
  }
  return parts.length > 0 ? parts.join(', ') : '—';
};

const startEdit = () => {
  formData.value = {
    description: props.operation.description || '',
    preparation_time: props.operation.preparation_time ?? 0,
    completion_time: props.operation.completion_time ?? 0,
    constraints: {
      requires_continuous_execution: props.operation.constraints?.requires_continuous_execution || false,
      time_constraints: {
        min_duration: props.operation.constraints?.time_constraints?.min_duration || 0,
        max_duration: props.operation.constraints?.time_constraints?.max_duration || 0,
      },
    },
  };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveChanges = async () => {
  try {
    const updateData = {
      _id: props.operation._id,
      description: formData.value.description,
      preparation_time: formData.value.preparation_time,
      completion_time: formData.value.completion_time,
      constraints: {
        requires_continuous_execution: formData.value.constraints.requires_continuous_execution,
        time_constraints: formData.value.constraints.time_constraints.max_duration > 0
          ? {
              min_duration: formData.value.constraints.time_constraints.min_duration,
              max_duration: formData.value.constraints.time_constraints.max_duration,
            }
          : undefined,
      },
    };

    await operationStore.updateOperation(updateData);
    await operationStore.fetchOperationInfo(props.operation._id);

    const updatedInfo = operationStore.operationInfo;
    if (updatedInfo) {
      emit('updated', updatedInfo);
    }

    isEditing.value = false;
  } catch (error) {
    console.error('Failed to update advanced params:', error);
  }
};

const formatTimeConstraints = (constraints: TimeConstraints): string => {
  const parts = [];
  if (constraints.min_duration) {
    parts.push(`${t('min')}: ${constraints.min_duration} ${t('minutes')}`);
  }
  if (constraints.max_duration) {
    parts.push(`${t('max')}: ${constraints.max_duration} ${t('minutes')}`);
  }
  return parts.length > 0 ? parts.join(', ') : '—';
};
</script>

<style scoped lang="scss">
.advanced-params-block {
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

  &__subtitle {
    font-size: 16px;
    font-weight: 500;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__constraints {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }

  &__time-fields,
  &__time-constraints {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  :deep(.custom-textarea .q-field__control) {
    min-height: 147px;
  }
}
</style>

