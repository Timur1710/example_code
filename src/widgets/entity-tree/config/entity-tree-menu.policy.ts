/**
 * Политика контекстного меню дерева производственных единиц (entityKey как в API).
 * Расширяйте мапы — логику проверок менять не нужно.
 */

/** entityKey → типы узлов, под которыми нельзя создать дочернюю ПЕ («Добавить» / «Изменить» скрыты). */
export const childCreationBlockedTypesByEntityKey: Readonly<Record<string, readonly string[]>> = {
  workers: ['profession'],
  equipment: ['workstation', 'equipment_group'],
};

/** entityKey → типы узлов, для которых показывается пункт «Массовое создание». */
export const bulkCreateMenuTypesByEntityKey: Readonly<Record<string, readonly string[]>> = {
  workers: ['profession'],
};

function normalizeType(nodeType: string | undefined | null): string | undefined {
  const t = nodeType?.trim();
  return t || undefined;
}

/** Можно ли создавать дочерние узлы под данным типом в дереве с этим entityKey. */
export function isChildCreationAllowedForNode(
  entityKey: string,
  nodeType: string | undefined | null,
): boolean {
  const t = normalizeType(nodeType);
  if (!t) return true;
  const blocked = childCreationBlockedTypesByEntityKey[entityKey];
  if (!blocked?.length) return true;
  return !blocked.includes(t);
}

/** Показывать ли «Массовое создание» для узла. */
export function isBulkCreateMenuShownForNode(
  entityKey: string,
  nodeType: string | undefined | null,
): boolean {
  const t = normalizeType(nodeType);
  if (!t) return false;
  const types = bulkCreateMenuTypesByEntityKey[entityKey];
  return !!types?.includes(t);
}

/** Есть ли верхний блок меню (до «Изменить»): добавление и/или массовое создание. */
export function contextMenuHasLeadingSection(
  entityKey: string,
  nodeType: string | undefined | null,
): boolean {
  return (
    isChildCreationAllowedForNode(entityKey, nodeType) ||
    isBulkCreateMenuShownForNode(entityKey, nodeType)
  );
}
