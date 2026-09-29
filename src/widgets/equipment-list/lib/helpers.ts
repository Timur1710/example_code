import { formatDate } from 'src/shared/utils';
import type { EquipmentListItem } from 'src/entities/equipment';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

/**
 * Проверка, что строка таблицы относится к оборудованию
 */
export function isEquipmentRow(row: TableRow): row is TableRow & EquipmentListItem {
  return (
    typeof row._id === 'string' &&
    typeof (row as { p_id?: unknown }).p_id === 'string' &&
    typeof row.name === 'string'
  );
}

export { formatDate };



