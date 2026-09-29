/**
 * Утилиты для работы со связями
 */

import type { ConstructorOperation, ConstructorRelation } from './types';

/**
 * Находит индекс операции, содержащей связь с указанным ID
 * @param cells - Массив операций
 * @param relationId - ID связи
 * @returns Индекс операции или undefined
 */
export function findRelationParentItemIndex(
  cells: ConstructorOperation[],
  relationId: string
): number | undefined {
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell && cell.relation) {
      const hasRelation = cell.relation.some((rel) => rel._id === relationId);
      if (hasRelation) return i;
    }
  }
  return undefined;
}

/**
 * Собирает все связи из всех операций в один массив
 * @param cells - Массив операций
 * @returns Массив всех связей
 */
export function allItemsRelations(
  cells: ConstructorOperation[]
): ConstructorRelation[] {
  return cells.reduce<ConstructorRelation[]>((result, item) => {
    if (item.relation.length > 0) {
      return [...result, ...item.relation];
    }
    return result;
  }, []);
}

/**
 * Находит операцию, содержащую связь с указанным ID
 * @param cells - Массив операций
 * @param relationId - ID связи
 * @returns Операция или undefined
 */
export function findRelationParentItem(
  cells: ConstructorOperation[],
  relationId: string
): ConstructorOperation | undefined {
  const index = findRelationParentItemIndex(cells, relationId);
  return index !== undefined ? cells[index] : undefined;
}
