import { formatDate } from 'src/shared/utils';
import type { MaterialListItem } from 'src/entities/material';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

/**
 * Проверка, что строка таблицы относится к материалу
 */
export function isMaterialRow(row: TableRow): row is TableRow & MaterialListItem {
  return (
    typeof row._id === 'string' &&
    typeof (row as { p_id?: unknown }).p_id === 'string' &&
    typeof row.name === 'string'
  );
}

export { formatDate };

