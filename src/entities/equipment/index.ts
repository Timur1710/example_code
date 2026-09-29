/**
 * Equipment Entity
 * Управление оборудованием
 */

// API
export { equipmentApi } from './api/equipment.api';

// Store
export { useEquipmentStore } from './model/equipment.store';

// Types
export type {
  EquipmentOperation,
  EquipmentValue,
  EquipmentListItem,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentPaginationMeta,
  EquipmentInfoResponse,
  CreateEquipmentRequest,
  CreateEquipmentResponse,
  UpdateEquipmentRequest,
  UpdateEquipmentResponse,
  UpdateEquipmentAlternativesRequest,
  UpdateEquipmentAlternativesResponse,
  EquipmentAlternative,
  GetEquipmentAlternativesResponse,
  SearchEquipmentAlternativesResponse,
  EquipmentPprItem,
} from './model/equipment.types';


