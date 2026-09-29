<template>
  <div class="schedule-tab">
    <p class="action_title q-ma-none minus-margin-bottom-24">График работы:</p>
    <TabToolbar
      :search="search"
      :shouldShowSearch="false"
      :shouldShowAddItem="false"
      :spaceClass="'q-pl-none q-py-md'"
      search-placeholder="Поиск расписаний"
      add-button-label="Добавить расписание"
      @search-input="handleSearchInput"
      @add-item="handleAddSchedule"
    >
      <template #add-actions>
        <q-btn
          padding="4px 16px"
          class="min_width_action_button choose_template"
          outline
          color="primary"
          icon="sym_o_calendar_today"
          label="Выбрать шаблон графика"
          no-caps
          dense
          @click="handleSelectTemplate"
        />
      </template>
    </TabToolbar>

    <!-- Информация о текущем шаблоне -->
    <div v-if="currentTemplate" class="schedule-tab__template-info minus-margin-top-24 q-mb-md">
      <q-icon name="sym_o_check_circle" size="sm" color="positive" />
      <div class="schedule-tab__template-details">
        <span class="text-primary">
          Выбран шаблон: {{ currentTemplate.name || 'Без названия' }}
        </span>
        <span class="text-strong-gray">
          {{ formatTemplateInfo(currentTemplate) }}
        </span>
      </div>
      <q-icon
        name="sym_o_delete"
        size="sm"
        color="negative"
        class="schedule-tab__delete-icon pointer"
        @click="handleDeleteTemplate"
      />
    </div>
    <div>
      <p class="action_title q-ma-none minus-margin-top-24 q-mb-md">График отсутствия:</p>
      <q-btn
        padding="4px 16px"
        class="min_width_action_button add_absence"
        outline
        color="primary"
        icon="alarm_off"
        label="+ Добавить отсутствие"
        no-caps
        dense
        @click="handleAddSchedule"
      />
    </div>
    <!-- Таблица расписаний -->
    <WorkerScheduleTable
      :schedule-items="scheduleItems"
      :is-loading="isLoading"
      :error="error"
      class="q-ma-xs"
      @edit-schedule="handleEditSchedule"
      @delete-schedule="handleDeleteSchedule"
      @close-error="handleCloseError"
    />

    <!-- Диалог формы расписания -->
    <WorkerScheduleFormDialog
      v-model="isScheduleFormDialogOpen"
      :worker-id="worker._id"
      :schedule-item="safeEditingSchedule"
      @saved="handleScheduleSaved"
    />

    <!-- Диалог создания шаблона -->
    <ScheduleTemplateFormDialog v-model="isTemplateFormDialogOpen" @saved="handleTemplateSaved" />

    <!-- Диалог выбора шаблона -->
    <ScheduleTemplateSelectDialog
      v-model="isTemplateSelectDialogOpen"
      :worker-id="worker._id"
      :currentTemplateName="currentTemplate?.name || ''"
      entity-type="worker"
      @applied="handleTemplateApplied"
      @handleCreateTemplate="handleCreateTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { debounce, useQuasar } from 'quasar';
import { TabToolbar } from 'src/shared/ui';
import { useScheduleStore } from 'src/entities/schedule';
import { useWorkerStore } from 'src/entities/worker';
import {
  WorkerScheduleFormDialog,
  ScheduleTemplateFormDialog,
  ScheduleTemplateSelectDialog,
} from 'src/widgets/_forms';
import WorkerScheduleTable from './WorkerScheduleTable.vue';
import type { WorkerDetail, ScheduleTemplateData } from 'src/entities/worker';
import type { WorkerSchedule } from 'src/entities/schedule';

// Тип для элемента расписания в таблице
type WorkerScheduleItem = Partial<WorkerSchedule> & { _id?: string };

const props = defineProps<{
  worker: WorkerDetail;
}>();

const scheduleStore = useScheduleStore();
const workerStore = useWorkerStore();
const $q = useQuasar();

const search = ref('');
const isScheduleFormDialogOpen = ref(false);
const isTemplateFormDialogOpen = ref(false);
const isTemplateSelectDialogOpen = ref(false);
const error = ref<string | null>(null);
const editingSchedule = ref<WorkerSchedule | null | undefined>(null);

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const currentTemplate = computed((): ScheduleTemplateData | null => {
  // Приоритет: данные из API (scheduleTemplateData), затем из store
  if (props.worker.scheduleTemplateData) {
    return props.worker.scheduleTemplateData;
  }
  const templateId = props.worker.scheduleTemplateId;
  if (!templateId) return null;
  return scheduleStore.templates.find((t) => t._id === templateId) || null;
});

function formatTemplateInfo(template: ScheduleTemplateData): string {
  const parts: string[] = [];

  // Новый формат с scheduleEntries
  if (template.scheduleEntries && template.scheduleEntries.length > 0) {
    const entries = template.scheduleEntries;

    if (template.schedulePattern === 'daily' && template.cycleSettings) {
      const cycleLen = template.cycleSettings.cycleLength;
      const workDays = entries.length;
      parts.push(`Цикл ${cycleLen} дн. (${workDays} раб.)`);
    } else if (template.schedulePattern === 'weekly') {
      const days = entries
        .map((e) => e.dayIndex)
        .sort((a: number, b: number) => a - b)
        .map((d: number) => DAY_NAMES[d] || d)
        .join(', ');
      parts.push(days);
    }

    const first = entries[0]!;
    if (first.timeStart && first.timeEnd) {
      parts.push(`${first.timeStart} – ${first.timeEnd}`);
    }

    return parts.join(' | ');
  }

  // No template data
  return 'Нет данных';
}

const scheduleItems = computed((): WorkerScheduleItem[] => {
  // Фильтруем по текущему работнику
  let workerSchedules = scheduleStore.schedules.filter(
    (schedule) =>
      schedule.entityType === 'worker' && (schedule as WorkerSchedule).workerId === props.worker._id
  ) as WorkerSchedule[];

  // Применяем локальную фильтрацию по поисковому запросу
  const searchQuery = (search.value ?? '').trim();
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    workerSchedules = workerSchedules.filter((schedule) => {
      const searchableFields = [
        schedule.name,
        schedule.type,
        schedule.dateStart ? new Date(schedule.dateStart).toLocaleDateString('ru-RU') : '',
        schedule.dateEnd ? new Date(schedule.dateEnd).toLocaleDateString('ru-RU') : '',
      ].filter(Boolean);

      return searchableFields.some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(lowerQuery)
      );
    });
  }

  return workerSchedules.map((schedule): WorkerScheduleItem => {
    const item: WorkerScheduleItem = {};

    if (schedule._id) {
      item._id = schedule._id;
    }
    if (schedule.name) {
      item.name = schedule.name;
    }
    if (schedule.dateStart) {
      item.dateStart = schedule.dateStart;
    }
    if (schedule.dateEnd) {
      item.dateEnd = schedule.dateEnd;
    }

    return item;
  });
});

const isLoading = computed(() => scheduleStore.isLoading);
const safeEditingSchedule = computed((): WorkerSchedule | null => editingSchedule.value || null);

const debouncedSearch = debounce((searchValue: string) => {
  search.value = searchValue;
}, 300);

function handleSearchInput(searchValue: string) {
  debouncedSearch(searchValue);
}

function handleAddSchedule() {
  editingSchedule.value = null;
  isScheduleFormDialogOpen.value = true;
}

function handleCreateTemplate() {
  isTemplateFormDialogOpen.value = true;
}

function handleSelectTemplate() {
  isTemplateSelectDialogOpen.value = true;
}

function handleEditSchedule(schedule: WorkerScheduleItem) {
  // Находим соответствующее расписание по _id
  const foundSchedule = scheduleStore.schedules.find(
    (s) => s._id === schedule._id && s.entityType === 'worker'
  ) as WorkerSchedule | undefined;
  editingSchedule.value = foundSchedule || null;
  isScheduleFormDialogOpen.value = true;
}

function handleDeleteSchedule(schedule: WorkerScheduleItem) {
  const scheduleId = schedule._id;
  if (!scheduleId) return;

  $q.dialog({
    title: 'Удалить расписание',
    message: 'Действительно хотите удалить расписание?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void deleteScheduleById(scheduleId);
  });
}

async function deleteScheduleById(scheduleId: string) {
  try {
    await scheduleStore.deleteSchedule(scheduleId);
    error.value = null;
  } catch {
    error.value = 'Ошибка при удалении расписания';
  }
}

async function handleScheduleSaved() {
  // Перезагружаем расписания для работника
  if (!props.worker._id) {
    error.value = 'ID работника не указан';
    return;
  }

  try {
    await scheduleStore.fetchByWorkerId(props.worker._id);
    isScheduleFormDialogOpen.value = false;
    editingSchedule.value = null;
  } catch {
    error.value = 'Ошибка обновления списка расписаний';
  }
}

async function handleTemplateSaved() {
  // Обновляем список шаблонов
  try {
    await scheduleStore.fetchTemplates('worker');
  } catch {
    // Ошибка не критична
  }
}

async function handleTemplateApplied() {
  // Перезагружаем данные работника, чтобы отобразить новый scheduleTemplateId
  try {
    if (props.worker._id) {
      await workerStore.fetchWorkerById(props.worker._id);
      await scheduleStore.fetchTemplates('worker');
    }
  } catch {
    // Ошибка не критична
  }
}

async function handleDeleteTemplate() {
  if (!props.worker._id) {
    error.value = 'ID работника не указан';
    return;
  }

  try {
    await workerStore.updateWorker({
      _id: props.worker._id,
      scheduleTemplateId: null,
    });
    await workerStore.fetchWorkerById(props.worker._id);
    $q.notify({
      type: 'positive',
      message: 'Шаблон графика снят',
      position: 'top',
    });
  } catch {
    error.value = 'Ошибка при удалении шаблона графика';
  }
}

function handleCloseError() {
  error.value = null;
}

// Lifecycle
onMounted(async () => {
  // Загружаем расписания для работника при монтировании
  if (!props.worker._id) {
    error.value = 'ID работника не указан';
    return;
  }

  try {
    await scheduleStore.fetchByWorkerId(props.worker._id);
    // Загружаем шаблоны, чтобы отобразить текущий
    if (props.worker.scheduleTemplateId) {
      await scheduleStore.fetchTemplates('worker');
    }
  } catch {
    error.value = 'Ошибка загрузки расписаний';
  }
});

// Watchers
watch(
  () => props.worker._id,
  async (newWorkerId) => {
    if (!newWorkerId) {
      error.value = 'ID работника не указан';
      return;
    }

    error.value = null;
    editingSchedule.value = null;
    search.value = '';
    try {
      await scheduleStore.fetchByWorkerId(newWorkerId);
    } catch {
      error.value = 'Ошибка загрузки расписаний';
    }
  }
);
</script>

<style scoped lang="scss">
.min_width_action_button {
  min-width: 236px;
  width: 236px;
}
.add_absence {
  & :deep(.q-btn__content) {
    width: 176px;
  }
}
.choose_template {
  & :deep(.q-btn__content) {
    width: 201px;
  }
}

.minus-margin-bottom-24 {
  margin-bottom: -24px;
}
.minus-margin-top-24 {
  margin-top: -24px;
}
.action_title {
  color: #000;
  /* Typing text medium */
  font-family: Roboto;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px; /* 137.5% */
}
.schedule-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  width: 100%;

  &__template-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: var(--white);
    border-radius: 5px;
    border: 1px solid var(--positive);
  }

  &__template-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 10px;
  }

  &__delete-icon {
    margin-left: auto;
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

  &__description {
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
