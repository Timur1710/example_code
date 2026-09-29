<template>
  <q-card-section class="order-info-modal-header">
    <div class="order-info-modal-header__title text-h6">{{ title }}</div>
    <q-btn
      flat
      round
      dense
      icon="close"
      class="order-info-modal-header__close-btn"
      @click="$emit('close')"
    />
  </q-card-section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style lang="scss" scoped>
.order-info-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f5f5f5;
  padding: 12px 16px;
  flex-shrink: 0;

  &__title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__close-btn {
    flex-shrink: 0;
  }
}
</style>
