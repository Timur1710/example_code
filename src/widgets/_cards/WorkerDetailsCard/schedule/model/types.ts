import type { WorkerSchedule } from 'src/entities/schedule';

export type WorkerScheduleItem = Partial<WorkerSchedule> & { _id?: string };

export type FilterOperators = Record<string, unknown>;
export type ParsedFilterQuery = Record<string, FilterOperators>;
