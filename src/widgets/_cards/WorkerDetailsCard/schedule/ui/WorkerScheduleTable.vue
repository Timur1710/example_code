<template>
  <div class="worker-schedule-table">
    <BaseTableTemplate
      :rows="filteredScheduleItems"
      :columns="columns"
      :loading="isLoading"
      row-key="_id"
      :binary-state-sort="true"
      class="worker-schedule-table__table"
      selection-mode="none"
      :pagination="{ rowsPerPage: 5 }"
      :rows-per-page-options="[5, 20, 25]"
      @edit-row="handleBaseEditRow"
      @delete-row="handleBaseDeleteRow"
      @get_filter_query="handleFilterQuery"
    >
      <template #cell-dateStart="{ props }">
        {{ formatDateTime(props.row.dateStart) }}
      </template>

      <template #cell-dateEnd="{ props }">
        {{ formatDateTime(props.row.dateEnd) }}
      </template>

      <template #bodyRight="{ props }">
        <div class="row q-gutter-xs worker-schedule-table__actions">
          <q-btn
            icon="sym_o_edit"
            size="sm"
            flat
            round
            dense
            color="primary"
            @click.stop="handleEditSchedule(props.row)"
          />
          <q-btn
            v-if="canDeleteSchedule"
            icon="sym_o_delete"
            size="sm"
            flat
            round
            dense
            color="negative"
            @click.stop="handleDeleteSchedule(props.row)"
          />
        </div>
      </template>

      <template #no-data>
        <div class="full-width row flex-center text-grey-6 q-gutter-sm">
          <q-icon size="2em" name="info" />
          <span>Расписания не найдены</span>
        </div>
      </template>

      <template #loading>
        <div class="q-pa-md flex flex-center">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </template>
    </BaseTableTemplate>

    <!-- Сообщение об ошибке -->
    <q-banner v-if="error" class="text-white bg-red q-mt-md" rounded>
      <template #avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
      <template #action>
        <q-btn flat label="Закрыть" @click="handleCloseError" />
      </template>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseTableTemplate } from 'src/shared/templates/BaseTableTemplate';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import { formatDateTime } from 'src/shared/utils';
import { useWorkerScheduleTable, type WorkerScheduleItem } from '../model';

// Props
const props = defineProps<{
  scheduleItems: WorkerScheduleItem[];
  isLoading: boolean;
  error: string | null;
}>();

// Emits
const emit = defineEmits<{
  'edit-schedule': [schedule: WorkerScheduleItem];
  'delete-schedule': [schedule: WorkerScheduleItem];
  'close-error': [];
}>();

// Computed
const { canDeleteSchedule, columns, filteredScheduleItems, handleFilterQuery } =
  useWorkerScheduleTable(computed(() => props.scheduleItems));

// Обработчики событий
function handleEditSchedule(schedule: WorkerScheduleItem) {
  emit('edit-schedule', schedule);
}

function handleDeleteSchedule(schedule: WorkerScheduleItem) {
  emit('delete-schedule', schedule);
}

function handleBaseEditRow(row: TableRow) {
  handleEditSchedule(row as WorkerScheduleItem);
}

function handleBaseDeleteRow(row: TableRow) {
  handleDeleteSchedule(row as WorkerScheduleItem);
}

function handleCloseError() {
  emit('close-error');
}
</script>

<style scoped lang="scss">
.worker-schedule-table {
  display: flex;
  flex-direction: column;

  &__table {
    min-height: 0;
  }

  &__actions {
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-end;
  }
}

:deep(.worker-schedule-table__table .base-table__actions-cell) {
  width: 88px;
  min-width: 88px;
}
</style>
