/**
 * Operation Entity
 * Управление операциями
 */

// API
export { operationApi } from './api/operation.api';

// Store
export { useOperationStore } from './model/operation.store';

// Types
export type {
  OperationListItem,
  OperationInfoDto,
  OperationResourceDto,
  OperationScriptsDto,
  OperationsListParams,
  OperationsListResponse,
  OperationsPaginationMeta,
  OperationInfoResponse,
  CreateOperationRequest,
  CreateOperationResponse,
  UpdateOperationRequest,
  UpdateOperationResponse,
  // Новые типы для управления ресурсами
  MaterialConditionParams,
  WorkerConditionParams,
  EquipmentConditionParams,
  ResourceConstraints,
  ResourceCondition,
  OperationResource,
  TimeConstraints,
  OperationConstraints,
  TechnicalMap,
} from './model/operation.types';

