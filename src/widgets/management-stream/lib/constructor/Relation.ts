/**
 * Класс для работы со связями операций
 */

import { getUniqueId } from './uniqueId';
import type { ConstructorRelation, ConstructorOperation, PointIndex } from './types';

export class Relation {
  /**
   * Создает временную связь (без ID)
   */
  static createTmp(
    relation: Partial<ConstructorRelation>,
    startId: string,
    secondPoint: PointIndex,
    endId: string
  ): void {
    relation.so_id = endId;
    relation.secondPointIndex = secondPoint;
    relation.startId = startId;
    relation.function = [];
    relation.condition = [];
    relation.default = false;
  }

  /**
   * Создает постоянную связь с ID
   */
  static create(
    tmpRelation: Partial<ConstructorRelation>,
    relation: Partial<ConstructorRelation> & { brg_Color?: string }
  ): void {
    this.commonPartReplacement(tmpRelation, relation);
    tmpRelation._id = getUniqueId();
    tmpRelation.bgr_color = relation.brg_Color || relation.bgr_color || '#007AFC';
  }

  /**
   * Обновляет существующую связь
   */
  static update(
    relation: ConstructorRelation,
    changedRelation: Partial<ConstructorRelation> & { brg_Color?: string; endPoint?: PointIndex }
  ): void {
    this.commonPartReplacement(relation, changedRelation);
    if (changedRelation.brg_Color) {
      relation.bgr_color = changedRelation.brg_Color;
    }
    if (changedRelation.endPoint !== undefined) {
      relation.secondPointIndex = changedRelation.endPoint;
    }
  }

  /**
   * Общая часть замены данных связи
   */
  private static commonPartReplacement(
    targetRelation: Partial<ConstructorRelation>,
    relation: Partial<ConstructorRelation>
  ): void {
    if (relation.result !== undefined) targetRelation.result = relation.result;
    if (relation.function !== undefined) targetRelation.function = relation.function;
    if (relation.condition !== undefined) targetRelation.condition = relation.condition;
    if (relation.condition_operator !== undefined)
      targetRelation.condition_operator = relation.condition_operator;
    if (relation.default !== undefined) targetRelation.default = relation.default;
  }

  /**
   * Проверяет и устанавливает связь по умолчанию
   */
  static checkDefaultStatus(item: ConstructorOperation, relationId?: string): void {
    const defaultRelations = item.relation.filter((rel) => rel.default);

    // Если несколько связей по умолчанию, оставляем только указанную
    if (defaultRelations.length > 1 && relationId) {
      item.relation.forEach((rel) => {
        rel.default = rel._id === relationId;
      });
    }

    // Если одна связь, она автоматически по умолчанию
    if (item.relation.length === 1 && item.relation[0]) {
      item.relation[0].default = true;
    }

    // Если нет связи по умолчанию, делаем первую по умолчанию
    if (defaultRelations.length === 0 && item.relation.length > 0 && item.relation[0]) {
      item.relation[0].default = true;
    }
  }
}
