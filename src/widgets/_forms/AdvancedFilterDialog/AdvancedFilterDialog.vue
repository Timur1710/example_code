<template>
  <DialogWrapper
    :model-value="props.modelValue"
    :title="'Настройка фильтра'"
    :icon="'filter_alt'"
    :card-style="cardStyle"
    :class="'filter_table'"
    isProductionItemForm
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <FilterTable
        ref="formRef"
        :keys="filter_keys"
        @created="handleCreated"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AdvancedFilterDialog',
});

// === Imports ===
import { computed } from 'vue';
import { DialogWrapper } from 'src/shared/ui';
import FilterTable from './FilterTable.vue';
import { type Filter } from 'src/widgets/_forms/AdvancedFilterDialog';
import { useI18n } from 'vue-i18n';
import { detectFieldType } from 'src/shared/ui/FilterTableButton';

// === Props ===
/**
 * @property {boolean} modelValue - Контролирует видимость диалога фильтрации
 * @property {object | null | undefined} keys - Объект с доступными ключами для создания фильтров
 */
interface Props {
  modelValue: boolean;
  keys: object | null | undefined;
}

const props = defineProps<Props>();

// === i18n (интернационализация) ===
const { t } = useI18n();

// === Emits ===
/**
 * @event update:modelValue - Обновляет видимость диалога
 * @event add_filters - Отправляет сгруппированные фильтры родительскому компоненту
 */
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'add_filters', value: Filter[]): void;
}

const emit = defineEmits<Emits>();

// === Styles (стили компонента) ===
// Конфигурация размеров диалогового окна
const cardStyle = {
  width: '700px',
  maxWidth: '95vw',
};

// === Computed Properties (вычисляемые свойства) ===
/**
 * Преобразует объект ключей в массив с метаданными
 * Используется для построения списка доступных полей фильтрации
 * Исключает вложенные объекты из результата
 *
 * @returns {Array<{label: string, value: string, type: string}>} Массив доступных полей
 */
const filter_keys = computed(() => {
  if (!props.keys || Object.keys(props.keys).length === 0) return {}
  const result: Array<{ label: string; value: string; type: string }> = []
  Object.entries(props.keys).forEach(([key,item]) => {
    if (typeof item == 'object') return;
    result.push({
      label: t(key),
      value: key,
      type: detectFieldType(item),
    })
  })
  return result
})


/**
 * Обработчик создания фильтров
 * Группирует фильтры по ключам и объединяет значения для одинаковых ключей
 * @param filters - Массив фильтров для обработки
 */
function handleCreated(filters: Filter[]): void {
  const grouped = new Map<string, Filter>();

  filters.forEach(filter => {
    if (!filter.key) return;

    if (grouped.has(filter.key)) {
      // Объединяем значения для одинаковых ключей
      const existing = grouped.get(filter.key)!;
      existing.variable.push(...filter.variable);
    } else {
      // Создаём первый фильтр для данного ключа
      grouped.set(filter.key, {
        ...filter,
        variable: [...filter.variable]
      });
    }
  });

  // Преобразуем Map в массив и отправляем результат
  const result = Array.from(grouped.values());
  emit('add_filters', result);
}

</script>
<style scoped>
.btn-width {
  width: 100px;
}
</style>


