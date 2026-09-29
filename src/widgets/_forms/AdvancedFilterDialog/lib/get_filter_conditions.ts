
import { allConditions,type FilterType } from 'src/shared/constants/filter-conditions';
const typeFilter = (type: FilterType) => allConditions.filter(c => c.types.some(t => t === type));

export const filterConditions = {
  string: typeFilter('text'),
  number: typeFilter('number'),
  integer: typeFilter('number'),
  float: typeFilter('number'),
  date: typeFilter('date'),
  boolean: typeFilter('boolean')
};