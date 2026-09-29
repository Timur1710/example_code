import { formatDate } from 'src/shared/utils';
import type { WorkerListItem } from 'src/entities/worker';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

/**
 * Проверка, что строка таблицы относится к работнику
 */
export function isWorkerRow(row: TableRow): row is TableRow & WorkerListItem {
  return (
    typeof row._id === 'string' &&
    typeof (row as { p_id?: unknown }).p_id === 'string' &&
    typeof row.name === 'string'
  );
}

export { formatDate };
