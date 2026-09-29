/**
 * Типы для виджета управления потоком
 */

import type {
  StreamOperationDto,
  StreamStatus,
  StreamType,
} from 'src/entities/stream';

/** Комментарий к потоку */
export interface StreamComment {
  /** ID комментария */
  _id?: string;
  /** Автор комментария */
  author?: string;
  /** Текст комментария */
  text: string;
  /** Дата создания */
  createdAt?: string;
  /** Позиция комментария */
  position?: number[];
}

/** Данные потока для управления */
export interface ManagementStreamData {
  /** ID потока */
  _id?: string;
  /** ID производственной единицы */
  g_id?: string;
  /** Название потока */
  name: string;
  /** Описание потока */
  description?: string;
  /** Тип потока */
  type: StreamType;
  /** Статус потока */
  status: StreamStatus;
  /** Операции потока */
  operation: StreamOperationDto[];
  /** Комментарии */
  comment: StreamComment[];
}

/** Пропсы компонента ManagementStream */
export interface ManagementStreamProps {
  /** ID потока для редактирования (если не указан - создание нового) */
  streamId?: string | undefined;
  /** ID производственной единицы */
  productionUnitId: string;
  /** Тип потока */
  streamType?: StreamType;
  /** Режим только для чтения */
  readonly?: boolean;
  /** Новый поток */
  isNew?: boolean;
}

/** Состояние виджета управления потоком */
export interface ManagementStreamState {
  /** Данные потока */
  stream: ManagementStreamData | null;
  /** Резервная копия для отслеживания изменений */
  defaultStream: ManagementStreamData | null;
  /** Флаг загрузки */
  isLoading: boolean;
  /** Флаг сохранения */
  isSaving: boolean;
  /** Флаг успешного сохранения */
  saved: boolean;
  /** Ошибка */
  error: string | null;
}
