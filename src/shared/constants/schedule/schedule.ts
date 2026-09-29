export const SCHEDULE = [
  '12-hour shift',
  '11-hour shift',
  '24-hour shift',
  '8-hour shift',
  '8-hour shift with working Saturday'
] as const;

export const SCHEDULE_CYCLE = [
  { label:'daily',value: 'day' },
  { label:'weekly',value: 'week' },
  { label:'monthly',value: 'month' },
] as const;
export const DAYS_OF_WEEK_OPTIONS = [
  { label: 'Пн', value: 1 },
  { label: 'Вт', value: 2 },
  { label: 'Ср', value: 3 },
  { label: 'Чт', value: 4 },
  { label: 'Пт', value: 5 },
  { label: 'Сб', value: 6 },
  { label: 'Вс', value: 0 },
];
// Дата в далеком будущем для обозначения "всегда"
export const ALWAYS = '2099-12-31';
export const DAYS_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
export const MONTHS_OF_YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
export const THE_24_HOURS = { start: '00:00', end: '23:59' } as const;
export type ScheduleCode = typeof SCHEDULE[number];
