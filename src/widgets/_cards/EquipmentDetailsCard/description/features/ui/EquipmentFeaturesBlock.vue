<template>
  <div class="features-block">
    <!-- Режим просмотра -->
    <div v-if="!isEditing" class="features-block__body">
       <div v-if="featureEntries.length" class="description-tab__features-header text-caption text-grey-7">
          <span>Характеристика</span>
          <span>Значение</span>
        </div>
      <div v-if="featureEntries.length" class="description-tab__features">
        <div
          v-for="([key, value], index) in featureEntries"
          :key="`${key}-${index}`"
          class="description-tab__feature-row"
        >
          <div class="text-body2 text-grey-8">{{ key }}</div>
          <div class="text-body2">
            {{ formatFeatureValue(value) }}
          </div>
        </div>
      </div>

      <div  class="description-tab__features-empty">
        <q-btn
          outline
          no-caps
          color="primary"
          class="description-tab__add-feature-btn"
          icon="add"
          :label="t('add_characteristic')"
          @click="editModeStart"
        />
      </div>
    </div>

    <!-- Форма редактирования -->
    <FeatureForm v-if="isEditing"
      v-model="editFeatures"
      :is-editing="isEditing ?? false"
      :disabled="false"
      :title="t('characteristics')"
      :add-button-label="t('add_characteristic')"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FeatureField } from 'src/shared/types';
import { FeatureForm } from 'src/widgets';
import { useEquipmentStore } from 'src/entities/equipment';
import { useI18n } from 'vue-i18n';

interface Props {
  equipmentId: string;
  specification?: Record<string, unknown>;
}

const { t } = useI18n()
const props = withDefaults(defineProps<Props>(), {
  specification: () => ({}),
});

// Преобразуем specification в массив пар [key, value] для отображения
const featureEntries = computed(() => {
  const specification = props.specification || {};
  return Object.entries(specification);
});

// Преобразуем specification в массив FeatureField для формы
const featuresAsArray = computed((): FeatureField[] => {
  const specification = props.specification || {};
  return Object.entries(specification).map(([key, value]) => ({
    key,
    value: valueToStringForForm(value),
  }));
});

// Вспомогательная функция для конвертации значения в строку для формы
const valueToStringForForm = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  // Обработка других типов (symbol, function, bigint и т.д.)
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return '';
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  // Для любых других неизвестных типов
  return '';
};

// Состояние редактирования
const editFeatures = ref<FeatureField[]>([]);
const isEditing = ref(false)
const editModeStart = () => {
    editFeatures.value = [...featuresAsArray.value];
    isEditing.value = true;
}

const formatFeatureValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  // Обработка других типов (symbol, function, bigint и т.д.)
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return '[Function]';
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  // Для любых других неизвестных типов
  return '[Unknown]';
};


const { updateEquipmentFeature } = useEquipmentStore();

const handleSave = async () => {
  try {
    // Преобразуем массив FeatureField обратно в Record<string, unknown>
    const specification: Record<string, unknown> = {};
    editFeatures.value.forEach(feature => {
      if (feature.key.trim()) {
        specification[feature.key.trim()] = feature.value;
      }
    });

    await updateEquipmentFeature(props.equipmentId, specification);
    isEditing.value = false;
  } catch (error) {
    console.error('Ошибка при сохранении характеристик:', error);
    // Можно добавить обработку ошибки, например, показать уведомление
  }
};

const handleCancel = () => {
  isEditing.value = false;
};
</script>

<style scoped lang="scss">

// Используем стили из DescriptionTab для консистентности
.features-block {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.features-block__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.description-tab {
  &__features {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow-y: auto;
  }

  &__features-header {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding-bottom: 4px;
  }

  &__feature-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    column-gap: 24px;
    padding: 4px 0;
    border-top: 1px solid #f0f0f0;
  }

  &__features-empty {
    margin-top: 12px;
  }

  &__add-feature-btn {
    padding: 0 16px;
    height: 36px;
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
  }

  &__title--right {
    font-size: 18px;
    font-weight: 500;
    text-align: left;
  }
}
</style>
