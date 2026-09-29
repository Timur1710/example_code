/**
 * Конфигурация полей для форм и таблиц партий (батчей)
 */

/** Типы полей партии */
export type BatchFieldKey =
  | 'name'
  | 'quantity'
  | 'status'
  | 'stringId'
  | 'deliveryDate'
  | 'expirationDate'
  | 'description'
  | 'feature'
  | 'createdAt';

/** Конфигурация поля батча */
export interface BatchFieldConfig {
  /** Ключ поля */
  key: BatchFieldKey;
  /** Является ли поле обязательным (всегда показывается в форме) */
  required: boolean;
  /** Показывать ли поле по умолчанию */
  defaultVisible: boolean;
  /** Метка поля для отображения */
  label: string;
  /** Тип поля (для формы) */
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  /** Показывать ли поле в таблице */
  showInTable?: boolean;
  /** Можно ли сортировать в таблице */
  sortable?: boolean;
}

/** Конфигурация всех полей батча */
export const BATCH_FIELDS_CONFIG: Record<BatchFieldKey, BatchFieldConfig> = {
  name: {
    key: 'name',
    required: true,
    defaultVisible: true,
    label: 'Название',
    type: 'text',
    showInTable: true,
    sortable: true,
  },
  quantity: {
    key: 'quantity',
    required: true,
    defaultVisible: true,
    label: 'Количество',
    type: 'number',
    showInTable: true,
    sortable: true,
  },
  status: {
    key: 'status',
    required: false,
    defaultVisible: false,
    label: 'Статус',
    type: 'select',
    showInTable: true,
    sortable: true,
  },
  stringId: {
    key: 'stringId',
    required: false,
    defaultVisible: true,
    label: 'ID партии',
    type: 'text',
    showInTable: true,
    sortable: true,
  },
  deliveryDate: {
    key: 'deliveryDate',
    required: false,
    defaultVisible: true,
    label: 'Дата поставки',
    type: 'date',
    showInTable: true,
  },
  expirationDate: {
    key: 'expirationDate',
    required: false,
    defaultVisible: true,
    label: 'Срок годности',
    type: 'date',
    showInTable: true,
  },
  description: {
    key: 'description',
    required: false,
    defaultVisible: true,
    label: 'Описание',
    type: 'textarea',
    showInTable: false,
  },
  feature: {
    key: 'feature',
    required: false,
    defaultVisible: false,
    label: 'Характеристики',
    type: 'text',
    showInTable: true,
  },
  createdAt: {
    key: 'createdAt',
    required: false,
    defaultVisible: true,
    label: 'Дата создания',
    showInTable: false,
    sortable: true,
  },
};

/** Получить обязательные поля (всегда показываются в форме) */
export const getRequiredBatchFields = (): BatchFieldConfig[] =>
  Object.values(BATCH_FIELDS_CONFIG).filter(field => field.required);

/** Получить поля, которые могут быть скрыты/показаны */
export const getOptionalBatchFields = (): BatchFieldConfig[] =>
  Object.values(BATCH_FIELDS_CONFIG).filter(field => !field.required);

/** Получить поля для отображения в таблице */
export const getBatchTableFields = (): BatchFieldConfig[] =>
  Object.values(BATCH_FIELDS_CONFIG).filter(field => field.showInTable);

/** Получить поля формы с учетом видимости */
export const getBatchFormFields = (
  customVisibility?: Partial<Record<BatchFieldKey, boolean>>
): BatchFieldConfig[] => {
  return Object.values(BATCH_FIELDS_CONFIG).filter(field => {
    if (field.required) return true;
    const customVisible = customVisibility?.[field.key];
    return customVisible !== undefined ? customVisible : field.defaultVisible;
  });
};
