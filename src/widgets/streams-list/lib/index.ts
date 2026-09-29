import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';
import type { StreamListItem } from 'src/entities/stream';

/**
 * Проверка, является ли строка таблицы элементом потока
 */
export function isStreamRow(row: TableRow): row is StreamListItem & TableRow {
  return row && typeof row === 'object' && '_id' in row;
}

/**
 * Форматирование даты
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}