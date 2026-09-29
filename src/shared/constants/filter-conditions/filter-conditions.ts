export const allConditions = [
  { label: 'равно', value: '$eq', types: ['text', 'number', 'boolean'] },
  { label: 'не равно', value: '$ne', types: ['text', 'number', 'boolean'] },
  // { label: 'содержит', value: 'contains', types: ['text'] },
  // { label: 'не содержит', value: 'not_contains', types: ['text'] },
  // { label: 'начинается с', value: 'starts_with', types: ['text'] },
  // { label: 'заканчивается на', value: 'ends_with', types: ['text'] },
  { label: 'больше', value: '$gt', types: ['number', 'date'] },
  { label: 'меньше', value: '$lt', types: ['number', 'date'] },
  // { label: 'больше или равно', value: 'greater_than_or_equal', types: ['number', 'date'] },
  // { label: 'меньше или равно', value: 'less_than_or_equal', types: ['number', 'date'] },
   { label: 'диапазон', value: '$between', types: ['number', 'date'] },
  // { label: 'заполнено', value: 'is_not_empty', types: ['text', 'number', 'date'] },
  // { label: 'не заполнено', value: 'is_empty', types: ['text', 'number', 'date'] }
] as const;


export type FilterType = 'text' | 'number' | 'date' | 'boolean';