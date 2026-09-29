<template>
  <div class="alternatives-list-template">
    <!-- Верхняя панель с поиском и кнопкой добавить -->
    <div class="q-pa-md q-gutter-sm">
      <q-input
        v-model="searchQuery"
        :placeholder="searchPlaceholderValue"
        :loading="searchLoadingValue"
        :error="!!searchErrorValue"
        :error-message="searchErrorValue || undefined"
        outlined
        dense
        clearable
        class="col"
        @update:model-value="handleSearch"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-btn
        padding="10px"
        :label="addButtonTextValue"
        color="primary"
        no-caps
        outline
        dense
        @click="handleAdd"
      >
        <q-icon name="add" left />
      </q-btn>
    </div>

    <!-- Список альтернатив -->
    <div class="alternatives-list">
      <q-list v-if="filteredAlternatives.length > 0" bordered separator>
        <q-item
          v-for="alternative in filteredAlternatives"
          :key="alternative._id"
          class="alternative-item"
          clickable
          @click.prevent="handleItemClick(alternative)"
        >
          <div class="icon-section">
            <q-icon :name="getIconName(alternative)" size="20px" class="q-mr-sm" />
          </div>
          <q-item-section class="item-section">
            <q-item-label>{{ alternative.name }}</q-item-label>
            <slot name="caption" :alternative="alternative"></slot>
          </q-item-section>
          <q-btn
            flat
            dense
            round
            icon="sym_o_delete"
            color="negative"
            class="feature-form__remove-btn"
            @click.stop="handleRemove(alternative)"
          />
        </q-item>
      </q-list>

      <!-- Заглушка если нет альтернатив -->
      <div v-else class="q-pa-md text-grey-6 text-center">
        <q-icon name="info" size="32px" class="q-mb-sm" />
        <div>Альтернативы не заданы</div>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loadingValue" class="q-pa-md flex flex-center">
      <q-spinner-dots color="primary" size="32px" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends AlternativeItem">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { AlternativesListTemplateEmits, AlternativeItem } from './model/types';

const props = withDefaults(
  defineProps<{
    alternatives: T[];
    loading?: boolean;
    searchPlaceholder?: string;
    addButtonText?: string;
    entityType?: string;
    searchError?: string | null;
    searchResults?: T[] | null;
    searchLoading?: boolean;
  }>(),
  {
    loading: false,
    searchPlaceholder: 'Поиск альтернатив...',
    addButtonText: 'Добавить альтернативу',
    entityType: 'materials',
    searchError: null,
    searchResults: null,
    searchLoading: false,
  }
);
const router = useRouter();

// Значения по умолчанию через computed
const searchPlaceholderValue = computed(() => props.searchPlaceholder);
const addButtonTextValue = computed(() => props.addButtonText);
const loadingValue = computed(() => props.loading);
const entityTypeValue = computed(() => props.entityType);
const searchErrorValue = computed(() => props.searchError);
const searchResultsValue = computed(() => props.searchResults);
const searchLoadingValue = computed(() => props.searchLoading);

// Фильтрация альтернатив по поисковому запросу или использование результатов поиска
const filteredAlternatives = computed(() => {
  // Если есть результаты поиска, показываем их
  if (searchResultsValue.value) {
    return searchResultsValue.value;
  }

  // Иначе фильтруем текущие альтернативы
  if (!searchQuery.value.trim()) {
    return props.alternatives;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return props.alternatives.filter((alternative) => alternative.name.toLowerCase().includes(query));
});

const emit = defineEmits<AlternativesListTemplateEmits<T>>();

const searchQuery = ref('');

const handleSearch = (query: string | number | null) => {
  const queryString = query?.toString() || '';
  searchQuery.value = queryString;
  emit('search', queryString);
};

const handleAdd = () => {
  emit('add');
};

const handleRemove = (alternative: T) => {
  emit('remove', alternative);
};

const handleItemClick = (alternative: T) => {
  // Если есть результаты поиска, эмитим событие выбора
  if (searchResultsValue.value) {
    emit('select', alternative);
  }
  // Иначе переходим по ссылке на страницу сущности
  else if (entityTypeValue.value) {
    void router.push(`/${entityTypeValue.value}/${alternative._id}`);
  }
};

const getIconName = (alternative: T): string => {
  const icon = alternative.icon;
  return typeof icon === 'string' && icon ? icon : 'inventory';
};
</script>

<style scoped lang="scss">
.alternatives-list-template {
  .search-results {
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  .alternative-item {
    &:hover {
      background-color: #fafafa;
    }
  }
}
.button-section {
  display: flex !important;
  justify-content: flex-end;
}
.icon-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
