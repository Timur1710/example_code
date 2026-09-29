<template>
  <div class="q-pa-md">
    <!-- Таблица с фильтрами -->
    <q-table
      flat bordered
      title="Filterable Table"
      :rows="filters"
      :columns="columns"
      row-key="id"
      :filter="filter"
      :loading="loading"
      hide-bottom
    >
      <!-- Панель инструментов таблицы (кнопки и поиск) -->
      <template v-slot:top>
        <q-btn size="xs" unelevated color="light-blue" :disable="loading" label="Добавить" @click="addRow" />
        <q-btn size="xs" unelevated v-if="filters.length !== 0" class="q-ml-sm" color="blue-grey-2" :disable="loading" label="Удалить" @click="removeRow" />
        <q-space />
        <q-input outlined dense debounce="300" color="primary" v-model="filter">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <!-- Тело таблицы (строки с фильтрами) -->
      <template v-slot:body="props">
        <q-tr :props="props">
          <!-- Колонка: Выбор поля для фильтрации -->
          <q-td key="key" :props="props">
            <q-select 
              emit-value
              map-options
              option-value="value"
              option-label="label"
              v-model="props.row.key" 
              :options="filterKeys" 
              dense 
              autofocus 
              @update:model-value="props.row.condition = filterConditions.string[0]"
            />                
          </q-td>

          <!-- Колонка: Выбор условия фильтрации -->
          <q-td key="condition" :props="props">
            <q-select 
              v-model="props.row.condition" 
              :options="availableConditions(type_input(get_type(props.row.key)))" 
              dense 
              autofocus
            />
          </q-td>

          <!-- Колонка: Ввод значения для фильтрации -->
          <q-td key="value" :props="props">
            <!-- Для булевых значений используем переключатель -->
            <q-toggle 
              v-if="get_type(props.row.key) === 'boolean'" 
              v-model="props.row.variable[0]" 
              checked-icon="check" 
              color="primary" 
              unchecked-icon="clear"
              :label="props.row.variable[0]"
            />
            
            <!-- Для остальных типов используем поле ввода -->
            <template v-else>
              <div class="row q-gutter-sm">
                <!-- Первое поле ввода (основное значение) -->
                <q-input 
                  class="col" 
                  :type="type_input(get_type(props.row.key))" 
                  dense 
                  outlined 
                  hide-bottom-space 
                  v-model="props.row.variable[0]"
                />
                
                <!-- Второе поле ввода (только для условия 'between') -->
                <q-input 
                  v-if="props.row.condition.value == 'between'" 
                  class="col"
                  :type="type_input(get_type(props.row.key))" 
                  dense 
                  outlined 
                  hide-bottom-space 
                  v-model="props.row.variable[1]"
                />
              </div>
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Панель действий (кнопки отмены и применения) -->
    <div class="q-mt-lg">
      <!-- Кнопка отмены (закрывает диалог без сохранения) -->
      <q-btn label="Отмена" flat color="grey" @click="emit('closeDialog')" v-close-popup />
      
      <!-- Кнопка применения (отправляет фильтры родителю) -->
      <q-btn
        class="float-right"
        label="Применить"
        color="primary"
        @click="emit('created', filters)"
        v-close-popup
      />
    </div>
  </div>
</template>
<script setup lang="ts">
/**
 * FilterTable Component
 * 
 * Компонент таблицы для создания и управления фильтрами.
 * Позволяет пользователю:
 * - Добавлять и удалять строки фильтров
 * - Выбирать поля для фильтрации
 * - Выбирать условия фильтрации
 * - Вводить значения для фильтрации
 * - Поддерживает условие 'between' для диапазонных значений
 */

defineOptions({
  name: 'FilterTable',
});

// === Imports ===
import { ref } from 'vue';
import type { PropType } from 'vue';
import { filterConditions, type_input } from './index';
import type { Filter, KeyOption } from './types';
import { useI18n } from 'vue-i18n';

// === i18n ===
const { t } = useI18n();

// === Emits ===
/**
 * @event created - Отправляет массив созданных фильтров родительскому компоненту
 * @event closeDialog - Сигнал для закрытия диалогового окна
 */
const emit = defineEmits<{
  created: [filters: Filter[]]; // Массив фильтров, которые пользователь создал
  closeDialog: []; // Сигнал для закрытия диалога
}>();

// === Props ===
/**
 * @property {Record<string, unknown> | null | undefined} keys - Объект с доступными ключами для фильтрации
 */
const props = defineProps({
  keys: {
    type: Object as PropType<Record<string, unknown> | null | undefined>,
    required: true
  },
});

// === Table Configuration (конфигурация таблицы) ===
// Определение колонок таблицы фильтров
const columns = [
  { name: 'key', align: 'center' as const, label: t('Поле'), field: 'key', sortable: true },
  { name: 'condition', align: 'center' as const, label: 'Отбор', field: 'condition', sortable: true },
  { name: 'value', align: 'center' as const, label: 'Значение', field: 'value', sortable: true },
];

// === Reactive State (реактивное состояние) ===
// Индикатор загрузки (для анимации добавления/удаления строк)
const loading = ref(false);
// Поисковый фильтр для таблицы
const filter = ref('');
// Счётчик для генерации уникальных ID строк
const rowCount = ref(1);
// Массив активных фильтров
const filters = ref<Filter[]>([]);

// === Computed Data (вычисляемые данные) ===
// Преобразует объект ключей props в массив для использования в селекторе
const filterKeys = props.keys
  ? Object.entries(props.keys).map(([, item]) => ({
    label: (item as KeyOption).label,
    value: (item as KeyOption).value,
    type: (item as KeyOption).type
  }))
  : [];

// === Methods (методы компонента) ===
/**
 * Получает тип поля по его ключу
 * @param {string | undefined} key - Ключ поля
 * @returns {string | undefined} Тип поля (string, number, boolean и т.д.)
 */
const get_type = (key: string | undefined) => {
  return filterKeys.find(option => option.value === key)?.type;
};

/**
 * Возвращает доступные условия фильтрации для типа поля
 * @param {string | undefined} key - Тип поля
 * @returns {Array<{label: string, value: string}>} Массив доступных условий
 */
function availableConditions(key: string | undefined) {
  // Получаем условия для типа поля или используем условия для строк по умолчанию
  const conditions = filterConditions[key as keyof typeof filterConditions] || filterConditions['string'];
  
  // Преобразуем условия в формат для q-select
  return conditions.map(condition => ({
    label: condition.label,
    value: condition.value
  }));
};

/**
 * Добавляет новую строку фильтра в начало таблицы
 *
 */
function addRow() {
  loading.value = true;
  setTimeout(() => {
    // Если это первая строка, сбрасываем счётчик
    if (filters.value.length === 0) {
      rowCount.value = 0;
    }

    // Создаём новый фильтр с начальными значениями
    filters.value.unshift({
      id: ++rowCount.value, // Увеличиваем счётчик для уникального ID
      key: '', // Пользователь выберет поле
      math_logical: '$or', // Логический оператор по умолчанию
      condition: filterConditions.string[0], // Условие по умолчанию для строк
      variable: [''], // Пустое значение для ввода
    });

    loading.value = false;
  }, 100);
}

/**
 * Удаляет первую строку фильтра из таблицы
 */
function removeRow() {
  loading.value = true;
  setTimeout(() => {
    // Создаём новый массив без первого элемента
    filters.value = [...filters.value.slice(1, filters.value.length)];
    loading.value = false;
  }, 100);
}
</script>

<!-- === Styles (стили компонента) === -->
<style scoped>
/* Может быть использовано для фиксирования ширины кнопок при необходимости */
</style>