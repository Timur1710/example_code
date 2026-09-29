/**
 * Widget: EntityTree
 * Универсальный компонент дерева сущностей
 */

export * from './config';

export { default as EntityTree } from './ui/EntityTree.vue';
export { createEntityTreeStore, getEntityTreeStore, useEntityTreeStore } from './model/entity-tree.store';
export * from './lib/entity-tree.types';

// Специализированные composables
export {
  useProductionUnitTree,
  useProductionUnitTreeStore,
} from './lib/useProductionUnitTree';

