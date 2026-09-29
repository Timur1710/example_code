<template>
  <div
    class="order-info-modal-dates"
    :class="{ 'order-info-modal-dates--conflict': hasDeadlineConflict }"
  >
    <!-- Баннер конфликта -->
    <div v-if="hasDeadlineConflict" class="order-info-modal-dates__conflict-banner">
      <q-icon name="warning" size="20px" color="negative" />
      <span class="order-info-modal-dates__conflict-text">
        {{ t('order_info_modal.deadline_conflict') }}
      </span>
    </div>

    <!-- Время выполнения -->
    <div v-if="executionTime" class="order-info-modal-dates__row">
      <span class="order-info-modal-dates__label">
        {{ t('order_info_modal.execution_time') }}
      </span>
      <span class="order-info-modal-dates__value">
        {{ formatDuration(executionTime.durationMinutes) }}
      </span>
    </div>

    <!-- Плановая дата и время -->
    <div v-if="plannedDate" class="order-info-modal-dates__row">
      <span class="order-info-modal-dates__label">
        {{ t('order_info_modal.planned_date') }}
      </span>
      <span class="order-info-modal-dates__value">
        {{ formatPlannedDateTime(plannedDate) }}
      </span>
    </div>

    <!-- Контрактная дата -->
    <div v-if="contractDate" class="order-info-modal-dates__row">
      <span class="order-info-modal-dates__label">
        {{ t('order_info_modal.contract_date') }}
      </span>
      <span class="order-info-modal-dates__value">
        {{ formatDate(contractDate) }}
      </span>
    </div>

    <div v-if="!contractDate" class="order-info-modal-dates__row">
      <span class="order-info-modal-dates__label">
        {{ t('order_info_modal.contract_date') }}
      </span>
      <span class="order-info-modal-dates__value order-info-modal-dates__value--muted">
        {{ t('order_info_modal.not_specified') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from 'src/shared/utils';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface ExecutionTime {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

defineProps<{
  executionTime: ExecutionTime | null;
  plannedDate: string | null;
  contractDate: string | null;
  hasDeadlineConflict: boolean;
}>();

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} ${t('minutes_short')}`;
  }
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t('days_short')}`);
  if (hours > 0) parts.push(`${hours} ${t('hours_short')}`);
  if (mins > 0) parts.push(`${mins} ${t('minutes_short')}`);
  return parts.join(' ');
}

function formatPlannedDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
</script>

<style lang="scss" scoped>
.order-info-modal-dates {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;

  &--conflict {
    background: #ffebee;
    border-color: #ef5350;
  }

  &__conflict-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ef9a9a;
  }

  &__conflict-text {
    font-weight: 600;
    font-size: 14px;
    color: #c62828;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 6px 0;
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-weight: 500;
    color: #757575;
    font-size: 14px;
  }

  &__value {
    color: #212121;
    font-size: 14px;
    text-align: right;

    &--muted {
      color: #9e9e9e;
      font-style: italic;
    }
  }
}

.order-info-modal-dates--conflict .order-info-modal-dates__row {
  border-bottom-color: #ef9a9a;
}
</style>
