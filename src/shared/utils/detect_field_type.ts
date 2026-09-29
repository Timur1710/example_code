export const detectFieldType = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  // Проверка на объект или массив
  if (typeof value === 'object') {
    return Array.isArray(value) ? 'array' : 'object';
  }
  // Теперь value гарантированно примитив (string | number | boolean | symbol | bigint)
  const strValue = String(value as string | number | boolean | symbol | bigint).trim();
  
  // Пустая строка
  if (strValue === '') {
    return 'string';
  }
  
  // Boolean
  if (strValue === 'true' || strValue === 'false') {
    return 'boolean';
  }
  
  // Number (целое или дробное)
  if (!isNaN(Number(strValue)) && strValue !== '') {
    return Number.isInteger(Number(strValue)) ? 'integer' : 'float';
  }
  
  // Date (ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(strValue)) {
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return 'date';
    }
  }
  
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
    return 'email';
  }
  
  // URL
  try {
    new URL(strValue);
    return 'url';
  } catch {
    // Not a URL
  }
  
  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strValue)) {
    return 'uuid';
  }
  
  // По умолчанию - строка
  return 'string';
};