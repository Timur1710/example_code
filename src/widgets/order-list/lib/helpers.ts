import { formatDate } from 'src/shared/utils';
import type { OrderListItem } from 'src/entities/order';
import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

/**
 * Проверка, что строка таблицы относится к заказу
 */
export function isOrderRow(row: TableRow): row is TableRow & OrderListItem {
  const p_id = (row as { p_id?: unknown }).p_id;
  const hasValidPId =
    typeof p_id === 'string' ||
    (typeof p_id === 'object' && p_id !== null && typeof (p_id as { _id?: unknown })._id === 'string');

  return (
    typeof row._id === 'string' &&
    hasValidPId &&
    typeof row.name === 'string'
  );
}

/**
 * Форматирование типа заказа
 */
export function formatOrderType(type: 'client' | 'production'): string {
  const typeLabels = {
    client: 'Клиентский',
    production: 'Производственный',
  };
  return typeLabels[type] || type;
}

export { formatDate };

