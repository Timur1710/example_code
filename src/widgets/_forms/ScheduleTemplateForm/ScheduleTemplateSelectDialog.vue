<template>
  <DialogWrapper
    :model-value="modelValue"
    title="График работы сотрудника"
    icon=""
    :card-style="cardStyle"
    :showClose="false"
    :headerClass="'worker-schedule-form-dialog__header'"
    content-class="schedule-template-select__content"
    :actionsClass="'q-pt-none worker-schedule-form-dialog__actions'"
    :actions-align="'between'"
    :hideHeaderSeparator="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <div class="schedule-template-select__action">
        <q-btn
          padding="4px 16px"
          class="add_template"
          color="primary"
          icon="sym_o_calendar_today"
          label="+ Добавить шаблон"
          no-caps
          dense
         @click="$emit('handleCreateTemplate')"
      />

        <q-input
          v-model="templateSearch"
          dense
          outlined
          clearable
          hide-bottom-space
          placeholder="Поиск шаблона"
          class="schedule-template-select__search"
          @clear="templateSearch = ''"
        >
          <template #prepend>
            <q-icon name="sym_o_search" />
          </template>
        </q-input>
      </div>
      <div v-if="scheduleStore.isTemplatesLoading" class="flex flex-center q-pa-lg">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="scheduleStore.templates.length === 0" class="text-center q-pa-lg text-grey-6">
        Шаблоны не найдены
      </div>

      <q-table
        v-else
        flat
        hide-header
        v-model:pagination="tablePagination"
        :rows-per-page-options="[5, 10, 20]"
        :rows="templateTableRows"
        :columns="templateTableColumns"
        row-key="key"
        table-style="table-layout: fixed; width: 100%;"
        class="schedule-template-select__table"
      >
        <template #body="props">
          <q-tr :props="props" clickable @click="toggleTemplateItem(props.row.key)">
            <q-td colspan="2" class="q-px-none q-pt-none">
              <div
                :class="[
                  'schedule-template-select__item',
                  { 'schedule-template-select__item__active': selectedTemplateKey === props.row.key }
                ]"
              >
                <q-icon
                  name="sym_o_check_circle"
                  size="sm"
                  :color="selectedTemplateKey === props.row.key ? 'positive' : 'transparent'"
                />

                <div class="schedule-template-select__item-main">
                  <div>{{ props.row.template.name || 'Без названия' }}</div>
                  <div class="text-caption text-grey-7">
                    {{ formatPattern(props.row.template) }}
                  </div>
                </div>

                <div class="row no-wrap q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    round
                    icon="sym_o_edit"
                    color="primary"
                    size="sm"
                    @click.stop="handleEdit(props.row.template)"
                  >
                    <q-tooltip>Редактировать</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    dense
                    round
                    icon="sym_o_delete"
                    color="negative"
                    size="sm"
                    @click.stop="handleDelete(props.row.template)"
                  >
                    <q-tooltip>Удалить</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    
      <!-- Диалог редактирования шаблона -->
      <ScheduleTemplateFormDialog
        v-model="isEditDialogOpen"
        :schedule-item="editingTemplate"
        @saved="handleTemplateSaved"
      />
    </template>

    <template #actions>
      <q-btn label="Закрыть" flat @click="$emit('update:modelValue', false)" />
      <q-btn
        label="Применить"
        color="primary"
        :disable="!selectedTemplate"
        @click="handleApplySelected"
      />
    </template>
  </DialogWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { DialogWrapper } from 'src/shared/ui';
import { useScheduleStore } from 'src/entities/schedule';
import { useWorkerStore } from 'src/entities/worker';
import ScheduleTemplateFormDialog from './ScheduleTemplateFormDialog.vue';
import type { ScheduleListItem } from 'src/entities/schedule';

interface Props {
  modelValue: boolean;
  workerId: string;
  entityType?: 'worker' | 'equipment';
  currentTemplateName?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'applied'): void;
  (e: 'handleCreateTemplate'): void;
}

const props = withDefaults(defineProps<Props>(), {
  entityType: 'worker',
  currentTemplateName: '',
});

const emit = defineEmits<Emits>();

const $q = useQuasar();
const scheduleStore = useScheduleStore();
const workerStore = useWorkerStore();

const isEditDialogOpen = ref(false);
const editingTemplate = ref<ScheduleListItem | null>(null);
const selectedTemplateKey = ref<string | null>(null);
const templateSearch = ref('');
const tablePagination = ref({
  page: 1,
  rowsPerPage: 5,
});

const selectedTemplate = computed(() => {
  if (!selectedTemplateKey.value) {
    return null;
  }

  return (
    scheduleStore.templates.find((template, index) => {
      return getTemplateKey(template, index) === selectedTemplateKey.value;
    }) || null
  );
});

const templateTableRows = computed(() => {
  const query = (templateSearch.value ?? '').trim().toLowerCase();

  return scheduleStore.templates
    .filter((template) => {
      if (!query) {
        return true;
      }

      const name = (template.name || '').toLowerCase();
      const pattern = formatPattern(template).toLowerCase();

      return name.includes(query) || pattern.includes(query);
    })
    .map((template, index) => ({
    key: getTemplateKey(template, index),
    template,
    }));
});

const templateTableColumns: QTableColumn[] = [
  {
    name: 'template',
    label: 'Шаблон',
    field: 'template',
    align: 'left',
  },
  {
    name: 'actions',
    label: 'Действия',
    field: 'actions',
    align: 'right',
  },
];


const cardStyle = {
  width: '364px',
  maxWidth: '95vw',
};

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
function getTemplateKey(template: ScheduleListItem, index: number): string {
  return template._id || `${template.name || 'template'}-${index}`;
}

function toggleTemplateItem(key: string) {
  selectedTemplateKey.value = selectedTemplateKey.value === key ? null : key;
}

function syncSelectedTemplateByCurrentName() {
  const currentName = props.currentTemplateName?.trim();
  if (!currentName) {
    selectedTemplateKey.value = null;
    return;
  }

  const index = scheduleStore.templates.findIndex(
    (template) => (template.name || '').trim() === currentName
  );

  if (index >= 0) {
    selectedTemplateKey.value = getTemplateKey(scheduleStore.templates[index]!, index);
  } else {
    selectedTemplateKey.value = null;
  }
}

function formatPattern(template: ScheduleListItem): string {
  // Новый формат с scheduleEntries
  if (template.scheduleEntries && template.scheduleEntries.length > 0) {
    const entries = template.scheduleEntries;

    if (template.schedulePattern === 'daily' && template.cycleSettings) {
      const cycleLen = template.cycleSettings.cycleLength;
      const workDays = entries.length;
      const timeRange = entries.length === 1
        ? `${entries[0]!.timeStart || '??:??'} – ${entries[0]!.timeEnd || '??:??'}`
        : `${entries[0]!.timeStart || '??:??'} – ${entries[entries.length - 1]!.timeEnd || '??:??'}`;
      return `Цикл ${cycleLen} дн. (${workDays} раб.), ${timeRange}`;
    }

    if (template.schedulePattern === 'weekly') {
      const days = entries
        .map(e => e.dayIndex)
        .sort((a, b) => a - b)
        .map(d => DAY_NAMES[d] || d)
        .join(', ');
      const first = entries[0]!;
      const timeRange = `${first.timeStart || '??:??'} – ${first.timeEnd || '??:??'}`;
      return `${days}, ${timeRange}`;
    }
  }

  return 'Формат расписания не определён';
}

async function loadTemplates() {
  try {
    await scheduleStore.fetchTemplates(props.entityType);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка загрузки шаблонов',
      position: 'top',
    });
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    void loadTemplates().then(() => {
      syncSelectedTemplateByCurrentName();
    });
  } else {
    selectedTemplateKey.value = null;
  }
});

async function handleApply(template: ScheduleListItem) {
  try {
    await workerStore.updateWorker({
      _id: props.workerId,
      scheduleTemplateId: template._id ?? '',
    });

    $q.notify({
      type: 'positive',
      message: `Шаблон "${template.name}" применён`,
      position: 'top',
      timeout: 3000,
    });

    emit('applied');
    emit('update:modelValue', false);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка применения шаблона',
      position: 'top',
    });
  }
}

async function handleApplySelected() {
  if (!selectedTemplate.value) {
    return;
  }

  await handleApply(selectedTemplate.value);
}

function handleEdit(template: ScheduleListItem) {
  editingTemplate.value = template;
  isEditDialogOpen.value = true;
}

function handleDelete(template: ScheduleListItem) {
  if (!template._id) return;

  $q.dialog({
    title: 'Удалить шаблон',
    message: `Удалить шаблон "${template.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    scheduleStore.deleteSchedule(template._id!)
      .then(() => {
        scheduleStore.removeTemplateLocally(template._id!);
        $q.notify({
          type: 'positive',
          message: 'Шаблон удалён',
          position: 'top',
          timeout: 3000,
        });
      })
      .catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Ошибка удаления шаблона',
          position: 'top',
        });
      });
  });
}

async function handleTemplateSaved() {
  await loadTemplates();
}
</script>

<style scoped lang="scss">
.schedule-template-select__action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.schedule-template-select__search {
  flex: 1;
  min-width: 0;
}

.schedule-template-select__search :deep(.q-field__control) {
  min-height: 28px;
  height: 28px;
  border-radius: 4px;
}

.schedule-template-select__search :deep(.q-field__native) {
  padding-top: 0;
  padding-bottom: 0;
}

.schedule-template-select__search :deep(.q-field__prepend),
.schedule-template-select__search :deep(.q-field__append) {
  height: 100%;
  align-items: center;
}

.add_template {
  height: 28px;
  min-height: 28px;
  margin-bottom: 0;
  &::before {
   box-shadow: none !important;
  }
  :deep(.q-btn__content) {
    color: var(--white, #FFF);
    text-align: center;
    font-size: 10px;
    font-style: normal;
    line-height: 13.72px;

  }
}
:deep(.schedule-template-select__content) {
  max-height: 70vh;
  overflow-y: auto;
  min-height: 200px;
}

:deep(.schedule-template-select__table table) {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.schedule-template-select__table .q-table__middle) {
  overflow-x: hidden;
}

:deep(.q-table__bottom) {
  border-top: none !important;
  min-height: auto;
  padding: 0;
  margin-top: -8px;
}

:deep(.schedule-template-select__table .q-tr:hover > td) {
  background: transparent !important;
}

:deep(.q-td) {
  padding: 0 0 8px 0 !important;
  border: none !important;
  &:hover {
    &::before {
      background: transparent !important;
    }
  }
}

.schedule-template-select__item {
  display: flex;
  padding: 8px 16px;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  border-radius: 5px;
  border: 1px solid var(--strong-gray, #A2A2A2)!important;
  background: var(--white, #FFF);
}

.schedule-template-select__item-main {
  flex: 1;
  min-width: 0;
}

.schedule-template-select__item-main .text-caption {
  white-space: normal;
  overflow-wrap: anywhere;
}

.schedule-template-select__item:hover {
  background: var(--q-primary-opacity, rgba(25, 118, 210, 0.05));
}

.schedule-template-select__item__active {
  border-color: var(--positive, #21BA45) !important;
}

.schedule-template-select__item__active:hover {
  background: rgba(33, 186, 69, 0.05);
}
</style>
