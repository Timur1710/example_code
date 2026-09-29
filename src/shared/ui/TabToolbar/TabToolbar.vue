<template>
  <div :class="['toolbar','q-gutter-sm',spaceClass]">
    <q-input
      v-if="shouldShowSearch"
      v-model="searchModel"
      :placeholder="searchPlaceholder"
      outlined
      dense
      clearable
      @update:model-value="handleSearch"
      class="col"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <div class="toolbar__actions row items-center">
      <q-btn
        padding="8px"
        v-if="shouldShowAddItem"
        :icon="addButtonIcon || 'add'"
        :label="addButtonLabel"
        color="primary"
        no-caps
        outline
        dense
        @click="handleAddItem"
      />
      <slot name="add-actions" />
    </div>

    <!-- Слот для дополнительных элементов ниже кнопки создания -->
    <slot name="below-add-button" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// Props
const props = withDefaults(defineProps<{
  search: string;
  spaceClass?: string;
  searchPlaceholder: string;
  addButtonLabel: string;
  addButtonIcon?: string;
  shouldShowSearch?: boolean;
  shouldShowAddItem?: boolean;
}>(), {
  shouldShowSearch: true,
  shouldShowAddItem: true,
  spaceClass: 'q-pa-md',
});

// Emits
const emit = defineEmits<{
  'search-input': [value: string];
  'add-item': [];
}>();

// Reactive data
const searchModel = ref(props.search);

// Watchers
watch(() => props.search, (newSearch) => {
  searchModel.value = newSearch;
});

// Handlers
function handleSearch() {
  emit('search-input', searchModel.value);
}

function handleAddItem() {
  emit('add-item');
}
</script>

<style scoped lang="scss">
.toolbar {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
