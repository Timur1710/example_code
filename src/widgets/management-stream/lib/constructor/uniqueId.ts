/**
 * Генерация уникального ID
 */

import { ObjectId } from 'bson';

/**
 * Генерирует уникальный идентификатор в формате MongoDB ObjectId
 * @returns {string} Валидный MongoDB ObjectId (24-символьная hex-строка)
 */
export function getUniqueId(): string {
  return new ObjectId().toHexString();
}
