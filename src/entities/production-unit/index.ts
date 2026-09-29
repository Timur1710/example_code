/**
 * Entity: ProductionUnit
 * Производственные единицы (структура предприятия)
 */

export { productionUnitApi } from './api/production-unit.api';
export { useProductionUnitStore } from './model/production-unit.store';
export * from './model/production-unit.types';
export {
  canAttachEquipmentToProductionUnit,
  canAttachEquipmentFromBreadcrumbs,
} from './lib/equipment-placement';

