<template>
  <q-page class="create-stream-page">
    <div class="create-stream-page__header">
      <q-btn flat round color="primary" icon="arrow_back" @click="goBack" />

      <div class="create-stream-page__title-block">
        <div class="create-stream-page__subtitle">Поток</div>
        <div class="create-stream-page__title">
          {{ streamName }}
        </div>
      </div>
    </div>

    <div class="create-stream-page__content">
      <StreamTabs ref="streamTabsRef" :production-unit-id="productionUnitId" :is-new="true" :mode="'create'"
        :on-close="handleClose" @parameters-submit="handleSubmit" />
    </div>

    <!-- Кнопки действий -->
    <div class="create-stream-page__actions">
      <q-btn flat :label="t('common.cancel')" color="grey-7" @click="handleClose" />
      <q-btn :label="t('common.save')" color="primary" @click="handleSave" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import {
  useStreamStore,
  streamApi,
  type CreateStreamRequest,
  type StreamOperationDto,
  type StreamRelationDto,
} from 'src/entities/stream';
import { useQuasar } from 'quasar';
import { StreamTabs } from 'src/widgets/stream-creation';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { t, t: tI18n } = useI18n();
const streamStore = useStreamStore();
const { streamFormData } = storeToRefs(streamStore);

const streamTabsRef = ref<{
  switchToParametersTab: () => void;
  parametersPanelRef: {
    formRef: {
      validate?: () => Promise<boolean>;
    } | null;
  } | null;
}>();

// Получаем productionUnitId из query параметров
const productionUnitId = ref<string | null>(null);

// Получаем имя потока из store
const streamName = computed(
  () => streamFormData.value.name || t('stream_form.create_stream')
);

function goBack(): void {
  void router.go(-1);
}

function handleClose(): void {
  // Очищаем данные формы при выходе
  streamStore.clearStreamFormData();
  // Переходим обратно к списку потоков
  void router.push({
    name: 'streams',
    query: productionUnitId.value ? { productionUnitId: productionUnitId.value } : {},
  });
}

async function handleSave(): Promise<void> {
  // Собираем данные для создания потока из store
  const formData = streamFormData.value;

  // Проверяем наличие обязательных данных
  if (!formData.name || !formData.name.trim()) {
    // Если данных нет, переключаемся на вкладку параметров
    streamTabsRef.value?.switchToParametersTab();
    $q.notify({
      type: 'negative',
      message: tI18n('stream_form.name_required'),
    });
    return;
  }

  if (!productionUnitId.value) {
    streamTabsRef.value?.switchToParametersTab();
    $q.notify({
      type: 'negative',
      message: tI18n('stream_form.production_unit_required'),
    });
    return;
  }

  // Если форма доступна, дополнительно валидируем её
  const form = streamTabsRef.value?.parametersPanelRef?.formRef;
  if (form) {
    const formValidation = (form as unknown as { validate: () => Promise<boolean> }).validate?.();
    if (formValidation instanceof Promise) {
      const isValid = await formValidation;
      if (!isValid) {
        // Если форма не валидна, переключаемся на вкладку параметров для отображения ошибок
        streamTabsRef.value?.switchToParametersTab();
        $q.notify({
          type: 'negative',
          message: tI18n('stream_form.form_validation_failed'),
        });
        return;
      }
    }
  }

  // Получаем операции из конструктора через метод store
  type StoreWithConstructor = typeof streamStore & {
    getConstructorState: (productionUnitId: string | null) => StreamOperationDto[] | null;
  };
  const storeWithConstructor = streamStore as StoreWithConstructor;
  const savedOperations = storeWithConstructor.getConstructorState(productionUnitId.value);

  // Подготавливаем операции для создания потока
  let operations: StreamOperationDto[] = savedOperations || [];

  // Очищаем служебные данные из relations (как в prepareStreamForSave)
  operations = JSON.parse(JSON.stringify(operations)) as StreamOperationDto[];
  operations.forEach((item: StreamOperationDto) => {
    if (item.relation && item.relation.length) {
      item.relation.forEach((rel: StreamRelationDto) => {
        // Удаляем временные поля
        if ('startId' in rel) {
          delete (rel as Record<string, unknown>).startId;
        }
        if (rel.condition && rel.condition.length) {
          rel.condition.forEach((cond: unknown) => {
            if (cond && typeof cond === 'object' && '_id' in cond) {
              delete (cond as Record<string, unknown>)._id;
            }
          });
        }
      });
    }
  });

  // Формируем запрос на создание потока
  const createRequest: CreateStreamRequest = {
    name: formData.name.trim(),
    p_id: productionUnitId.value,
    type: 'stream',
    status: 'draft',
    operation: operations,
    materialIds: formData.materialIds, // Добавляем массив ID материалов
  };

  try {
    // Создаем поток через API
    await streamApi.create(createRequest);

    $q.notify({
      type: 'positive',
      message: tI18n('stream_form.stream_created_successfully'),
    });

    // Очищаем данные формы и переходим обратно
    streamStore.clearStreamFormData();
    void router.push({
      name: 'streams',
      query: productionUnitId.value ? { productionUnitId: productionUnitId.value } : {},
    });
  } catch (error) {
    console.error('Failed to create stream:', error);
    $q.notify({
      type: 'negative',
      message: tI18n('stream_form.failed_to_create_stream'),
    });
  }
}

function handleSubmit(data: { name: string; materialIds: string[] }): void {
  // Сохраняем данные формы в store для использования при создании потока
  streamStore.setStreamFormData(data);
}

onMounted(() => {
  // Получаем productionUnitId из query параметров
  productionUnitId.value = (route.query.productionUnitId as string) || null;
});

onUnmounted(() => {
  // Очищаем данные формы при размонтировании компонента
  streamStore.clearStreamFormData();
});
</script>

<style scoped lang="scss">
.create-stream-page {
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
  }

  &__actions {
    position: absolute;
    bottom: 20px;
    right: 40px;
    display: flex;
    gap: 12px;
  }
}
</style>
