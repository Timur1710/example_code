<template>
  <q-page class="order-plan-page" :style-fn="orderPlanPageStyle">
    <!-- Заголовок -->
    <div class="order-plan-page__header">
      <q-btn flat round color="primary" icon="arrow_back" @click="handleBackToOrders" />
      <div class="order-plan-page__title-block">
        <div class="order-plan-page__subtitle">{{ t('order_plan.production_planning') }}</div>
        <div class="order-plan-page__title">
          {{ pageTitle }}
        </div>
      </div>
    </div>

    <!-- Баннер ошибки -->
    <q-banner
      v-if="error"
      class="order-plan-page__notice q-mb-md"
      rounded
      dense
      color="negative"
      text-color="white"
      icon="warning"
    >
      {{ error }}
    </q-banner>

    <!-- Баннер пустого состояния -->
    <q-banner
      v-else-if="!planningResult && !isLoading"
      class="order-plan-page__notice q-mb-md"
      rounded
      dense
      color="grey-2"
      text-color="grey-9"
      icon="event_note"
    >
      {{ t('order_plan.no_data_message') }}
    </q-banner>

    <!-- Контент -->
    <div v-if="planningResult" class="order-plan-page__content">
      <OrderPlanCard :planning-result="planningResult" />
    </div>

    <!-- Состояние загрузки -->
    <q-inner-loading :showing="isLoading">
      <q-spinner-dots color="primary" size="48px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePlanningSelectionStore } from 'src/stores/planning-selection.store';
import { planningApi } from 'src/entities/planning';
import { OrderPlanCard } from 'src/widgets';

defineOptions({
  name: 'OrderPlanPage',
});

const $q = useQuasar();
const router = useRouter();
const planningStore = usePlanningSelectionStore();
const { t } = useI18n();

// Состояние
const isLoading = ref(false);
const error = ref<string | null>(null);

// Ссылки на хранилище
const selectedOrderIds = computed(() => planningStore.selectedOrderIds);
const planningType = computed(() => planningStore.planningType);
const startFrom = computed(() => planningStore.startFrom);
const planningMode = computed(() => planningStore.planningMode);
const planningResult = computed(() => planningStore.planningResult);

// Заголовок страницы
const pageTitle = computed(() => {
  if (selectedOrderIds.value.length === 0) {
    return t('order_plan.orders_plan');
  }
  return t('order_plan.plan_for_orders', { count: selectedOrderIds.value.length });
});

/**
 * Переход обратно на страницу заказов
 */
function handleBackToOrders(): void {
  void router.push({ name: 'orders' });
}

/**
 * Загрузка расчёта планирования
 */
async function fetchPlanCalculation(): Promise<void> {
  if (selectedOrderIds.value.length === 0) {
    error.value = t('order_plan.no_orders_selected');
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Конвертируем дату "YYYY-MM-DD" в ISO-строку с учётом UTC-смещения пользователя,
    // чтобы backend получил полночь по местному времени, а не по UTC.
    let startFromISO = startFrom.value;
    if (startFrom.value) {
      const localMidnight = new Date(startFrom.value + 'T00:00:00');
      startFromISO = localMidnight.toISOString();
    }

    const params: Parameters<typeof planningApi.calculatePlan>[0] = {
      orderIds: selectedOrderIds.value,
      planningType: planningType.value,
      startFrom: startFromISO,
    };
    if (planningMode.value !== 'standard') {
      params.planningMode = planningMode.value;
    }
    if (planningStore.orderBatchingPeriodDays > 0) {
      params.orderBatchingPeriodDays = planningStore.orderBatchingPeriodDays;
    }
    const result = await planningApi.calculatePlan(params);

    planningStore.setPlanningResult(result);
  } catch (e) {
    console.error('Failed to calculate plan:', e);
    error.value = t('order_plan.error_calculating');
    $q.notify({
      type: 'negative',
      message: t('order_plan.error_calculating'),
    });
  } finally {
    isLoading.value = false;
  }
}

// Жизненный цикл
onMounted(() => {
  void fetchPlanCalculation();
});

onBeforeUnmount(() => {
  // Очистка данных планирования при выходе со страницы
  planningStore.clearPlanningData();
});

/**
 * Фиксируем высоту страницы под область layout (как у дефолтного QPage minHeight),
 * иначе контент раздувает q-page и скролл уезжает на document — внутренние скроллы Ганта оказываются ниже экрана.
 */
function orderPlanPageStyle(offset: number, height: number): Record<string, string> {
  const h = height - offset;
  return {
    minHeight: `${h}px`,
    height: `${h}px`,
    maxHeight: `${h}px`,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };
}
</script>

<style lang="scss" scoped>
.order-plan-page {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  padding: 16px;

  &__notice {
    flex-shrink: 0;
  }

  &__header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__subtitle {
    font-size: 12px;
    color: #757575;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__title {
    font-size: 24px;
    font-weight: 500;
    color: #212121;
  }

  &__content {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
