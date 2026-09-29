/**
 * Утилиты для работы с единицами измерения
 */

/**
 * Маппинг единиц измерения на русские названия
 */
const MEASUREMENT_UNITS_MAP: Record<string, string> = {
  pcs: 'шт',
  kg: 'кг',
  g: 'г',
  l: 'л',
  ml: 'мл',
  m: 'м',
  'm²': 'м²',
  'm³': 'м³',
};

/**
 * Получить русское название единицы измерения
 * @param measure - Код единицы измерения (например, 'pcs', 'kg')
 * @returns Русское название единицы измерения или оригинальный код, если перевод не найден
 */
export function getMeasureLabel(measure?: string): string {
  if (!measure) return '';
  return MEASUREMENT_UNITS_MAP[measure] || measure;
}

/**
 * Форматировать количество с единицей измерения
 * @param quantity - Количество
 * @param measure - Код единицы измерения
 * @returns Отформатированная строка (например, "100 шт")
 */
export function formatQuantityWithMeasure(quantity: number, measure?: string): string {
  const measureLabel = getMeasureLabel(measure);
  return measureLabel ? `${quantity} ${measureLabel}` : `${quantity}`;
}
