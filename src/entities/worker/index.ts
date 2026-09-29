/**
 * Worker Entity
 * Управление сотрудниками
 */

// API
export { workerApi } from './api/worker.api';

// Store
export { useWorkerStore } from './model/worker.store';

// Types
export type {
  WorkerSelector,
  WorkersSelectorResponse,
  WorkerOperation,
  WorkerOperationDetail,
  WorkerDetail,
  WorkerDetailResponse,
  ScheduleTemplateData,
  WorkerListItem,
  WorkersPaginationMeta,
  WorkersListResponse,
  WorkersListParams,
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  UpdateWorkerResponse,
} from './model/worker.types';

