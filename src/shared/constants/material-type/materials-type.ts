export const MATERIALS_TYPE = [
  'finished_product',
  'semi_finished_product',
  'raw_material'
] as const;

export type MaterialsTypeCode = typeof MATERIALS_TYPE[number];
