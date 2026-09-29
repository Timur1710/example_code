<template>
  <q-popup-edit
    ref="filterPopupRef"
    id="filter_popup"
    @keyup.enter="apply_filter(currentPopupFilter)"
    :style="filter_popup_width"
    anchor="top left"
    class="filter_modal"
    v-model="currentPopupFilter.key"
  >
    <q-select
      dropdown-icon="keyboard_arrow_down"
      class="filter_input q-mb-sm"
      dense
      options-dense
      outlined
      v-model="currentPopupFilter.condition"
      v-on:update:model-value="change_condition($event.value)"
      :options="availableConditions"
      option-value="value"
      option-label="label"
      autofocus
    />
    <template v-if="show_input">
      <template v-if="col.filter == 'input'">
        <q-input
          v-for="n in number_of_filters"
          :key="n"
          :type="type_input(detectFieldType(row?.[col.field]))"
          class="filter_input q-mb-sm"
          emit-value
          map-options
          dense
          outlined
          v-model="currentPopupFilter.variable[n - 1]"
        >
          <template
            v-if="
              number_of_filters > 1 && n > 1 && currentPopupFilter.condition?.value != '$between'
            "
            v-slot:append
          >
            <q-icon name="close" size="xs" @click="deleteFilter(n - 1)" class="cursor-pointer" />
          </template>
        </q-input>
      </template>
      <template v-if="col.filter == 'select'">
        <q-select
          v-for="n in number_of_filters"
          dropdown-icon="keyboard_arrow_down"
          emit-value
          map-options
          option-value="value"
          :option-label="
            (opt) => (opt.label?.length > 15 ? opt.label.slice(0, 15) + '...' : opt.label)
          "
          :key="n"
          :options="get_select_options(`${route_name}_${props.col.field}`)"
          class="filter_input q-mb-sm"
          dense
          outlined
          :model-value="currentPopupFilter.variable[n - 1]"
          @update:model-value="currentPopupFilter.variable[n - 1] = $event"
        >
          <template v-if="number_of_filters > 1 && n > 1" v-slot:append>
            <q-icon name="close" size="xs" @click="deleteFilter(n - 1)" class="cursor-pointer" />
          </template>
        </q-select>
      </template>
    </template>
    <div class="action_buttons q-mb-sm">
      <q-btn
        size="xs"
        unelevated
        :label="'+ ' + t('add')"
        @click="number_of_filters++"
        v-if="number_of_filters < 5 && show_add_buttons"
      />
      <q-btn
        size="xs"
        :class="number_of_filters > 4 || !show_add_buttons ? 'full-width-button' : ''"
        unelevated
        :label="t('clear')"
        @click="clear_filter()"
        v-close-popup
      />
    </div>

    <template v-if="number_of_filters > 1 && show_math_logical_buttons">
      <q-btn
        size="xs"
        :disabled="disabled_math_logical"
        class="full-width q-mb-sm"
        v-if="currentPopupFilter.math_logical == '$and'"
        unelevated
        color="grey-5"
        @click="change_math_logical('$or')"
        :label="t('and')"
      />
      <q-btn
        size="xs"
        :disabled="disabled_math_logical"
        class="full-width q-mb-sm"
        v-if="currentPopupFilter.math_logical == '$or'"
        unelevated
        color="grey-5"
        @click="change_math_logical('$and')"
        :label="t('or')"
      />
    </template>
    <q-btn
      size="xs"
      class="full-width"
      :disable="!currentPopupFilter.variable[0] && !currentPopupFilter.condition"
      @click="apply_filter(currentPopupFilter)"
      unelevated
      color="primary"
      :label="t('apply')"
      v-close-popup
    />
  </q-popup-edit>
</template>

<script setup lang="ts">
defineOptions({
  name: 'FilterDialog',
  inheritAttrs: false,
});

import { ref, computed } from 'vue';
import {
  filterConditions,
  type_input,
  get_select_options,
  type Filter,
  type ColumnMeta,
} from 'src/widgets/_forms/AdvancedFilterDialog';
import { useI18n } from 'vue-i18n';
import { detectFieldType } from './index';
import { useRoute } from 'vue-router';
const route = useRoute();
const route_name = route.name as string;
// === UI State (состояние пользовательского интерфейса) ===
// Количество добавленных значений для фильтре (1-5)
const number_of_filters = ref(1);
// Отключено ли переключение между логическими операторами ($and / $or)
const disabled_math_logical = ref(true);
// Показывать ли кнопку добавления нового значения
const show_add_buttons = ref(true);
// Показывать ли кнопки переключения логических операторов
const show_math_logical_buttons = ref(true);
// Показывать ли поле ввода / выбора значений
const show_input = ref(true);

const props = defineProps<{
  col: ColumnMeta;
  colIndex: number;
  row?: Record<string, unknown> | undefined;
}>();

const emit = defineEmits<{
  (event: 'add_filter_query', query: Filter): void;
  (event: 'delete_filter_query', field: string): void;
}>();
const { t } = useI18n();

// === Computed Properties (вычисляемые свойства) ===
// Определяет тип текущего поля на основе значения из строки таблицы
const currentFieldType = computed(
  () => (detectFieldType(props.row?.[props.col.field]) || 'text') as keyof typeof filterConditions
);

// Возвращает доступные условия фильтрации для текущего типа поля
const availableConditions = computed(() => {
  return filterConditions[currentFieldType.value] || filterConditions['string'];
});
/**
 * Обработчик изменения условия фильтра
 * Обновляет состояние UI элементов в зависимости от выбранного условия
 * @param value - Значение условия фильтра
 */
const change_condition = (value: string) => {
  // Конфигурация условий с их параметрами UI
  const conditionConfig: Record<
    string,
    {
      disableMathLogical?: boolean;
      showAddButtons?: boolean;
      showMathLogicalButtons?: boolean;
      showInput?: boolean;
      numberOfFilters?: number;
      mathLogical?: '$and' | '$or';
      clearVariable?: boolean;
    }
  > = {
    // Условия с логичским ИЛИ по умолчанию
    $eq: { mathLogical: '$or', numberOfFilters: 1 },
    $ne: { mathLogical: '$or', numberOfFilters: 1 },
    starts_with: { mathLogical: '$or', numberOfFilters: 1 },
    ends_with: { mathLogical: '$or', numberOfFilters: 1 },

    // Условия, которые позволяют менять логический оператор
    contains: { disableMathLogical: false },
    not_contains: { disableMathLogical: false },

    // Условия сравнения (без кнопок добавления)
    $gt: { numberOfFilters: 1, showAddButtons: false, showMathLogicalButtons: false },
    $lt: { numberOfFilters: 1, showAddButtons: false, showMathLogicalButtons: false },
    $gte: { numberOfFilters: 1, showAddButtons: false, showMathLogicalButtons: false },
    $lte: { numberOfFilters: 1, showAddButtons: false, showMathLogicalButtons: false },

    // Условия проверки пустоты
    is_empty: {
      showAddButtons: false,
      showMathLogicalButtons: false,
      showInput: false,
      clearVariable: true,
    },
    is_not_empty: {
      showAddButtons: false,
      showMathLogicalButtons: false,
      showInput: false,
      clearVariable: true,
    },

    // Условие между значениями
    $between: {
      numberOfFilters: 2,
      showAddButtons: false,
      showMathLogicalButtons: false,
    },
  };

  // Получить конфигурацию или использовать значения по умолчанию
  const config = conditionConfig[value] || {};

  // Сброс значений по умолчанию
  disabled_math_logical.value = config.disableMathLogical ?? true;
  show_add_buttons.value = config.showAddButtons ?? true;
  show_math_logical_buttons.value = config.showMathLogicalButtons ?? true;
  show_input.value = config.showInput ?? true;

  if (typeof config.numberOfFilters !== 'undefined') {
    number_of_filters.value = config.numberOfFilters;
    currentPopupFilter.value.variable = currentPopupFilter.value.variable.slice(
      0,
      config.numberOfFilters
    );
  }

  // Применить специфичные конфигурации
  if (config.mathLogical) {
    currentPopupFilter.value.math_logical = config.mathLogical;
  }

  if (config.clearVariable) {
    currentPopupFilter.value.variable = [];
  }
};

/**
 * Изменяет логический оператор между значениями фильтра
 * @param value - Логический оператор ('$and' или '$or')
 */
const change_math_logical = (value: '$and' | '$or') => {
  currentPopupFilter.value.math_logical = value;
};

/**
 * Применяет фильтр и отправляет его родительскому компоненту
 * @param filter - Объект фильтра для применения
 */
const apply_filter = (filter: Filter) => {
  emit('add_filter_query', filter);
};
/**
 * Удаляет фильтр по индексу
 * Обновляет состояние UI элементов при удалении последнего дополнительного фильтра
 * @param index - Индекс удаляемого фильтра
 */
const deleteFilter = (index: number) => {
  // Удалить значение из массива
  currentPopupFilter.value.variable.splice(index, 1);
  number_of_filters.value--;

  // Восстановить UI состояние для одного фильтра
  if (currentPopupFilter.value.variable.length < 2) {
    show_math_logical_buttons.value = true;
    disabled_math_logical.value = true;
    // currentPopupFilter.value.math_logical = '$or';
  }
};

/**
 * Сбрасывает фильтр на начальные значения
 * Восстанавливает состояние UI элементов и уведомляет родительский компонент
 */
const clear_filter = () => {
  // Сброс фильтра на начальное состояние
  currentPopupFilter.value = {
    id: props.colIndex,
    key: props.col.field,
    math_logical: '$or',
    condition: availableConditions.value[0],
    variable: [],
  };

  // Сброс состояния UI элементов
  number_of_filters.value = 1;
  disabled_math_logical.value = true;
  show_add_buttons.value = true;
  show_math_logical_buttons.value = true;
  show_input.value = true;

  // Уведомить родительский компонент о удалении фильтра
  emit('delete_filter_query', props.col.field);
};

// === Filter Data (данные фильтра) ===
// Текущий редактируемый фильтр с конфигурацией
const currentPopupFilter = ref<Filter>({
  id: props.colIndex,
  key: props.col.field,
  math_logical: '$or',
  condition: availableConditions.value[0],
  variable: [],
});
const filter_popup_width = computed(() => {
  const baseWidth = 260; // Базовая ширина
  const basePadding = '12px'; // Базовый отступ
  const offsetPopupY = 30; // Смещение оси Y для позиционирования попапа ниже и по центру относительно иконки фильтра
  const offsetPopupX = props.col.label.length * 8 + (props.col.sortable ? 18 : 0); // Смещение оси X для позиционирования попапа по центру относительно иконки фильтра, учитывая длину текста в заголовке столбца
  return {
    width: `${baseWidth}px`,
    padding: basePadding,
    transform: `translate(-${offsetPopupX}px, ${offsetPopupY}px)`,
    boxShadow: 'none',
    border: '1px solid rgba(102, 102, 102, 0.40)',
  };
});
</script>
<style scoped>
:deep(input.attribute) {
  height: 32px;
  min-height: 32px;
}

div.filter_modal {
  .filter_input {
    & :deep(input[type='number']),
    & :deep(input[type='date']) {
      padding-right: 25px !important;
    }

    & :deep(.q-field__native) {
      min-width: 236px;
    }

    & :deep(.q-field__control) {
      height: 32px;
      min-height: 32px;
      padding: 0;

      &::before {
        border: 1px solid #666;
      }

      & .q-field__control-container {
        height: 32px;
        min-height: 32px;

        & input,
        & div.q-field__native {
          height: 32px;
          min-height: 32px;
          padding: 4px 12px;
          overflow: hidden;
          color: #666;
          text-overflow: ellipsis;
          font-family: Roboto;
          text-transform: capitalize;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 20px;
          /* 142.857% */
        }
      }
    }

    & :deep(.q-field__append) {
      height: 32px;
      min-height: 32px;
      width: 32px;

      i {
        margin: 0 auto;
      }
    }
  }

  button {
    width: auto;
    height: 26px;
    text-transform: capitalize;
    border-radius: 3px;

    & :deep(.q-btn__content) {
      font-size: 14px;
    }
  }

  .action_buttons {
    display: flex;
    gap: 10px;

    & button.q-btn {
      background: var(--gray);
    }

    & :deep(.q-btn):first-child,
    & :deep(.q-btn):last-child {
      flex: 0 0 calc(50% - 5px);
    }
  }

  .full-width-button {
    flex: 1 !important;
  }
}
</style>
