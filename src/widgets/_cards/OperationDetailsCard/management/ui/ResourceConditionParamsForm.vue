<template>
  <div class="resource-condition-params-form">
    <!-- Параметры материала -->
    <template v-if="resourceType === 'material'">
      <div class="form-section">
        <div class="form-section__title">{{ t('material_parameters') }}</div>

        <div class="form-row">
         <q-input
            v-model.number="localParams.material_params.quantity_consumed"
            :label="t('quantity_consumed')"
            outlined
            dense
            type="number"
            step="0.01"
            @focus="handleFocusQuantityConsumed"
            @blur="handleBlurQuantityConsumed"
          />

          <q-input
            v-model.number="localParams.material_params.quantity_returned"
            :label="t('quantity_returned')"
            outlined
            dense
            type="number"
            step="0.01"
            @focus="handleFocusQuantityReturned"
            @blur="handleBlurQuantityReturned"
          />
        </div>

        <!-- Временно скрыто
        <q-input
          v-model.number="localParams.material_params.waste_percentage"
          :label="t('waste_percentage')"
          outlined
          dense
          type="number"
          step="0.1"
          suffix="%"
        />
        -->
      </div>
    </template>

    <!-- Параметры работника -->
    <template v-if="resourceType === 'worker'">
      <div class="form-section">
        <div class="form-section__title">{{ t('worker_parameters') }}</div>

        <q-toggle v-model="localParams.worker_params.can_multitask" :label="t('can_multitask')" />

        <q-input
          v-model.number="localParams.worker_params.worker_count"
          :label="t('worker_count')"
          outlined
          dense
          type="number"
          min="1"
        />
      </div>
    </template>

    <!-- Параметры оборудования -->
    <template v-if="resourceType === 'equipments'">
      <div class="form-section">
        <div class="form-section__title">{{ t('equipment_parameters') }}</div>

        <!-- Скрытые поля: setup_time, operation_time, cooldown_time -->
      </div>
    </template>

    <!-- Кнопки действий -->
    <div v-if="showActions" class="form-actions">
      <q-btn :label="t('cancel')" color="grey" outline @click="handleCancel" />
      <q-btn :label="t('save')" color="primary" @click="handleSave" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  MaterialConditionParams,
  WorkerConditionParams,
  EquipmentConditionParams,
  ResourceCondition,
} from 'src/entities/operation';

interface Props {
  resourceType: 'material' | 'equipments' | 'worker';
  condition?: ResourceCondition;
  editable?: boolean;
  showConstraints?: boolean;
  showActions?: boolean;
  autoSave?: boolean;
}

interface Emits {
  (e: 'save', params: Partial<ResourceCondition>): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  showConstraints: true,
  showActions: true,
  autoSave: false,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

interface LocalParams {
  material_params: MaterialConditionParams;
  worker_params: WorkerConditionParams;
  equipment_params: EquipmentConditionParams;
}

const handleFocusQuantityConsumed = () => {
  if (localParams.value.material_params.quantity_consumed === 0) {
    localParams.value.material_params.quantity_consumed = '';
  }
};

const handleBlurQuantityConsumed = () => {
  if (
    localParams.value.material_params.quantity_consumed === '' ||
    localParams.value.material_params.quantity_consumed === undefined
  ) {
    localParams.value.material_params.quantity_consumed = 0;
  }
};

const handleFocusQuantityReturned = () => {
  if (localParams.value.material_params.quantity_returned === 0) {
    localParams.value.material_params.quantity_returned = '';
  }
};

const handleBlurQuantityReturned = () => {
  if (
    localParams.value.material_params.quantity_returned === '' ||
    localParams.value.material_params.quantity_returned === undefined
  ) {
    localParams.value.material_params.quantity_returned = 0;
  }
};
const localParams = ref<LocalParams>({
  material_params: {
    quantity_required: 0,
    quantity_consumed: 0,
    quantity_returned: 0,
    waste_percentage: 0,
    alternative_materials: [],
  },
  worker_params: {
    can_multitask: false,
    worker_count: 1,
  },
  equipment_params: {
    setup_time: 0,
    operation_time: 0,
    cooldown_time: 0,
  },
});

let isInitialized = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Инициализация данных из props
watch(
  () => props.condition,
  (condition) => {
    if (condition) {
      if (condition.material_params) {
        localParams.value.material_params = { ...condition.material_params };
      }
      if (condition.worker_params) {
        localParams.value.worker_params = { ...condition.worker_params };
      }
      if (condition.equipment_params) {
        localParams.value.equipment_params = { ...condition.equipment_params };
      }
    }
    // Помечаем, что инициализация завершена
    setTimeout(() => {
      isInitialized = true;
    }, 100);
  },
  { immediate: true }
);

// Функция debounce
const debounce = (fn: () => void, delay: number) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(fn, delay);
};

// Отслеживание изменений параметров
watch(
  () => localParams.value,
  () => {
    if (isInitialized) {
      if (props.autoSave) {
        // С задержкой для автосохранения
        debounce(() => {
          handleSave();
        }, 800);
      } else {
        // Без задержки - сразу обновляем родительский компонент
        handleSave();
      }
    }
  },
  { deep: true }
);

const handleSave = () => {
  const result: Partial<ResourceCondition> = {};

  if (props.resourceType === 'material') {
    result.material_params = localParams.value.material_params;
  } else if (props.resourceType === 'worker') {
    result.worker_params = localParams.value.worker_params;
  } else if (props.resourceType === 'equipments') {
    result.equipment_params = localParams.value.equipment_params;
  }

  emit('save', result);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="scss">
.resource-condition-params-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin-bottom: 4px;
  }
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  > * {
    flex: 1;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
</style>
