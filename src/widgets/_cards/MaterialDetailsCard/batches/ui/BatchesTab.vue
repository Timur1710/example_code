<template>
  <div class="batches-tab">
    <TabToolbar
      :search="search"
      search-placeholder="Поиск партий"
      add-button-label="Добавить партию"
      @search-input="handleSearchInput"
      @add-item="handleAddBatch"
    />

    <BatchesTable
      :batches="batches"
      :pagination="pagination"
      :is-loading="isLoading"
      :error="error"
      @request="onRequest"
      @edit-batch="handleEditBatch"
      @delete-batch="handleDeleteBatch"
      @close-error="handleCloseError"
    />

    <BatchFormDialog
      v-model="isCreateDialogOpen"
      :entity-id="material._id"
      :entity-type="'Material'"
      @created="handleBatchCreated"
    />

    <BatchFormDialog
      v-model="isEditDialogOpen"
      :entity-id="material._id"
      :entity-type="'Material'"
      mode="edit"
      :batch="safeEditingBatch"
      @updated="handleBatchUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { debounce } from 'quasar';
import { useBatchStore } from 'src/entities/batch';
import type { BatchListItem, BatchesListParams } from 'src/entities/batch';
import type { MaterialListItem } from 'src/entities/material';
import { BatchFormDialog } from 'src/widgets/_forms';
import { TabToolbar } from 'src/shared/ui';
import BatchesTable from './BatchesTable.vue';

// Props
const { material } = defineProps<{
  material: MaterialListItem;
}>();

// Store
const batchStore = useBatchStore();

// Reactive data
const search = ref('');
const error = ref<string | null>(null);
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingBatch = ref<BatchListItem | null | undefined>(null);

// Computed
const batches = computed(() => batchStore.filteredBatches);
const pagination = computed(() => batchStore.pagination);
const isLoading = computed(() => batchStore.isLoading);
const safeEditingBatch = computed((): BatchListItem | null => editingBatch.value || null);



// Обработчики событий
const debouncedSearch = debounce((searchValue: string) => {
  search.value = searchValue;
  batchStore.searchBatches(searchValue);
}, 300);

function handleSearchInput(searchValue: string) {
  debouncedSearch(searchValue);
}

function handleAddBatch() {
  isCreateDialogOpen.value = true;
}

function handleEditBatch(batch: BatchListItem) {
  editingBatch.value = batch || null;
  isEditDialogOpen.value = true;
}

async function handleDeleteBatch(batch: BatchListItem) {
  try {
    await batchStore.deleteBatch(batch._id);
  } catch {
    error.value = 'Ошибка при удалении партии';
  }
}

async function handleBatchCreated() {
  // Перезагрузить список партий после создания
  await loadBatches();
  batchStore.searchBatches(search.value);
}

async function handleBatchUpdated() {
  // Перезагрузить список партий после обновления
  await loadBatches();
  batchStore.searchBatches(search.value);
}

function handleCloseError() {
  error.value = null;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean } }) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  await loadBatches(page, rowsPerPage, sortBy, descending);
}

async function loadBatches(
  page = 1,
  rowsPerPage = 10,
  sortBy = 'createdAt',
  descending = true
) {
  try {
    const params: BatchesListParams = {
      page,
      rowsPerPage,
      sortBy,
      descending,
    };

    await batchStore.fetchByEntityId(material._id, params);
    error.value = null;
  } catch {
    error.value = 'Ошибка загрузки партий';
  }
}

// Lifecycle
onMounted(async () => {
  await loadBatches();
});

// Watchers
watch(() => material._id, async () => {
  await loadBatches();
});
</script>

<style scoped lang="scss">
.batches-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
