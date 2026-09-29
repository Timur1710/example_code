export const MEASUREMENT_UNITS = [
  'pcs',
  'kg',
  'g',
  'l',
  'ml',
  'm',
  'm²',
  'm³'
] as const;

export type MeasurementUnitCode = typeof MEASUREMENT_UNITS[number];