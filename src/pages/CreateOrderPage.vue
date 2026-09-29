<template>
  <q-page class="create-order-page">
    <div class="create-order-page__header">
      <q-btn flat round color="primary" icon="arrow_back" @click="goBack" />

      <div class="create-order-page__title-block">
        <div class="create-order-page__subtitle">{{ t('order_form.order') }}</div>
        <div class="create-order-page__title">
          {{ orderName }}
        </div>
      </div>
    </div>

    <div class="create-order-page__content">
      <q-card class="create-order-page__card">
        <q-card-section>
          <div class="text-h6 q-mb-md">{{ t('order_form.order_parameters') }}</div>
          <OrderForm
            ref="orderFormRef"
            :production-unit-id="productionUnitId"
            :show-actions="true"
            @created="handleCreated"
            @close="handleClose"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { OrderForm } from 'src/widgets';
import { CloseModalConfirmTemplate } from 'src/shared/templates';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();

const orderFormRef = ref<InstanceType<typeof OrderForm>>();

  // Получаем productionUnitId из query параметров
const productionUnitId = ref<string | null>(null);

// Константа для отображения названия страницы
const orderName = t('order_form.create_order');
function confirmBeforeLeave(force = false, onConfirm: () => void): Promise<void> | void {
  const shouldConfirm = force !== true && Boolean(orderFormRef.value?.hasFilledFields);

  if (!shouldConfirm) {
    onConfirm();
    return;
  }

  return new Promise((resolve) => {
    $q.dialog({
      component: CloseModalConfirmTemplate,
      componentProps: {
        message: 'Вы уверены, что хотите закрыть страницу?',
      },
    })
      .onOk(() => {
        onConfirm();
        resolve();
      })
      .onCancel(() => resolve());
  });
}

function goBack(): void {
  void confirmBeforeLeave(false, () => {
    void router.go(-1);
  });
}

async function handleClose(force = false): Promise<void> {
  await confirmBeforeLeave(force, () => {
    void router.push({
      name: 'orders',
      query: productionUnitId.value ? { groupId: productionUnitId.value } : {},
    });
  });
}

function handleCreated(): void {
  // Переходим обратно к списку заказов после успешного создания
  void router.push({
    name: 'orders',
    query: productionUnitId.value ? { groupId: productionUnitId.value } : {},
  });
}

onMounted(() => {
  // Получаем productionUnitId из query параметров
  productionUnitId.value = (route.query.productionUnitId as string) || null;
});
</script>

<style scoped lang="scss">
.create-order-page {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f5f5f5;
  height: calc(100vh - 49px);
  overflow: hidden;

  &__header {
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
    font-size: 13px;
    color: #7a7a7a;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  &__card {
    margin-bottom: 16px;
  }
}
</style>
