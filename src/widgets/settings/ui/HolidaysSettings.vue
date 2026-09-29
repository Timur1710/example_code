<template>
  <div class="holidays">
    <div class="holidays__header">
      <span class="holidays__title">Праздники:</span>
      <q-btn
        flat
        dense
        round
        icon="keyboard_arrow_up"
        class="holidays__collapse"
        aria-label="Свернуть"
      />
    </div>

    <div class="holidays__toolbar">
      <q-btn
        no-caps
        unelevated
        class="holidays__add-btn"
        icon="sym_o_calendar_today"
        label="+ Добавить"
        @click="openCreateDialog"
      />
      <q-btn
        no-caps
        outline
        class="holidays__calendar-btn"
        label="Просмотр Календаря"
        @click="openCalendarDialog"
      />
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        class="holidays__search"
        placeholder="Поиск наименования"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-table
      :rows="filteredHolidays"
      :columns="columns"
      row-key="_id"
      flat
      hide-bottom
      :loading="isLoading"
      v-model:pagination="tablePagination"
      class="holidays__table"
    >
      <template #body-cell-date="props">
        <q-td :props="props">{{ formatHolidayDateCell(props.row) }}</q-td>
      </template>

      <template #body-cell-days="props">
        <q-td :props="props">{{ props.row.days ?? '-' }}</q-td>
      </template>

      <template #body-cell-type="props">
        <q-td :props="props">{{ getHolidayTypeLabel(props.row.type) }}</q-td>
      </template>

      <template #body-cell-description="props">
        <q-td :props="props" class="holidays__desc-cell">{{ props.row.description }}</q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="holidays__actions-cell">
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="sym_o_edit"
            color="dark"
            aria-label="Редактировать"
            @click="openEditDialog(props.row)"
          />
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="sym_o_delete"
            color="negative"
            aria-label="Удалить"
            @click="confirmDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <div v-if="filteredHolidays.length" class="holidays__pagination">
      <q-btn
        flat
        dense
        round
        icon="chevron_left"
        :disable="tablePagination.page === 1"
        aria-label="Предыдущая страница"
        @click="goToPage(tablePagination.page - 1)"
      />
      <span class="holidays__pagination-label">{{ tablePagination.page }} / {{ totalPages }}</span>
      <q-btn
        flat
        dense
        round
        icon="chevron_right"
        :disable="tablePagination.page === totalPages"
        aria-label="Следующая страница"
        @click="goToPage(tablePagination.page + 1)"
      />
    </div>

    <!-- Create / Edit Dialog -->
        <!-- Production Calendar Dialog -->
        <q-dialog v-model="isCalendarOpen" persistent>
          <q-card class="holidays__cal-dialog">
            <q-card-section class="q-pb-sm row items-center justify-between">
              <div class="text-h6">Производственный календарь РФ</div>
              <div class="row items-center gap-2">
                <q-btn
                  flat
                  dense
                  round
                  icon="chevron_left"
                  :disable="calendarYear <= 2000"
                  @click="changeCalendarYear(-1)"
                />
                <span class="holidays__cal-year">{{ calendarYear }}</span>
                <q-btn
                  flat
                  dense
                  round
                  icon="chevron_right"
                  :disable="calendarYear >= 2100"
                  @click="changeCalendarYear(1)"
                />
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-table
                :rows="calendarHolidays"
                :columns="calendarColumns"
                row-key="id"
                flat
                dense
                :loading="isCalendarLoading"
                :rows-per-page-options="[10, 20, 50]"
                class="holidays__cal-table"
              >
                <template #body-cell-date="props">
                  <q-td :props="props">{{ formatCalendarPeriod(props.row.dateFrom, props.row.dateTo) }}</q-td>
                </template>
                <template #body-cell-kind="props">
                  <q-td :props="props">{{ props.row.kind }}</q-td>
                </template>
                <template #body-cell-import="props">
                  <q-td :props="props" auto-width>
                    <q-btn
                      flat
                      dense
                      no-caps
                      size="sm"
                      icon="sym_o_add"
                      color="primary"
                      label="Добавить"
                      @click="importFromCalendar(props.row)"
                    />
                  </q-td>
                </template>
                <template #no-data>
                  <div v-if="!isCalendarLoading" class="holidays__cal-empty">
                    Нет данных за {{ calendarYear }} год
                  </div>
                </template>
              </q-table>
            </q-card-section>

            <q-card-actions align="right" class="q-pt-none q-pb-md q-px-md">
              <q-btn flat no-caps label="Закрыть" @click="isCalendarOpen = false" />
            </q-card-actions>
          </q-card>
        </q-dialog>

    <q-dialog v-model="isDialogOpen" persistent>
      <q-card class="holidays__dialog">
        <q-card-section class="q-pb-sm">
          <div class="text-h6">{{ editingHoliday ? 'Редактировать праздник' : 'Добавить праздник' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form ref="formRef" class="holidays__form" greedy>
            <q-input
              v-model="formData.name"
              outlined
              dense
              hide-bottom-space
              label="Наименование"
              :rules="[(v) => !!v || 'Обязательное поле']"
            />
            <q-select
              v-model="formData.type"
              outlined
              dense
              hide-bottom-space
              emit-value
              map-options
              :options="HOLIDAY_TYPE_OPTIONS"
              label="Тип"
              :rules="[(v) => !!v || 'Обязательное поле']"
            />
            <q-input
              v-model="formData.dateStart"
              outlined
              dense
              hide-bottom-space
              type="date"
              label="Дата начала"
              :rules="[(v) => !!v || 'Обязательное поле']"
            />
            <q-input
              v-model="formData.dateEnd"
              outlined
              dense
              hide-bottom-space
              type="date"
              label="Дата окончания"
              :rules="[
                (v) => !!v || 'Обязательное поле',
                (v) => !formData.dateStart || !v || v >= formData.dateStart || 'Дата окончания должна быть не раньше даты начала',
              ]"
            />

            <q-input
              v-if="formData.type === 'short_day'"
              v-model.number="formData.durationHours"
              outlined
              dense
              hide-bottom-space
              type="number"
              label="Продолжительность в часах"
              min="1"
              max="24"
              :rules="[
                (v) => v !== null && v !== undefined && v !== '' || 'Укажите продолжительность в часах',
                (v) => Number(v) > 0 || 'Значение должно быть больше 0',
                (v) => Number(v) <= 24 || 'Значение должно быть не больше 24',
              ]"
            />

            <q-input
              v-model="formData.description"
              outlined
              dense
              hide-bottom-space
              label="Описание"
              maxlength="200"
            />
          </q-form>
        </q-card-section>

        <q-card-actions class="holidays__dialog-actions q-pt-none q-pb-md q-px-md">
          <q-btn
            unelevated
            no-caps
            class="holidays__cancel-btn"
            label="Отменить"
            @click="isDialogOpen = false"
          />
          <q-btn
            unelevated
            no-caps
            label="Сохранить"
            color="primary"
            :loading="isSaving"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { useQuasar, QForm } from 'quasar';
import { useHolidayStore } from 'src/entities/holiday';
import { HOLIDAY_TYPE_LABELS, HOLIDAY_TYPE_OPTIONS } from 'src/entities/holiday';
import type { Holiday, HolidayType } from 'src/entities/holiday';

interface KuzyakHolidayItem {
  date: string;
  name: string;
}

interface KuzyakHolidaysResponse {
  year: number;
  holidays: KuzyakHolidayItem[];
  shortDays: KuzyakHolidayItem[];
  status: number;
}

interface CalendarHolidayRow {
  id: string;
  dateFrom: string;
  dateTo: string;
  daysCount: number;
  name: string;
  kind: 'Праздничный день' | 'Сокращенный день';
  holidayType: HolidayType;
}
const holidayStore = useHolidayStore();
const { holidays, isLoading } = storeToRefs(holidayStore);
const $q = useQuasar();

const ROWS_PER_PAGE = 4;

const search = ref('');
const isDialogOpen = ref(false);
const isSaving = ref(false);
const editingHoliday = ref<Holiday | null>(null);
const formRef = ref<InstanceType<typeof QForm> | null>(null);

// Production calendar state
const isCalendarOpen = ref(false);
const isCalendarLoading = ref(false);
const calendarYear = ref(new Date().getFullYear());
const calendarHolidays = ref<CalendarHolidayRow[]>([]);

const holidaysFromCalendar = computed<Holiday[]>(() => {
  return calendarHolidays.value.map((item) => ({
    name: item.name,
    date: item.dateFrom,
    days: item.holidayType === 'short_day' ? null : item.daysCount,
    type: item.holidayType,
    description: item.daysCount > 1
      ? `${item.kind}, ${formatCalendarPeriod(item.dateFrom, item.dateTo)}`
      : item.kind,
  }));
});

const calendarColumns = [
  { name: 'name', label: 'Наименование', field: 'name', align: 'left' as const, sortable: true },
  { name: 'date', label: 'Дата', field: 'dateFrom', align: 'left' as const, sortable: true },
  { name: 'kind', label: 'Тип', field: 'kind', align: 'left' as const, sortable: true },
  { name: 'import', label: '', field: 'import', align: 'right' as const, sortable: false },
];
const tablePagination = ref({
  page: 1,
  rowsPerPage: ROWS_PER_PAGE,
  sortBy: null,
  descending: false,
});

const emptyForm = (): {
  name: string;
  dateStart: string;
  dateEnd: string;
  durationHours: number | null;
  type: HolidayType;
  description: string;
} => ({
  name: '',
  dateStart: '',
  dateEnd: '',
  durationHours: null,
  type: 'holiday',
  description: '',
});

const formData = reactive(emptyForm());

const columns = [
  { name: 'name', label: 'Наименование', field: 'name', align: 'left' as const, sortable: true },
  { name: 'date', label: 'Дата', field: 'date', align: 'left' as const, sortable: true },
  { name: 'days', label: 'Кол-во дней', field: 'days', align: 'left' as const, sortable: true },
  { name: 'type', label: 'Тип', field: 'type', align: 'left' as const, sortable: true },
  { name: 'description', label: 'Описание', field: 'description', align: 'left' as const, sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const, sortable: false },
];

const filteredHolidays = computed(() => {
  const merged = [...holidaysFromCalendar.value, ...holidays.value];
  const uniqueMap = new Map<string, Holiday>();

  for (const h of merged) {
    const key = `${h.date}|${h.name}|${h.type}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, h);
    }
  }

  const groupedRows = groupMainTableRows(Array.from(uniqueMap.values()));
  const query = search.value.trim().toLowerCase();
  if (!query) return groupedRows;
  return groupedRows.filter((h) =>
    [h.name, h.description, HOLIDAY_TYPE_LABELS[h.type] ?? ''].join(' ').toLowerCase().includes(query)
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredHolidays.value.length / ROWS_PER_PAGE))
);

watch(filteredHolidays, () => {
  if (tablePagination.value.page > totalPages.value) {
    tablePagination.value = { ...tablePagination.value, page: totalPages.value };
  }
});

watch(search, () => {
  tablePagination.value = { ...tablePagination.value, page: 1 };
});

watch(
  () => [formData.type, formData.dateStart],
  ([type, dateStart]) => {
    if (type === 'short_day' && dateStart) {
      formData.dateEnd = dateStart;
    }

    if (type !== 'short_day') {
      formData.durationHours = null;
    }
  }
);

function extractShortDayMeta(description: string): { cleanDescription: string; durationHours: number | null } {
  if (!description) {
    return { cleanDescription: '', durationHours: null };
  }

  const match = description.match(/\s*Продолжительность:\s*(\d+(?:[.,]\d+)?)\s*ч\.?\s*$/i);
  if (!match) {
    return { cleanDescription: description, durationHours: null };
  }

  const rawHours = match[1] ?? '';
  const hours = Number(rawHours.replace(',', '.'));
  const cleanDescription = description.replace(match[0], '').trim().replace(/[.,;:!?]\s*$/, '');
  return {
    cleanDescription,
    durationHours: Number.isFinite(hours) ? hours : null,
  };
}

function goToPage(page: number): void {
  if (page < 1 || page > totalPages.value) return;
  tablePagination.value = { ...tablePagination.value, page };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';

  // ISO-like: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}.${month}.${year}`;
  }

  // Dotted-like with time noise: DDT... .MM.YYYY or DD.MM.YYYY
  const dottedMatch = dateStr.match(/^(\d{2})(?:T.*)?\.(\d{2})\.(\d{4})$/);
  if (dottedMatch) {
    const [, day, month, year] = dottedMatch;
    return `${day}.${month}.${year}`;
  }

  return dateStr;
}

function formatCalendarPeriod(dateFrom: string, dateTo: string): string {
  if (dateFrom === dateTo) {
    return formatDate(dateFrom);
  }
  return `с ${formatDate(dateFrom)} по ${formatDate(dateTo)}`;
}

function toIsoDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dottedMatch = dateStr.match(/^(\d{2})(?:T.*)?\.(\d{2})\.(\d{4})$/);
  if (dottedMatch) {
    return `${dottedMatch[3]}-${dottedMatch[2]}-${dottedMatch[1]}`;
  }

  return null;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getHolidayRange(holiday: Holiday): { start: string; end: string } | null {
  const start = toIsoDate(holiday.date);
  if (!start) return null;

  if (holiday.type !== 'holiday' || !holiday.days || holiday.days < 2) {
    return { start, end: start };
  }

  return { start, end: addDays(start, holiday.days - 1) };
}

function groupMainTableRows(rows: Holiday[]): Holiday[] {
  const sorted = [...rows].sort((a, b) => {
    const aStart = toIsoDate(a.date) ?? a.date;
    const bStart = toIsoDate(b.date) ?? b.date;
    return aStart.localeCompare(bStart);
  });

  const grouped: Holiday[] = [];

  for (const row of sorted) {
    const range = getHolidayRange(row);
    if (!range) {
      grouped.push({ ...row });
      continue;
    }

    const last = grouped[grouped.length - 1];
    if (!last) {
      grouped.push({ ...row, date: range.start });
      continue;
    }

    const lastRange = getHolidayRange(last);
    const canMerge =
      !!lastRange &&
      row.type === 'holiday' &&
      last.type === 'holiday' &&
      row.name === last.name &&
      addDays(lastRange.end, 1) === range.start;

    if (!canMerge) {
      grouped.push({ ...row, date: range.start });
      continue;
    }

    const lastRangeEnd = lastRange.end;
    const newEnd = range.end > lastRangeEnd ? range.end : lastRangeEnd;
    const totalDays =
      Math.round(
        (new Date(`${newEnd}T00:00:00`).getTime() -
          new Date(`${lastRange.start}T00:00:00`).getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1;

    last.days = totalDays;
    last.date = lastRange.start;
  }

  return grouped;
}

function formatHolidayDateCell(row: Holiday): string {
  if (row.type !== 'holiday' || !row.days || row.days < 2) {
    return formatDate(row.date);
  }

  const start = toIsoDate(row.date);
  if (!start) {
    return formatDate(row.date);
  }

  const end = addDays(start, row.days - 1);
  return formatCalendarPeriod(start, end);
}

function getHolidayTypeLabel(type: unknown): string {
  if (type === 'holiday' || type === 'short_day') {
    return HOLIDAY_TYPE_LABELS[type];
  }

  if (typeof type === 'string') {
    return type;
  }

  return '';
}

function isNextDay(prevDate: string, nextDate: string): boolean {
  const prev = new Date(`${prevDate}T00:00:00`);
  const next = new Date(`${nextDate}T00:00:00`);
  const oneDay = 24 * 60 * 60 * 1000;
  return next.getTime() - prev.getTime() === oneDay;
}

function groupCalendarItems(
  items: KuzyakHolidayItem[],
  kind: 'Праздничный день' | 'Сокращенный день',
  holidayType: HolidayType,
  idPrefix: 'h' | 's'
): CalendarHolidayRow[] {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const grouped: CalendarHolidayRow[] = [];

  for (const item of sorted) {
    const last = grouped[grouped.length - 1];
    const canMerge =
      last &&
      last.name === item.name &&
      last.kind === kind &&
      isNextDay(last.dateTo, item.date);

    if (canMerge) {
      last.dateTo = item.date;
      last.daysCount += 1;
      last.id = `${idPrefix}-${last.dateFrom}-${last.dateTo}-${last.name}`;
      continue;
    }

    grouped.push({
      id: `${idPrefix}-${item.date}-${item.name}`,
      dateFrom: item.date,
      dateTo: item.date,
      daysCount: 1,
      name: item.name,
      kind,
      holidayType,
    });
  }

  return grouped;
}

function openCreateDialog(): void {
  editingHoliday.value = null;
  Object.assign(formData, emptyForm());
  isDialogOpen.value = true;
}

async function openCalendarDialog(): Promise<void> {
  isCalendarOpen.value = true;
  await fetchProductionCalendar();
}

function changeCalendarYear(delta: number): void {
  calendarYear.value += delta;
  void fetchProductionCalendar();
}

async function fetchProductionCalendar(): Promise<void> {
  isCalendarLoading.value = true;
  calendarHolidays.value = [];
  try {
    const year = calendarYear.value;
    const { data } = await axios.get<KuzyakHolidaysResponse>(
      `https://calendar.kuzyak.in/api/calendar/${year}/holidays`
    );

    const holidayRows = groupCalendarItems(
      data.holidays ?? [],
      'Праздничный день',
      'holiday',
      'h'
    );

    const shortDayRows = groupCalendarItems(
      data.shortDays ?? [],
      'Сокращенный день',
      'short_day',
      's'
    );

    calendarHolidays.value = [...holidayRows, ...shortDayRows].sort((a, b) =>
      a.dateFrom.localeCompare(b.dateFrom)
    );
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить производственный календарь', position: 'top' });
  } finally {
    isCalendarLoading.value = false;
  }
}

async function importFromCalendar(item: CalendarHolidayRow): Promise<void> {
  try {
    await holidayStore.create({
      name: item.name,
      date: item.dateFrom,
      days: item.holidayType === 'short_day' ? null : item.daysCount,
      type: item.holidayType,
      description: item.daysCount > 1
        ? `${item.kind}, ${formatCalendarPeriod(item.dateFrom, item.dateTo)}`
        : item.kind,
    });
    $q.notify({ type: 'positive', message: `«${item.name}» добавлен`, position: 'top' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось добавить праздник', position: 'top' });
  }
}

function openEditDialog(holiday: Holiday): void {
  const startDate = toIsoDate(holiday.date) ?? '';
  const days = holiday.type === 'holiday' ? Math.max(holiday.days ?? 1, 1) : 1;
  const shortDayMeta = holiday.type === 'short_day'
    ? extractShortDayMeta(holiday.description ?? '')
    : { cleanDescription: holiday.description ?? '', durationHours: null };

  editingHoliday.value = holiday;
  formData.name = holiday.name;
  formData.dateStart = startDate;
  formData.dateEnd = startDate ? addDays(startDate, days - 1) : '';
  formData.durationHours = shortDayMeta.durationHours;
  formData.type = holiday.type;
  formData.description = shortDayMeta.cleanDescription;
  isDialogOpen.value = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate();
  if (!valid) {
    $q.notify({
      type: 'warning',
      message: 'Проверьте заполнение полей формы',
      position: 'top',
    });
    return;
  }

  const startDate = toIsoDate(formData.dateStart);
  const endDate = toIsoDate(formData.dateEnd);
  if (!startDate || !endDate || endDate < startDate) {
    $q.notify({ type: 'negative', message: 'Проверьте корректность периода', position: 'top' });
    return;
  }

  if (formData.type === 'short_day' && (!formData.durationHours || formData.durationHours <= 0 || formData.durationHours > 24)) {
    $q.notify({ type: 'warning', message: 'Укажите корректную продолжительность в часах (1-24)', position: 'top' });
    return;
  }

  const days =
    formData.type === 'short_day'
      ? null
      : Math.round(
          (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) /
            (24 * 60 * 60 * 1000)
        ) + 1;

  const normalizedDescription = formData.description.trim();
  const descriptionWithMeta =
    formData.type === 'short_day' && formData.durationHours
      ? `${normalizedDescription ? `${normalizedDescription}. ` : ''}Продолжительность: ${formData.durationHours} ч.`
      : normalizedDescription;

  isSaving.value = true;
  try {
    if (editingHoliday.value?._id) {
      await holidayStore.update({
        _id: editingHoliday.value._id,
        name: formData.name,
        date: startDate,
        days,
        type: formData.type,
        description: descriptionWithMeta,
      });
      $q.notify({ type: 'positive', message: 'Праздник обновлён', position: 'top' });
    } else {
      await holidayStore.create({
        name: formData.name,
        date: startDate,
        days,
        type: formData.type,
        description: descriptionWithMeta,
      });
      $q.notify({ type: 'positive', message: 'Праздник добавлен', position: 'top' });
    }
    isDialogOpen.value = false;
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить праздник', position: 'top' });
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(holiday: Holiday): void {
  if (!holiday._id) return;
  $q.dialog({
    title: 'Удалить праздник',
    message: `Удалить "${holiday.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void removeHoliday(holiday._id!);
  });
}

async function removeHoliday(id: string): Promise<void> {
  try {
    await holidayStore.remove(id);
    $q.notify({ type: 'positive', message: 'Праздник удалён', position: 'top' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось удалить праздник', position: 'top' });
  }
}

onMounted(() => {
  void holidayStore.fetchAll();
  void fetchProductionCalendar();
});
</script>

<style lang="scss" scoped>
.holidays {
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
    flex-shrink: 0;
  }

  &__calendar-btn {
    min-height: 26px;
    height: 26px;
    padding: 0 14px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: #111010;
    border-color: #111010;
    flex-shrink: 0;
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

  &__table {
    border-radius: 5px;
    overflow: hidden;

    :deep(.q-table__top) {
      display: none;
    }

    :deep(thead tr th) {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      background: #efefef;
      white-space: nowrap;
      padding: 8px 12px;
    }

    :deep(tbody tr td) {
      font-size: 13px;
      color: #111010;
      padding: 8px 12px;
    }

    :deep(tbody tr:hover td) {
      background: #f9f9f9;
    }
  }

  &__desc-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions-cell {
    white-space: nowrap;
    width: 70px;
    text-align: right;

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

  &__dialog {
    width: 420px;
    max-width: 95vw;
  }

    &__cal-dialog {
      width: 760px;
      max-width: 96vw;
    }

    &__cal-year {
      font-size: 16px;
      font-weight: 600;
      min-width: 48px;
      text-align: center;
      color: #111010;
    }

    &__cal-table {
      max-height: 420px;

      :deep(thead tr th) {
        font-size: 12px;
        font-weight: 600;
        color: #333;
        background: #efefef;
        white-space: nowrap;
        padding: 6px 10px;
      }

      :deep(tbody tr td) {
        font-size: 13px;
        color: #111010;
        padding: 6px 10px;
      }
    }

    &__cal-empty {
      padding: 24px;
      text-align: center;
      color: #707070;
      font-size: 14px;
    }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    > * {
      margin: 0;
    }
  }

  &__dialog-actions {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  &__cancel-btn {
    background: var(--gray);
    color: #000;
  }
}
</style>
