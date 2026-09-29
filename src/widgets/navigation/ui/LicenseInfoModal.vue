<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="license-modal">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">О программном обеспечении</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="license-content">
        <div class="license-section">
          <h3>MSA — Система управления производством</h3>
          <p>Версия: 3.1.1</p>
          <p>Номер сборки: 00011</p>
        </div>

        <div class="license-section">
          <h4>Правообладатель</h4>
          <p>© 2025 Цифровая платформа MSA®. Все права защищены.</p>
        </div>

        <div class="license-section">
          <h4>Описание</h4>
          <p>
            MSA — это цифровая платформа для управления производственными
            процессами, планирования задач, контроля выполнения заказов
            и мониторинга эффективности работы предприятия.
          </p>
        </div>

        <div class="license-section">
          <h4>Лицензия</h4>
          <p>
            Данное программное обеспечение распространяется по лицензионному
            соглашению. Использование ПО допускается только при соблюдении
            условий лицензионного соглашения.
          </p>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style lang="scss" scoped>
.license-modal {
  min-width: 500px;
  max-width: 600px;
}

.license-content {
  max-height: 60vh;
  overflow-y: auto;
}

.license-section {
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 10px;
    color: #333;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px;
    color: #555;
  }

  p {
    font-size: 13px;
    line-height: 1.5;
    margin: 0 0 8px;
    color: #666;
  }
}
</style>

