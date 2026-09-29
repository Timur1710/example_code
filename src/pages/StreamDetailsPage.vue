<template>
<DetailsPageTemplate 
:title="streamTitle"
:subtitle="'Поток'"
:detailsError="detailsError"
:item="stream"
:isDetailsLoading="isDetailsLoading"
:fetchItemById="(id) => streamStore.fetchStreamById(id)"
:clearSelectedItem="() => streamStore.clearSelectedStream()"
>
  <template #details-card>
      <StreamTabs ref="streamTabsRef" :production-unit-id="productionUnitId" :stream-id="streamId ?? null"
        :is-new="false" :mode="'edit'" :additional-nav-items="additionalNavItems"
        @parameters-submit="handleParametersSubmit">
        <template #tabs>
          <q-tab-panel name="resources" class="stream-tabs__panel">
            <keep-alive>
              <StreamResources :stream-id="streamId ?? null" />
            </keep-alive>
          </q-tab-panel>
        </template>
      </StreamTabs>
    <!-- Кнопки действий -->
    <div class="stream-details-page__actions">
      <!-- <q-btn flat label="Отмена" color="grey-7" @click="handleCancel" /> -->
      <q-btn label="Сохранить" color="primary" @click="handleSave" />
    </div>
 </template>
</DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref} from 'vue';
import { useRoute} from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useStreamStore,
  type StreamOperationDto,
  type StreamRelationDto,
} from 'src/entities/stream';
import { StreamTabs, type AdditionalStreamNavItem } from 'src/widgets/stream-creation';
import { StreamResources } from 'src/widgets/stream-resources';
import { DetailsPageTemplate } from 'src/shared/templates/DetailsPageTemplate';

defineOptions({
  name: 'StreamDetailsPage',
});

const route = useRoute();
const $q = useQuasar();
const streamStore = useStreamStore();

const { selectedStream, streamFormData, isStreamDetailsLoading, streamDetailsError } = storeToRefs(streamStore);

const streamTabsRef = ref<{
  switchToParametersTab: () => void;
  parametersPanelRef: {
    formRef: {
      validate?: () => Promise<boolean>;
    } | null;
  } | null;
}>();

const streamId = computed(() => route.params.id as string | undefined);
const stream = computed(() => selectedStream.value);
const streamTitle = computed(() => stream.value?.name || 'Загрузка...');
const productionUnitId = computed(() => stream.value?.p_id || null);
const isDetailsLoading = computed(() => isStreamDetailsLoading.value);
const detailsError = computed(() => streamDetailsError.value);
// Дополнительные элементы навигации для таба "Ресурсы"
const additionalNavItems = computed<AdditionalStreamNavItem[]>(() => [
  {
    value: 'resources',
    label: 'Ресурсы',
    icon: 'inventory_2',
  },
]);


onBeforeUnmount(() => {
  streamStore.clearStreamFormData();
});

async function loadStream(id: string): Promise<void> {
  try {
    await streamStore.fetchStreamById(id);
  } catch (e) {
    console.error('Failed to load stream', e);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить поток',
    });
  }
}

function handleParametersSubmit(data: { name: string; materialIds: string[] }): void {
  // Сохраняем данные формы в store для использования при обновлении потока
  streamStore.setStreamFormData(data);
}

async function handleSave(): Promise<void> {
  if (!streamId.value) {
    $q.notify({
      type: 'negative',
      message: 'ID потока не найден',
    });
    return;
  }

  // Проверяем наличие обязательных данных
  const formData = streamFormData.value;
  if (!formData.name || !formData.name.trim()) {
    streamTabsRef.value?.switchToParametersTab();
    $q.notify({
      type: 'negative',
      message: 'Введите название потока',
    });
    return;
  }

  // Валидируем форму
  const form = streamTabsRef.value?.parametersPanelRef?.formRef;
  if (form) {
    const formValidation = (form as unknown as { validate: () => Promise<boolean> }).validate?.();
    if (formValidation instanceof Promise) {
      const isValid = await formValidation;
      if (!isValid) {
        streamTabsRef.value?.switchToParametersTab();
        $q.notify({
          type: 'negative',
          message: 'Проверьте правильность заполнения формы',
        });
        return;
      }
    }
  }

  try {
    // Получаем операции из конструктора через метод store
    type StoreWithConstructor = typeof streamStore & {
      getConstructorState: (productionUnitId: string | null) => StreamOperationDto[] | null;
    };
    const storeWithConstructor = streamStore as StoreWithConstructor;
    const savedOperations = storeWithConstructor.getConstructorState(productionUnitId.value);

    // Базовый payload для обновления потока
    const payload: {
      _id: string;
      name: string;
      materialIds: string[];
      operation?: StreamOperationDto[];
    } = {
      _id: streamId.value,
      name: formData.name.trim(),
      materialIds: formData.materialIds, // Добавляем массив ID материалов
    };

    // Если пользователь менял операции в конструкторе, подготавливаем и добавляем их в payload.
    // Если savedOperations === null, поле operation вообще не отправляем, чтобы не затирать операции на бэке пустым массивом.
    if (savedOperations && savedOperations.length) {
      const operations: StreamOperationDto[] =
        JSON.parse(JSON.stringify(savedOperations)) as StreamOperationDto[];

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

      payload.operation = operations;
    }

    // Обновляем поток
    await streamStore.updateStream(payload);

    $q.notify({
      type: 'positive',
      message: 'Поток успешно обновлен',
    });

    // Перезагружаем данные потока
    await loadStream(streamId.value);
  } catch (error) {
    console.error('Failed to update stream:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить поток',
    });
  }
}
/*
function handleCancel(): void {
  // Сбрасываем изменения и перезагружаем данные
  streamStore.clearStreamFormData();
  if (streamId.value) {
    void loadStream(streamId.value);
    // Явно сбрасываем форму параметров, чтобы она отразила свежие данные потока
    const form = parametersPanelRef.value?.formRef as unknown as { reset?: () => void } | null;
    form?.reset?.();
  }
}*/
</script>
<style scoped lang="scss">
.stream-details-page {
  &__actions {
    position: absolute;
    bottom: 20px;
    right: 40px;
    display: flex;
    gap: 12px;
  }
}
</style>

