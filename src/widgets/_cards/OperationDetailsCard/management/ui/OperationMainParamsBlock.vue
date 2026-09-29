<template>
  <div class="main-params-block">
    <div class="main-params-block__header">
      <div class="main-params-block__title">
        {{ t('main_parameters') }}
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
      <div class="main-params-block__form">
          <!-- Название операции -->
          <q-input
          v-model="formData.name"
          outlined
          dense
          :label="t('operation_modal.operation_name')"
          autofocus
          :rules="nameRules"
          :disable="isFormBusy"
          hide-bottom-space
        />
        <!-- Стоимость -->
        <q-input
          v-model="formData.cost"
          :label="t('operation_cost')"
          outlined
          dense
          type="number"
          step="0.01"
        />

        <!-- Норма выработки -->
        <DurationInput
          v-model="formData.compliance_rate"
          :label="t('compliance_rate')"
          default-unit="min"
        />

        <!-- Батч: чекбокс и поля -->
        <q-checkbox
          v-model="formData.batch_prod"
          :label="t('add_batch')"
        />
        <template v-if="formData.batch_prod">
          <q-input
            v-model.number="formData.batch_prod_min"
            :label="t('batch_prod_min')"
            outlined
            dense
            type="number"
            min="0"
            step="1"
          />
          <q-input
            v-model.number="formData.batch_prod_max"
            :label="t('batch_prod_max')"
            outlined
            dense
            type="number"
            min="0"
            step="1"
          />
        </template>

        <!-- Кнопки действий -->
        <div class="main-params-block__actions">
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
      <div class="main-params-block__info">
        <div class="main-params-block__info-item">
          <div class="text-caption text-grey-7">{{ t('operation_modal.operation_name') }}</div>
          <div class="text-body1">{{ operation.name || '—' }}</div>
        </div>

        <div class="main-params-block__info-item">
          <div class="text-caption text-grey-7">{{ t('operation_cost') }}</div>
          <div class="text-body1">{{ operation.cost || '—' }}</div>
        </div>

        <div class="main-params-block__info-item">
          <div class="text-caption text-grey-7">{{ t('compliance_rate') }}</div>
          <DurationInput
            :model-value="operation.compliance_rate || '0'"
            readonly
          />
        </div>

        <div v-if="hasBatchFields" class="main-params-block__batch-section">
          <div class="main-params-block__batch-header">{{ t('batch_section') }}</div>
          <div class="main-params-block__batch-content">
            <div class="main-params-block__info-item">
              <div class="text-caption text-grey-7">{{ t('batch_prod_min') }}</div>
              <div class="text-body1">{{ operation.batch_prod_min ?? '—' }}</div>
            </div>
            <div class="main-params-block__info-item">
              <div class="text-caption text-grey-7">{{ t('batch_prod_max') }}</div>
              <div class="text-body1">{{ operation.batch_prod_max ?? '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OperationInfoDto } from 'src/entities/operation';
import { useOperationStore } from 'src/entities/operation';
import { DurationInput } from 'src/shared/ui';

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

const nameRules = [
  (val: string) => !!val?.trim() || t('operation_modal.enter_name'),
  (val: string) => val.trim().length >= 2 || t('operation_modal.minimum_of_2_characters'),
];

const isFormBusy = computed(() => false); // В данном компоненте нет асинхронных операций

const hasBatchFields = computed(() => {
  const op = props.operation;
  return op.batch_prod === true || op.batch_prod_min != null || op.batch_prod_max != null;
});

interface FormData {
  name: string;
  cost: string;
  compliance_rate: string;
  batch_prod: boolean;
  batch_prod_min?: number;
  batch_prod_max?: number;
}

const formData = ref<FormData>({
  name: '',
  cost: '',
  compliance_rate: '',
  batch_prod: false,
});

const startEdit = () => {
  const hasBatch = hasBatchFields.value;
  const data: FormData = {
    name: props.operation.name || '',
    cost: props.operation.cost || '0',
    compliance_rate: props.operation.compliance_rate || '0',
    batch_prod: hasBatch,
  };
  if (hasBatch && props.operation.batch_prod_min != null) {
    data.batch_prod_min = props.operation.batch_prod_min;
  }
  if (hasBatch && props.operation.batch_prod_max != null) {
    data.batch_prod_max = props.operation.batch_prod_max;
  }
  formData.value = data;
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

/** Преобразует значение в число или null (пустая строка, NaN, undefined → null) */
function toNumOrNull(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

const saveChanges = async () => {
  try {
    const updateData = {
      _id: props.operation._id,
      name: formData.value.name,
      cost: formData.value.cost,
      compliance_rate: formData.value.compliance_rate,
      batch_prod: formData.value.batch_prod,
      ...(formData.value.batch_prod
        ? {
            batch_prod_min: toNumOrNull(formData.value.batch_prod_min),
            batch_prod_max: toNumOrNull(formData.value.batch_prod_max),
          }
        : { batch_prod_min: null, batch_prod_max: null }),
    };

    await operationStore.updateOperation(updateData);
    await operationStore.fetchOperationInfo(props.operation._id);

    const updatedInfo = operationStore.operationInfo;
    if (updatedInfo) {
      emit('updated', updatedInfo);
    }

    isEditing.value = false;
  } catch (error) {
    console.error('Failed to update operation:', error);
  }
};

</script>

<style scoped lang="scss">
.main-params-block {
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

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  &__batch-section {
    margin-top: 8px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
  }

  &__batch-header {
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__batch-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>

