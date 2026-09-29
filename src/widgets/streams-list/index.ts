// UI
export { StreamsList } from './ui';
// Model & lib
export * from './model';
export * from './lib';

// Локальные утилиты (не экспортируем наружу, чтобы избежать конфликтов)
export type { StreamsListProps, StreamsListEmits } from './model';