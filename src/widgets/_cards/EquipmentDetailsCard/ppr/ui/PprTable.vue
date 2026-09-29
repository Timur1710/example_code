<template>
  <div class="ppr-table">
    <!-- Таблица ППР -->
    <q-table
      :rows="pprItems"
      :columns="columns"
      :loading="isLoading"
      row-key="name"
      binary-state-sort
      class="ppr-table__table no-shadow"
    >
      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #no-data>
        <div class="full-width row flex-center text-grey-6 q-gutter-sm">
          <q-icon size="2em" name="info" />
          <span>ППР не найдены</span>
        </div>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-xs">
            <q-btn
              icon="edit"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="handleEditPpr(props.row)"
            />
            <q-btn
              v-if="canDeletePpr"
              icon="delete"
              size="sm"
              flat
              round
              dense
              color="negative"
              @click="handleDeletePpr(props.row)"
            />
          </div>
        </q-td>
      </template>
    </q-table>

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
import { useQuasar } from 'quasar'; 

import type { QTableColumn } from 'quasar';
import type { EquipmentPprItem } from 'src/entities/equipment';
import { getEquipmentPprTableFields, type EquipmentPprFieldKey } from 'src/shared/config';
import { DeleteConfirmationTemplate } from 'src/shared/templates';
import { formatDateTime } from 'src/shared/utils';

// Константы
const EMPTY_CELL_PLACEHOLDER = '—\u00A0\u00A0\u00A0\u00A0';

// Props
const props = withDefaults(
  defineProps<{
    pprItems: EquipmentPprItem[];
    isLoading: boolean;
    error: string | null;
    /** Кастомная видимость колонок (переопределяет настройки по умолчанию) */
    columnVisibility?: Partial<Record<EquipmentPprFieldKey, boolean>>;
  }>(),
  {
    columnVisibility: () => ({}),
  }
);

// Emits
const emit = defineEmits<{
  'edit-ppr': [ppr: EquipmentPprItem];
  'delete-ppr': [ppr: EquipmentPprItem];
  'close-error': [];
}>();
const $q = useQuasar();
// Computed
const canDeletePpr = computed(() => props.pprItems.length > 0);

// Видимые поля таблицы
const visibleTableFields = computed(() => {
  const allFields = getEquipmentPprTableFields();
  return allFields.filter((field) => {
    const customVisible = props.columnVisibility?.[field.key];
    return customVisible !== undefined ? customVisible : field.defaultVisible;
  });
});

// Колонки таблицы (динамически генерируются на основе конфига)
const columns = computed<QTableColumn[]>(() => {
  const dynamicColumns = visibleTableFields.value.map((field) => {
    const baseColumn: QTableColumn = {
      name: field.key,
      label: field.label,
      align: 'center',
      field: field.key,
      sortable: field.sortable || false,
    };

    // Специальная обработка форматирования для разных типов полей
    if (field.type === 'datetime') {
      baseColumn.format = (val: string) =>
        val ? formatDateTime(val) : EMPTY_CELL_PLACEHOLDER;
    } else {
      baseColumn.format = (val: string) => val || EMPTY_CELL_PLACEHOLDER;
    }

    return baseColumn;
  });

  // Добавляем колонку действий
  dynamicColumns.push({
    name: 'actions',
    label: '',
    align: 'center' as const,
    field: 'actions',
  });

  return dynamicColumns;
});

// Методы

// Обработчики событий
function handleEditPpr(ppr: EquipmentPprItem) {
  emit('edit-ppr', ppr);
}

function handleDeletePpr(ppr: EquipmentPprItem) {
  $q.dialog({
    component: DeleteConfirmationTemplate,
    componentProps: {
      title: 'Подтверждение удаления',
      message: 'Вы уверены, что хотите удалить этот ППР?',
      persistent: true,
    },
  }).onOk(() => {
    emit('delete-ppr', ppr);
  });
}


function handleCloseError() {
  emit('close-error');
}
</script>

<style scoped lang="scss">
.ppr-table {
  display: flex;
  flex-direction: column;
  &__table {
    min-height: 0;
  }
}
.table__call {
  display: flex;
  justify-content: center;
  text-align: center;
}
</style>
