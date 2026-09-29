<template>
  <div class="ppr-tab">
    <TabToolbar
      :search="search"
      search-placeholder="Поиск ППР"
      add-button-label="Добавить ППР"
      @search-input="handleSearchInput"
      @add-item="handleAddPpr"
    />

    <!-- Таблица ППР -->
    <PprTable
      :ppr-items="pprItems"
      :is-loading="isLoading"
      :error="error"
      class="q-ma-xs q-mt-md"
      @edit-ppr="handleEditPpr"
      @delete-ppr="handleDeletePpr"
      @close-error="handleCloseError"
    />

    <!-- Диалог формы PPR -->
    <PprFormDialog
      v-model="isPprFormDialogOpen"
      :equipment-id="equipment._id"
      :schedule-item="safeEditingSchedule"
      @saved="handlePprSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { debounce } from 'quasar';
import { TabToolbar } from 'src/shared/ui';
import { PprFormDialog } from 'src/widgets/_forms';
import { useScheduleStore } from 'src/entities/schedule';
import PprTable from './PprTable.vue';
import type { EquipmentListItem, EquipmentPprItem } from 'src/entities/equipment';
import type { EquipmentSchedule } from 'src/entities/schedule';

// Расширенный тип для совместимости с PprTable (добавляем _id)
type EquipmentPprItemWithId = EquipmentPprItem & { _id?: string };

const props = defineProps<{
  equipment: EquipmentListItem;
}>();

const scheduleStore = useScheduleStore();

const search = ref('');
const isPprFormDialogOpen = ref(false);
const error = ref<string | null>(null);
const editingSchedule = ref<EquipmentSchedule | null | undefined>(null);

const pprItems = computed((): EquipmentPprItemWithId[] => {
  // Фильтруем по текущему оборудованию
  let equipmentSchedules = scheduleStore.schedules.filter(
    (schedule) =>
      schedule.entityType === 'equipment' &&
      (schedule as EquipmentSchedule).equipmentId === props.equipment._id
  ) as EquipmentSchedule[];

  // Применяем локальную фильтрацию по поисковому запросу
  if (search.value.trim()) {
    const lowerQuery = search.value.toLowerCase();
    equipmentSchedules = equipmentSchedules.filter((schedule) => {
      const searchableFields = [
        schedule.name,
        schedule.type,
        schedule.dateStart ? new Date(schedule.dateStart).toLocaleDateString('ru-RU') : '',
        schedule.dateEnd ? new Date(schedule.dateEnd).toLocaleDateString('ru-RU') : '',
        schedule.maintenanceType,
        schedule.downtimeReason,
      ].filter(Boolean);

      return searchableFields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return equipmentSchedules.map((schedule): EquipmentPprItemWithId => {
    const item: EquipmentPprItemWithId = {};

    if (schedule._id) {
      item._id = schedule._id;
    }
    if (schedule.name) {
      item.name = schedule.name;
    }
    if (schedule.dateStart) {
      item.dateStart = new Date(schedule.dateStart).toISOString();
    }
    if (schedule.dateEnd) {
      item.dateEnd = new Date(schedule.dateEnd).toISOString();
    }

    return item;
  });
});

const isLoading = computed(() => scheduleStore.isLoading);
const safeEditingSchedule = computed((): EquipmentSchedule | null => editingSchedule.value || null);

const debouncedSearch = debounce((searchValue: string) => {
  search.value = searchValue;
}, 300);

function handleSearchInput(searchValue: string) {
  debouncedSearch(searchValue);
}

function handleAddPpr() {
  editingSchedule.value = null;
  isPprFormDialogOpen.value = true;
}

function handleEditPpr(ppr: EquipmentPprItemWithId) {
  // Находим соответствующее расписание по _id
  const schedule = scheduleStore.schedules.find(
    (s) => s._id === ppr._id && s.entityType === 'equipment'
  ) as EquipmentSchedule | undefined;
  editingSchedule.value = schedule || null;
  isPprFormDialogOpen.value = true;
}

async function handleDeletePpr(ppr: EquipmentPprItemWithId) {
  if (!ppr._id) return;

  try {
    await scheduleStore.deleteSchedule(ppr._id);
    error.value = null;
  } catch {
    error.value = 'Ошибка при удалении ППР';
  }
}

async function handlePprSaved() {
  // Перезагружаем расписания для оборудования
  if (!props.equipment._id) {
    error.value = 'ID оборудования не указан';
    return;
  }

  try {
    await scheduleStore.fetchByEquipmentId(props.equipment._id);
    isPprFormDialogOpen.value = false;
    editingSchedule.value = null;
  } catch {
    error.value = 'Ошибка обновления списка ППР';
  }
}

function handleCloseError() {
  error.value = null;
}

// Lifecycle
onMounted(async () => {
  // Загружаем расписания для оборудования при монтировании
  if (!props.equipment._id) {
    error.value = 'ID оборудования не указан';
    return;
  }

  try {
    await scheduleStore.fetchByEquipmentId(props.equipment._id);
  } catch {
    error.value = 'Ошибка загрузки ППР';
  }
});

// Watchers
watch(
  () => props.equipment._id,
  async (newEquipmentId) => {
    if (!newEquipmentId) {
      error.value = 'ID оборудования не указан';
      return;
    }

    error.value = null;
    editingSchedule.value = null;
    search.value = '';
    try {
      await scheduleStore.fetchByEquipmentId(newEquipmentId);
    } catch {
      error.value = 'Ошибка загрузки ППР';
    }
  }
);
</script>

<style scoped lang="scss">
.ppr-tab {
  display: flex;
  min-height: 0;
  flex-direction: column;
  width: 100%;
}
</style>
