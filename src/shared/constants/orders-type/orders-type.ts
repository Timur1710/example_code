export const ORDERS_TYPE = [
  'client',
  'production'
] as const;

export type OrdersTypeCode = typeof ORDERS_TYPE[number];