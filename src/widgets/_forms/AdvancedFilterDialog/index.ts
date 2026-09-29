
/**
 * Экспортируем компонент AdvancedFilterDialog
 * Это диалоговое окно для работы с фильтрами
 */
export { default as AdvancedFilterDialog } from './AdvancedFilterDialog.vue';

/**
 * Экспортируем компонент FilterTable
 * Это основной компонент формы фильтрации
 */
export { default as FilterTable } from './FilterTable.vue';
export { type_input, get_select_options} from 'src/shared/utils';
export {filterConditions} from './lib/get_filter_conditions';
/**
 * Экспортируем типы для использования в других компонентах
 * Filter - интерфейс для одного условия фильтрации
 * KeyOption - интерфейс для опции выбора в select
 */
export type { Filter, KeyOption,ColumnMeta } from './types';




