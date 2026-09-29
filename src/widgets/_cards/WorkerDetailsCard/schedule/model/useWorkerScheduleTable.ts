import { computed, ref, type ComputedRef } from 'vue';
import type { QTableColumn } from 'quasar';
import type { WorkerScheduleItem, ParsedFilterQuery, FilterOperators } from './types';

const EMPTY_CELL_PLACEHOLDER = '—\u00A0\u00A0\u00A0\u00A0';

export function useWorkerScheduleTable(
  scheduleItems: ComputedRef<WorkerScheduleItem[]>
) {
  const filterQuery = ref('');

  const canDeleteSchedule = computed(() => scheduleItems.value.length > 0);

  const columns = computed<QTableColumn[]>(() => [
    {
      name: 'name',
      label: 'Название',
      align: 'left',
      field: 'name',
      sortable: true,
      filter: 'input',
      format: (val: string) => val || EMPTY_CELL_PLACEHOLDER,
    },
    {
      name: 'dateStart',
      label: 'Дата начала',
      align: 'left',
      field: 'dateStart',
      filter: 'input',
      sortable: true,
    },
    {
      name: 'dateEnd',
      label: 'Дата окончания',
      align: 'left',
      field: 'dateEnd',
      filter: 'input',
      sortable: true,
    },
  ]);

  const filteredScheduleItems = computed(() => {
    if (!filterQuery.value) {
      return scheduleItems.value;
    }

    const parsedQuery = parseFilterQuery(filterQuery.value);
    if (!parsedQuery) {
      return scheduleItems.value;
    }

    return scheduleItems.value.filter((row) => doesRowMatchQuery(row, parsedQuery));
  });

  function handleFilterQuery(query: string) {
    filterQuery.value = query;
  }

  return {
    canDeleteSchedule,
    columns,
    filteredScheduleItems,
    handleFilterQuery,
  };
}

function parseFilterQuery(query: string): ParsedFilterQuery | null {
  try {
    const parsed = JSON.parse(query) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed as ParsedFilterQuery;
  } catch {
    return null;
  }
}

function toComparableDate(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function toSafeSearchString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return String(value).toLowerCase();
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  return '';
}

function compareValues(left: unknown, right: unknown): number {
  const leftDate = toComparableDate(left);
  const rightDate = toComparableDate(right);
  if (leftDate !== null && rightDate !== null) {
    return leftDate - rightDate;
  }

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!isNaN(leftNumber) && !isNaN(rightNumber)) {
    return leftNumber - rightNumber;
  }

  const leftString = toSafeSearchString(left);
  const rightString = toSafeSearchString(right);
  if (leftString > rightString) return 1;
  if (leftString < rightString) return -1;
  return 0;
}

function doesRowMatchOperator(fieldValue: unknown, operator: string, expected: unknown): boolean {
  const fieldString = toSafeSearchString(fieldValue);
  const expectedString = toSafeSearchString(expected);

  switch (operator) {
    case '$eq':
      return compareValues(fieldValue, expected) === 0;
    case '$ne':
      return compareValues(fieldValue, expected) !== 0;
    case '$gt':
      return compareValues(fieldValue, expected) > 0;
    case '$gte':
      return compareValues(fieldValue, expected) >= 0;
    case '$lt':
      return compareValues(fieldValue, expected) < 0;
    case '$lte':
      return compareValues(fieldValue, expected) <= 0;
    case 'contains':
      return fieldString.includes(expectedString);
    case 'not_contains':
      return !fieldString.includes(expectedString);
    case 'starts_with':
      return fieldString.startsWith(expectedString);
    case 'ends_with':
      return fieldString.endsWith(expectedString);
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldString.trim() === '';
    case 'is_not_empty':
      return !(fieldValue === null || fieldValue === undefined || fieldString.trim() === '');
    case '$in':
      return Array.isArray(expected)
        ? expected.some((item) => compareValues(fieldValue, item) === 0)
        : false;
    case '$nin':
      return Array.isArray(expected)
        ? !expected.some((item) => compareValues(fieldValue, item) === 0)
        : true;
    default:
      return true;
  }
}

function doesRowMatchField(
  row: WorkerScheduleItem,
  fieldKey: string,
  operators: FilterOperators
): boolean {
  const fieldValue = row[fieldKey as keyof WorkerScheduleItem];

  return Object.entries(operators).every(([operator, expected]) => {
    if (operator === '$and' && Array.isArray(expected)) {
      return expected.every((condition) => {
        if (!condition || typeof condition !== 'object') {
          return true;
        }

        return Object.entries(condition as Record<string, unknown>).every(([innerOp, innerVal]) =>
          doesRowMatchOperator(fieldValue, innerOp, innerVal)
        );
      });
    }

    return doesRowMatchOperator(fieldValue, operator, expected);
  });
}

function doesRowMatchQuery(row: WorkerScheduleItem, query: ParsedFilterQuery): boolean {
  return Object.entries(query).every(([fieldKey, operators]) => {
    if (!operators || typeof operators !== 'object') {
      return true;
    }

    return doesRowMatchField(row, fieldKey, operators);
  });
}
