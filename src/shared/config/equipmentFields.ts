/**
 * Конфигурация полей для форм и таблиц ППР (планово-предупредительных ремонтов)
 */

/** Типы полей ППР */
export type EquipmentPprFieldKey =
  | 'name'
  | 'dateStart'
  | 'dateEnd';

/** Конфигурация поля ППР */
export interface EquipmentPprFieldConfig {
  /** Ключ поля */
  key: EquipmentPprFieldKey;
  /** Является ли поле обязательным (всегда показывается в форме) */
  required: boolean;
  /** Показывать ли поле по умолчанию */
  defaultVisible: boolean;
  /** Метка поля для отображения */
  label: string;
  /** Тип поля (для формы) */
  type?: 'text' | 'date' | 'datetime';
  /** Показывать ли поле в таблице */
  showInTable?: boolean;
  /** Можно ли сортировать в таблице */
  sortable?: boolean;
}

/** Конфигурация всех полей ППР */
export const EQUIPMENT_PPR_FIELDS_CONFIG: Record<EquipmentPprFieldKey, EquipmentPprFieldConfig> = {
  name: {
    key: 'name',
    required: true,
    defaultVisible: true,
    label: 'Название',
    type: 'text',
    showInTable: true,
    sortable: true,
  },
  dateStart: {
    key: 'dateStart',
    required: true,
    defaultVisible: true,
    label: 'Дата начала',
    type: 'datetime',
    showInTable: true,
    sortable: true,
  },
  dateEnd: {
    key: 'dateEnd',
    required: true,
    defaultVisible: true,
    label: 'Дата окончания',
    type: 'datetime',
    showInTable: true,
    sortable: true,
  },
};

/** Получить обязательные поля (всегда показываются в форме) */
export const getRequiredEquipmentPprFields = (): EquipmentPprFieldConfig[] =>
  Object.values(EQUIPMENT_PPR_FIELDS_CONFIG).filter(field => field.required);

/** Получить поля, которые могут быть скрыты/показаны */
export const getOptionalEquipmentPprFields = (): EquipmentPprFieldConfig[] =>
  Object.values(EQUIPMENT_PPR_FIELDS_CONFIG).filter(field => !field.required);

/** Получить поля для отображения в таблице */
export const getEquipmentPprTableFields = (): EquipmentPprFieldConfig[] =>
  Object.values(EQUIPMENT_PPR_FIELDS_CONFIG).filter(field => field.showInTable);

/** Получить поля формы с учетом видимости */
export const getEquipmentPprFormFields = (
  customVisibility?: Partial<Record<EquipmentPprFieldKey, boolean>>
): EquipmentPprFieldConfig[] => {
  return Object.values(EQUIPMENT_PPR_FIELDS_CONFIG).filter(field => {
    if (field.required) return true;
    const customVisible = customVisibility?.[field.key];
    return customVisible !== undefined ? customVisible : field.defaultVisible;
  });
};


