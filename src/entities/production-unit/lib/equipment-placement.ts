import type { ProductionUnitType, ProductionUnitBreadcrumb } from '../model/production-unit.types';

/** Совпадает с ProductionUnitType (строки API) */
const PU = {
  enterprise: 'enterprise',
  folder: 'folder',
  workshop: 'workshop',
  section: 'section',
  line: 'line',
  workstation: 'workstation',
  equipment_group: 'equipment_group',
} as const;

/**
 * Согласовано с backend: production-unit-hierarchy.utils → canAttachEquipmentToProductionUnit
 */
export function canAttachEquipmentToProductionUnit(
  nodeType: ProductionUnitType | string,
  ancestorTypes: readonly (ProductionUnitType | string)[]
): boolean {
  const t = String(nodeType);
  const enterpriseAmongAncestors = ancestorTypes.some((a) => String(a) === PU.enterprise);
  if (t === PU.enterprise) {
    return false;
  }
  if (t === PU.folder) {
    return !enterpriseAmongAncestors;
  }
  if (
    t === PU.workshop ||
    t === PU.section ||
    t === PU.line ||
    t === PU.workstation ||
    t === PU.equipment_group
  ) {
    return true;
  }
  return false;
}

/** Хлебные крошки: от корня к текущему узлу (последний — выбранный). */
export function canAttachEquipmentFromBreadcrumbs(
  breadcrumbs: Pick<ProductionUnitBreadcrumb, 'type'>[]
): boolean {
  if (!breadcrumbs.length) {
    return false;
  }
  const ancestorTypes = breadcrumbs.slice(0, -1).map((b) => b.type as ProductionUnitType);
  const nodeType = breadcrumbs[breadcrumbs.length - 1]!.type;
  return canAttachEquipmentToProductionUnit(nodeType, ancestorTypes);
}
