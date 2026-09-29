import type { QTableColumn, QTableProps } from 'quasar';
import type { RouteLocationRaw } from 'vue-router';

export type RowId = string | number;

export interface TableRow {
  id?: RowId;
  _id?: RowId;
  [key: string]: unknown; // остальные поля произвольные
}

export type TableRequestPayload = Parameters<NonNullable<QTableProps['onRequest']>>[0];

export interface BaseTableTemplateProps {
  columns: QTableColumn[];
  rows: TableRow[];
  rowKey?: string;
  selectionMode?: 'multiple' | 'none';
  /** Обработчик изменения строки */
  onEditRow?: (row: TableRow) => void;
  /** Обработчик удаления строки */
  onDeleteRow?: (row: TableRow) => void;
  /** Включать ли меню редактирования */
  isEditMenuEnabled?: boolean;
  /**
   * Имя роута для перехода по клику на строку.
   * Используется, если не передан кастомный rowRouteResolver.
   */
  detailsRouteName?: string;
  /** Ключ параметра роута, по умолчанию id */
  detailsRouteParamKey?: string;
  pagination?: QTableProps['pagination'];
  rowsPerPageOptions?: QTableProps['rowsPerPageOptions'];
  loading?: boolean;
  rowsNumber?: number;
  binaryStateSort?: boolean;
  navigateOnRowClick?: boolean;
  isFilterDialogOpen?: boolean;
  rowRouteResolver?: (row: TableRow) => RouteLocationRaw | undefined;
}

