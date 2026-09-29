<template>
  <div class="worker-schedules">
    <div class="worker-schedules__header">
      <span class="worker-schedules__title">График работы сотрудников:</span>
      <q-btn
        flat
        dense
        round
        icon="keyboard_arrow_up"
        class="worker-schedules__collapse"
        aria-label="Свернуть"
      />
    </div>

    <div class="worker-schedules__toolbar">
      <q-btn
        no-caps
        unelevated
        class="worker-schedules__add-btn"
        icon="sym_o_calendar_today"
        label="+ Добавить"
        @click="openCreateDialog"
      />

      <q-input
        v-model="search"
        dense
        outlined
        clearable
        class="worker-schedules__search"
        placeholder="Поиск шаблона"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <div class="worker-schedules__list">
      <q-inner-loading :showing="isTemplatesLoading" />

      <div
        v-for="item in paginatedTemplates"
        :key="item._id"
        class="worker-schedules__item"
      >
        <div class="worker-schedules__item-main">
          <div class="worker-schedules__item-title">{{ item.name || 'Без названия' }}</div>
          <div class="worker-schedules__item-subtitle">{{ formatTemplateInfo(item) }}</div>
        </div>

        <div class="worker-schedules__item-actions">
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="sym_o_edit"
            color="dark"
            aria-label="Редактировать"
            @click="openEditDialog(item)"
          />
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="sym_o_delete"
            color="negative"
            aria-label="Удалить"
            @click="confirmDelete(item)"
          />
        </div>
      </div>

      <div v-if="!isTemplatesLoading && !filteredTemplates.length" class="worker-schedules__empty">
        Шаблоны графиков не найдены
      </div>
    </div>

    <div v-if="filteredTemplates.length" class="worker-schedules__pagination">
      <q-btn
        flat
        dense
        round
        icon="chevron_left"
        :disable="currentPage === 1"
        aria-label="Предыдущая страница"
        @click="goToPage(currentPage - 1)"
      />
      <span class="worker-schedules__pagination-label">{{ currentPage }} / {{ totalPages }}</span>
      <q-btn
        flat
        dense
        round
        icon="chevron_right"
        :disable="currentPage === totalPages"
        aria-label="Следующая страница"
        @click="goToPage(currentPage + 1)"
      />
    </div>

    <ScheduleTemplateFormDialog
      v-model="isTemplateFormDialogOpen"
      :schedule-item="editingTemplate"
      @saved="handleTemplateSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useScheduleStore } from 'src/entities/schedule';
import type { ScheduleListItem, ScheduleDayEntry } from 'src/entities/schedule';
import { ScheduleTemplateFormDialog } from 'src/widgets/_forms';

const scheduleStore = useScheduleStore();
const { templates, isTemplatesLoading } = storeToRefs(scheduleStore);
const $q = useQuasar();

const search = ref('');
const currentPage = ref(1);
const rowsPerPage = 5;
const isTemplateFormDialogOpen = ref(false);
const editingTemplate = ref<ScheduleListItem | null>(null);

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const filteredTemplates = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return templates.value;
  }

  return templates.value.filter((item) => {
    const searchable = [
      item.name ?? '',
      item.comment ?? '',
      formatTemplateInfo(item),
    ].join(' ').toLowerCase();

    return searchable.includes(query);
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredTemplates.value.length / rowsPerPage));
});

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage;
  return filteredTemplates.value.slice(start, start + rowsPerPage);
});

watch(filteredTemplates, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

watch(search, () => {
  currentPage.value = 1;
});

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) {
    return;
  }
  currentPage.value = page;
}

function openCreateDialog(): void {
  editingTemplate.value = null;
  isTemplateFormDialogOpen.value = true;
}

function openEditDialog(template: ScheduleListItem): void {
  editingTemplate.value = template;
  isTemplateFormDialogOpen.value = true;
}

async function handleTemplateSaved(): Promise<void> {
  await scheduleStore.fetchTemplates('worker');
}

function confirmDelete(template: ScheduleListItem): void {
  if (!template._id) {
    return;
  }

  $q.dialog({
    title: 'Удалить шаблон',
    message: `Удалить шаблон "${template.name || 'Без названия'}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void removeTemplate(template._id!);
  });
}

async function removeTemplate(id: string): Promise<void> {
  try {
    await scheduleStore.deleteSchedule(id);
    scheduleStore.removeTemplateLocally(id);
    $q.notify({
      type: 'positive',
      message: 'Шаблон удален',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить шаблон',
      position: 'top',
    });
  }
}

function getTemplateTimeRange(entries: ScheduleDayEntry[]): string {
  const activeTimes = entries
    .filter((entry) => entry.timeStart && entry.timeEnd)
    .map((entry) => ({
      start: entry.timeStart!,
      end: entry.timeEnd!,
    }));

  if (!activeTimes.length) {
    return '';
  }

  const earliest = activeTimes.reduce((a, b) => (a.start <= b.start ? a : b)).start;
  const latest = activeTimes.reduce((a, b) => (a.end >= b.end ? a : b)).end;
  return `${earliest} – ${latest}`;
}

function formatTemplateInfo(template: ScheduleListItem): string {
  const entries: ScheduleDayEntry[] = template.scheduleEntries ?? [];
  if (!entries.length) {
    return 'Без расписания';
  }

  const timeRange = getTemplateTimeRange(entries);
  if (template.schedulePattern === 'daily' && template.cycleSettings) {
    const cycleLength = template.cycleSettings.cycleLength;
    const workDays = entries.length;
    return `Цикл ${cycleLength} дн. (${workDays} раб.), ${timeRange}`;
  }

  if (template.schedulePattern === 'weekly') {
    const days = entries
      .map((entry) => DAY_NAMES[entry.dayIndex] ?? String(entry.dayIndex))
      .join(', ');
    return `${days}, ${timeRange}`;
  }

  return timeRange || 'Без расписания';
}

onMounted(() => {
  void scheduleStore.fetchTemplates('worker');
});
</script>

<style lang="scss" scoped>
.worker-schedules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f6f6f6;
  border-radius: 5px;
  padding: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: #111010;
    line-height: 22px;
  }

  &__collapse {
    color: #111010;
  }

  &__toolbar {
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 26px;
  }

  &__add-btn {
    background: #111010;
    color: #fff;
    min-height: 26px;
    height: 26px;
    padding: 0 14px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
  }

  &__search {
    flex: 1;

    :deep(.q-field__control) {
      border-radius: 4px;
      min-height: 26px;
      height: 26px;
      background: #fff;
    }

    :deep(.q-field__prepend) {
      height: 26px;
      min-height: 26px;
      padding-right: 4px;
    }

    :deep(.q-field__append) {
      height: 26px;
      min-height: 26px;
      align-items: center;
    }

    :deep(.q-field__focusable-action) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 26px;
      min-height: 26px;
      line-height: 26px;
      margin-top: 0;
      margin-bottom: 0;
      vertical-align: middle;
    }

    :deep(.q-field__native) {
      font-size: 13px;
      padding-top: 0;
      padding-bottom: 0;
      line-height: 20px;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
    position: relative;
  }

  &__item {
    display: flex;
    padding: 8px 16px;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    border-radius: 5px;
    border: 0.5px solid var(--strong-gray, #A2A2A2);
    background: var(--white, #FFF);
  }

  &__item-main {
    min-width: 0;
  }

  &__item-title {
    color: #000;
    /* Typing text small */
    font-family: Roboto;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px; /* 133.333% */
  }

  &__item-subtitle {
    color: var(--strong-gray, #A2A2A2);
    /* Information text */
    font-family: Roboto;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px; /* 160% */
  }

  &__item-actions {
    display: flex;
    align-items: center;
    align-self: center;
    gap: 10px;
    margin-left: auto;

    :deep(.q-btn) {
      width: 22px;
      height: 22px;
      min-height: 22px;
      min-width: 22px;
      padding: 0;
    }

    :deep(.q-icon) {
      font-size: 18px;
    }
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #707070;
    font-size: 14px;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    min-height: 44px;
    margin-top: 0;

    :deep(.q-btn) {
      width: 30px;
      height: 30px;
      min-height: 30px;
      min-width: 30px;
    }
  }

  &__pagination-label {
    min-width: 56px;
    text-align: center;
    color: #000;
    font-family: Roboto;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
}

@media (max-width: 900px) {
  .worker-schedules {
    &__toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    &__add-btn {
      width: 100%;
    }

    &__item-title {
      font-size: 14px;
    }

    &__item-subtitle {
      font-size: 11px;
    }

    &__pagination-label {
      font-size: 14px;
      line-height: 20px;
    }
  }
}
</style>
