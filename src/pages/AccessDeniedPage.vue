<template>
  <div class="access-denied">
    <div class="access-denied__content">
      <q-icon name="block" class="access-denied__icon" />
      <h1 class="access-denied__title">Доступ запрещён</h1>
      <p class="access-denied__text">
        У вас нет прав для просмотра этой страницы.
        <br />
        Обратитесь к администратору для получения доступа.
      </p>
      <div class="access-denied__actions">
        <q-btn
          color="primary"
          label="На главную"
          @click="goHome"
          unelevated
        />
        <q-btn
          color="grey-7"
          label="Назад"
          flat
          @click="goBack"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

function goHome() {
  void router.push('/');
}

function goBack() {
  const from = route.query.from;
  if (from && typeof from === 'string' && from !== route.path) {
    void router.push(from);
  } else {
    void router.back();
  }
}
</script>

<style lang="scss" scoped>
.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);

  &__content {
    text-align: center;
    max-width: 400px;
  }

  &__icon {
    font-size: 80px;
    color: #e53935;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px;
  }

  &__text {
    font-size: 16px;
    color: #666;
    line-height: 1.5;
    margin: 0 0 32px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}
</style>

