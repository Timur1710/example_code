import { formatDate } from 'src/shared/utils';
import type { OperationListItem } from 'src/entities/operation';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

/**
 * Проверка, что строка таблицы относится к операции
 */
export function isOperationRow(row: TableRow): row is TableRow & OperationListItem {
  return (
    typeof row._id === 'string' &&
    typeof row.name === 'string'
  );
}

export { formatDate };

