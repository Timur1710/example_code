/**
 * Material Entity
 * Управление материалами
 */

// API
export { materialApi } from './api/material.api';

// Store
export { useMaterialStore } from './model/material.store';

// Types
export type {
  GetMaterialAlternativesResponse,
  MaterialAlternativeDto,
  MaterialListItem,
  MaterialSupplyRecord,
  MaterialValue,
  MaterialsListParams,
  MaterialsListResponse,
  MaterialsPaginationMeta,
  MaterialInfoResponse,
  CreateMaterialRequest,
  CreateMaterialResponse,
  UpdateMaterialRequest,
  UpdateMaterialResponse,
  MaterialType,
  UpdateMaterialAlternativesRequest,
  UpdateMaterialAlternativesResponse,
  SearchMaterialAlternativesResponse,
  StreamByMaterialDto,
  GetStreamByMaterialResponse,
  MaterialTreeNode,
  GetBomByStreamResponse,
} from './model/material.types';

