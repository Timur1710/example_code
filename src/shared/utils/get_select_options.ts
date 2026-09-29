import { useScheduleOptions } from 'src/shared/lib/useScheduleOptions';
import { useMaterialsTypeOptions } from 'src/shared/lib/useMaterialsTypeOptions';
import { useOrdersTypeOptions } from 'src/shared/lib/useOrdersTypeOptions';
/**
 * Массив всех доступных условий для фильтрации с указанием типов данных
 */
export function get_select_options(col: string) {
  switch (col) {
    case 'workers_schedule':
      return useScheduleOptions().value.map(option => ({ label: option.label, value: option.value }));
    case 'materials_type':
      return useMaterialsTypeOptions().value.map(option => ({ label: option.label, value: option.value }));
    case 'orders_type':
      return useOrdersTypeOptions().value.map(option => ({ label: option.label, value: option.value }));  
    default:
      return [];
  }
}