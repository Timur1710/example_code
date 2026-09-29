<template>
  <DetailsPageTemplate 
    :title="orderTitle"
    :subtitle="'Заказ'"
    :detailsError="detailsError"
    :item="order"
    :isDetailsLoading="isDetailsLoading"
    :fetchItemById="(id) => orderStore.fetchOrderById(id)"
    :clearSelectedItem="() => orderStore.clearSelectedOrder()"
  >
    <template #details-card>
      <template v-if="order">
        <!-- Режим редактирования -->
        <template v-if="isEditing">
          <q-card class="order-details-page__card">
            <q-card-section>
              <div class="text-h6 q-mb-md">Редактирование заказа</div>
              <OrderForm
                :production-unit-id="productionUnitId"
                :order="order"
                mode="edit"
                :show-actions="true"
                @updated="handleUpdated"
                @close="editModeStop"
              />
            </q-card-section>
          </q-card>
        </template>

        <!-- Режим просмотра -->
        <template v-else>
          <OrderDetailsCard
            :order="order"
            :format-date="formatDate"
            @updated="handleUpdated"
            class="order-details-page__card"
          />
        </template>
      </template>
    </template>
  </DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useOrderStore } from 'src/entities/order';
import { DetailsPageTemplate } from 'src/shared/templates/DetailsPageTemplate';
import { OrderForm, OrderDetailsCard } from 'src/widgets';

defineOptions({
  name: 'OrderDetailsPage',
});

const route = useRoute();
const $q = useQuasar();
const orderStore = useOrderStore();

const { selectedOrder, isOrderDetailsLoading, orderDetailsError } = storeToRefs(orderStore);

const isEditing = ref(false);


const orderId = computed(() => route.params.id as string | undefined);
const order = computed(() => selectedOrder.value);
const orderTitle = computed(() => order.value?.name || 'Загрузка...');
const productionUnitId = computed(() => {
  const pId = order.value?.p_id;
  return pId ? String(pId) : null;
});
const isDetailsLoading = computed(() => isOrderDetailsLoading.value);
const detailsError = computed(() => orderDetailsError.value);

// Функция форматирования даты
function formatDate(date?: string | Date): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function editModeStop(): void {
  isEditing.value = false;
}

async function loadOrder(id: string): Promise<void> {
  try {
    await orderStore.fetchOrderById(id);
  } catch (e) {
    console.error('Failed to load order', e);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить заказ',
    });
  }
}

function handleUpdated(): void {
  // Выходим из режима редактирования после успешного обновления
  editModeStop();

  // Перезагружаем данные заказа
  if (orderId.value) {
    void loadOrder(orderId.value);
  }
}
</script>

<style lang="scss" scoped>
.order-details-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.order-details-page__title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.order-details-page__card {
  margin-bottom: 16px;
}
</style>
