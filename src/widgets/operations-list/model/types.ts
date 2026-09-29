import type { TableRow } from 'src/shared/templates/BaseTableTemplate/model/types';

export interface OperationsListProps {
  /** ID выбранной производственной единицы */
  productionUnitId: string | null;
  /** Включать ли дочерние по умолчанию */
  includeDescendants?: boolean | undefined;
  /** Имя сущности для построения имени роута */
  entities?: string | undefined;
  /** Обработчик редактирования строки (пробрасывается в меню действий) */
  onEditRow?: ((row: TableRow) => void) | undefined;
  /** Обработчик удаления строки (пробрасывается в меню действий) */
  onDeleteRow?: ((row: TableRow) => void) | undefined;
}

export type OperationsListEmits = {
  (event: 'edit', row: TableRow): void;
  (event: 'delete', row: TableRow): void;
};

