<template>
  <div class="flow-tab">
    <div v-if="isStreamLoading" class="q-pa-md text-center">
      <q-spinner-dots size="40px" color="primary" />
      <div class="text-grey-6 q-mt-sm">Загрузка данных потока...</div>
    </div>

    <div v-else-if="streamError" class="q-pa-md text-center text-negative">
      <q-icon name="error" size="40px" />
      <div class="q-mt-sm">{{ streamError }}</div>
    </div>

    <div v-else-if="!materialStream" class="q-pa-md text-center text-grey-6">
      <q-icon name="info" size="40px" />
      <div v-if="props.material.type !== 'raw_material'" class="q-mt-sm">
        Данные потока не найдены
      </div>
      <div v-else class="q-mt-sm text-negative">
        Тип данного материала не поддерживает потоки.<br />
        Изменить тип на
        <q-badge
          :label="t('material_modal.semi_finished_product')"
          class="pointer_badge"
          @click="changeMaterialType('semi_finished_product')"
        />
        или
        <q-badge
          class="pointer_badge"
          :label="t('material_modal.finished_product')"
          @click="changeMaterialType('finished_product')"
        />
      </div>
      <div
        class="q-mt-md"
        style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap"
      >
        <q-btn
          :disable="props.material.type === 'raw_material'"
          color="primary"
          label="Добавить новый поток"
          icon="add"
          @click="groupDialogVisible = true"
        />
        <q-btn
          :disable="props.material.type === 'raw_material'"
          color="primary"
          outline
          label="Выбрать существующий поток"
          icon="search"
          @click="openStreamDialog('select')"
        />
      </div>
      <!-- Диалог выбора группы потока -->
      <ProductionUnitSelectionDialog
        v-model="groupDialogVisible"
        entity-key="streams"
        :title="t('select_stream_group')"
        @confirm="handleGroupConfirm"
      />
    </div>

    <div v-else class="flow-content">
      <!-- Информация о потоке -->
      <div class="flow-header">
        <div class="flow-header-title">
          <h6 class="flow-header-name-title">
            {{ materialStream.name || 'Без названия' }}
          </h6>
          <span v-if="materialStream.productionUnit" class="q-mr-md">
            <q-icon name="factory" class="q-mr-xs" />
            Производственная единица: {{ materialStream.productionUnit.name }}
          </span>
          <div v-if="materialStream._id" class="flow-controls">
            <h6 class="flow-controls-title">Управление потоком</h6>
            <div class="flow-controls-buttons">
              <q-btn
                flat
                dense
                color="primary"
                icon="open_in_new"
                label="Перейти к потоку"
                @click="goToStream(materialStream._id)"
              />
              <q-btn
                flat
                dense
                color="primary"
                icon="swap_horiz"
                label="Заменить поток"
                @click="openStreamDialog('replace')"
              />
              <q-btn
                flat
                dense
                color="negative"
                icon="link_off"
                label="Отвязать поток"
                @click="handleUnbindStream"
              />
            </div>
          </div>
        </div>
        <div class="flow-meta text-caption text-grey-7"></div>
        <div v-if="materialStream.description" class="text-body2 q-mt-sm">
          {{ materialStream.description }}
        </div>
      </div>

      <!-- Операции потока -->
      <div class="flow-operations">
        <h6 class="text-weight-bold non-margin">Операции потока</h6>
        <div v-if="groupedOperations.length > 0" class="operations-list">
          <div
            v-for="(group, groupIndex) in groupedOperations"
            :key="`group-${groupIndex}`"
            class="operation-group"
          >
            <div
              :class="
                'q-mb-sm ' +
                (group.length > 1 ? 'multi-operation q-pa-sm bg-gray' : 'operation-group-row')
              "
              :style="{ gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }"
            >
              <div v-if="group.length > 1" class="operation-number q-mr-sm q-mb-sm">
                <q-badge :label="groupIndex" color="primary" />
                <span class="text-weight-medium q-ml-sm">Параллельные операции</span>
              </div>
              <div
                v-for="(operation, index) in group"
                :key="operation._id || `${groupIndex}-${index}`"
                class="operation-item q-pa-sm"
                :class="{
                  'operation-item--clickable': operation.type === 'operation' && operation.o_id,
                  'q-mb-sm': group.length === 1,
                  'q-mb-xs': group.length > 1 && index !== group.length - 1,
                }"
                @click="
                  operation.type === 'operation' && operation.o_id && goToOperation(operation.o_id)
                "
              >
                <div class="operation-header">
                  <div v-if="group.length === 1" class="operation-number q-mr-sm">
                    <q-badge :label="groupIndex" color="primary" />
                  </div>
                  <div class="operation-info flex-1">
                    <div class="text-weight-medium text-secondary">
                      <span class="vertical-middle">
                        {{
                          operation.isStart
                            ? 'Начало потока'
                            : operation.isEnd
                              ? 'Конец потока'
                              : operation.name || `Операция ${index + 1}`
                        }}
                      </span>
                    </div>
                    <div v-if="operation.description" class="text-caption text-grey-7 q-mt-xs">
                      {{ operation.description }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="
                    operation.duration ||
                    operation.workers ||
                    operation.workerCount ||
                    operation.worker_count
                  "
                  class="operation-details q-mt-sm"
                >
                  <div v-if="operation.duration" class="detail-item">
                    <q-icon name="schedule" class="q-mr-xs" />
                    Длительность: {{ operation.duration }} мин
                  </div>
                  <div
                    v-if="operation.workers || operation.workerCount || operation.worker_count"
                    class="detail-item"
                  >
                    <q-icon name="people" class="q-mr-xs" />
                    Работников:
                    {{ operation.workers || operation.workerCount || operation.worker_count }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-grey-6 q-pa-md">
          <q-icon name="build" size="40px" />
          <div class="q-mt-sm">Операции не найдены</div>
        </div>
      </div>
    </div>

    <!-- Диалог выбора/замены потока -->
    <q-dialog v-model="showStreamDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div v-if="isUpdatingMaterial" class="q-pa-md text-center">
            <q-spinner-dots size="40px" color="primary" />
            <div class="text-grey-6 q-mt-sm">Обновление материала...</div>
          </div>
          <SingleSelectionTemplate
            v-else
            :items="streamItems"
            :selected-item="selectedStreamId"
            :pagination="streamPagination"
            :loading="isLoadingStreams"
            :search-loading="isSearchingStreams"
            :search-error="streamSearchError"
            search-placeholder="Поиск потока..."
            select-button-text="Выбрать"
            :title="streamDialogTitle"
            @search="handleStreamSearch"
            @pagination="handleStreamPagination"
            @select="handleStreamSelect"
            @reset="handleStreamReset"
            @confirm="handleStreamConfirm"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Отмена"
            color="primary"
            :disable="isUpdatingMaterial"
            @click="cancelStreamSelection"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useMaterialStore, materialApi } from 'src/entities/material';
import type { MaterialListItem } from 'src/entities/material';
import { useStreamStore, streamApi, type StreamListItem } from 'src/entities/stream';
import { SingleSelectionTemplate, ProductionUnitSelectionDialog } from 'src/shared/templates';
import type {
  SelectionItem,
  PaginationParams,
} from 'src/shared/templates/AlternativesSelectionTemplate/model/types';
import { type MaterialType } from 'src/entities/material';
// Получаем материал из пропсов
const props = defineProps<{
  material: MaterialListItem;
}>();

const materialStore = useMaterialStore();
const router = useRouter();
const streamStore = useStreamStore();
const $q = useQuasar();
const { t } = useI18n();
// Реактивные данные из store (используем storeToRefs для сохранения реактивности)
const { materialStream, isStreamLoading, streamError } = storeToRefs(materialStore);
const { fetchMaterialStream, updateMaterial, clearMaterialStream } = materialStore;

// Состояние для диалога выбора/замены потока
const showStreamDialog = ref(false);
const groupDialogVisible = ref(false);
const streamDialogMode = ref<'replace' | 'select'>('select');
const streamItems = ref<SelectionItem[]>([]);
const selectedStreamId = ref<string | null>(null);
const isLoadingStreams = ref(false);
const isSearchingStreams = ref(false);
const isUpdatingMaterial = ref(false);
const streamSearchError = ref<string | null>(null);
const streamPagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  pagesNumber: 0,
  sortBy: 'createdAt',
  descending: true,
});
const handleGroupConfirm = (groupId: string) => {
  groupDialogVisible.value = false;
  goToCreateStream(groupId);
};
const streamDialogTitle = computed(() => {
  return streamDialogMode.value === 'replace' ? 'Выберите поток для замены' : 'Выберите поток';
});

type StreamOperation = NonNullable<
  NonNullable<NonNullable<(typeof materialStream)['value']>['operation']>
>[number];
type FlowOperation = StreamOperation & { isStart?: boolean; isEnd?: boolean };

const groupedOperations = computed<FlowOperation[][]>(() => {
  const operations = materialStream.value?.operation || [];
  if (!Array.isArray(operations) || operations.length === 0) {
    return [];
  }

  const startIndex = operations.findIndex((op) => op?.status === 'active' && op?.type === 'order');
  const endIndex = operations.findIndex((op) => op?.status === 'complete' && op?.type === 'order');

  let startOp: ((typeof operations)[number] & { isStart?: boolean }) | null = null;
  let endOp: ((typeof operations)[number] & { isEnd?: boolean }) | null = null;

  const middle: StreamOperation[] = [];

  operations.forEach((op, index) => {
    if (index === startIndex && op) {
      startOp = { ...op, isStart: true };
      return;
    }

    if (index === endIndex && op) {
      endOp = { ...op, isEnd: true };
      return;
    }

    middle.push(op);
  });

  console.log('Middle operations before sorting:', middle);
  // Сортируем по position[0]
  const sorted = middle.slice().sort((a, b) => {
    const aPos =
      Array.isArray(a.position) && a.position.length > 0 && typeof a.position[0] === 'number'
        ? a.position[0]
        : 0;
    const bPos =
      Array.isArray(b.position) && b.position.length > 0 && typeof b.position[0] === 'number'
        ? b.position[0]
        : 0;
    return aPos - bPos;
  });

  const getPositionValue = (operation: (typeof sorted)[number] | undefined): number => {
    if (
      !operation ||
      !Array.isArray(operation.position) ||
      operation.position.length === 0 ||
      typeof operation.position[0] !== 'number'
    ) {
      return 0;
    }

    return operation.position[0];
  };

  // Группируем по position[0]
  const grouped: FlowOperation[][] = [];
  if (startOp) {
    grouped.push([startOp]);
  }
  for (let i = 0; i < sorted.length; ) {
    const current = sorted[i];
    if (!current) break;
    const currentPos = getPositionValue(current);
    const group = [current];
    let j = i + 1;
    while (j < sorted.length) {
      const nextOperation = sorted[j];
      if (!nextOperation || getPositionValue(nextOperation) !== currentPos) {
        break;
      }

      group.push(nextOperation);
      j++;
    }
    grouped.push(group);
    i = j;
  }

  if (endOp) {
    grouped.push([endOp]);
  }

  return grouped;
});
const changeMaterialType = async (newType: string) => {
  try {
    await updateMaterial({
      _id: props.material._id,
      type: newType as MaterialType,
    });

    $q.notify({
      type: 'positive',
      message: 'Тип материала успешно изменен',
      position: 'top',
    });

    // Перезагружаем данные потока для материала после изменения типа
    await loadStreamData();
  } catch (error) {
    console.error('Failed to change material type:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при изменении типа материала',
      position: 'top',
    });
  }
};

/**
 * Загрузка данных потока для материала
 */
async function loadStreamData(): Promise<void> {
  if (!props.material?._id) {
    return;
  }

  // Проверяем, не загружаются ли уже данные для этого материала
  if (isStreamLoading.value) {
    return;
  }

  try {
    console.log('Загрузка потока для материала:', props.material._id);
    await fetchMaterialStream(props.material._id);
    console.log('Данные потока загружены:', materialStream.value);
  } catch (error) {
    console.error('Ошибка загрузки потока:', error);
  }
}

// Загрузка данных потока при монтировании компонента
onMounted(async () => {
  // Используем nextTick для загрузки данных после полного монтирования и отрисовки
  await nextTick();
  void loadStreamData();
});

// Отслеживание изменения материала для перезагрузки данных
watch(
  () => props.material._id,
  (newMaterialId, oldMaterialId) => {
    // Загружаем данные только если ID материала изменился
    if (newMaterialId && newMaterialId !== oldMaterialId) {
      void loadStreamData();
    }
  },
  { immediate: false }
);

function goToStream(streamId: string): void {
  void router.push({ name: 'stream-details', params: { id: streamId } });
}

function goToOperation(operationId: string): void {
  void router.push({ name: 'operation-details', params: { id: operationId } });
}

/**
 * Переход на страницу создания потока с предзаполненными данными
 */
function goToCreateStream(p_id: string): void {
  const material = props.material;

  // Заполняем форму создания потока в store
  streamStore.setStreamFormData({
    name: `Создание ${material.name}`,
    materialIds: [material._id],
  });

  // Переходим на страницу создания потока, передавая производственную единицу
  void router.push({
    name: 'create-stream',
    query: p_id ? { productionUnitId: p_id } : {},
  });
}

// === Stream Replacement Methods ===

/**
 * Загрузить список потоков
 */
async function loadStreams(params?: Partial<PaginationParams>): Promise<void> {
  isLoadingStreams.value = true;
  streamSearchError.value = null;

  try {
    const response = await streamApi.getAll({
      page: params?.page || streamPagination.value.page,
      rowsPerPage: params?.rowsPerPage || streamPagination.value.rowsPerPage,
      sortBy: params?.sortBy || streamPagination.value.sortBy,
      descending: params?.descending ?? streamPagination.value.descending,
      search: params?.search || '',
    });

    streamItems.value = response.data.map((stream: StreamListItem) => ({
      _id: stream._id,
      name: stream.name,
      description: stream.description || '',
    }));

    streamPagination.value = {
      ...streamPagination.value,
      ...response.pagination,
    };
  } catch (error) {
    streamSearchError.value = 'Ошибка загрузки потоков';
    console.error('Failed to load streams:', error);
  } finally {
    isLoadingStreams.value = false;
  }
}

/**
 * Обработка поиска потоков
 */
async function handleStreamSearch(query: string): Promise<void> {
  isSearchingStreams.value = true;
  await loadStreams({ search: query, page: 1 });
  isSearchingStreams.value = false;
}

/**
 * Обработка пагинации потоков
 */
async function handleStreamPagination(params: Omit<PaginationParams, 'filter'>): Promise<void> {
  await loadStreams(params);
}

/**
 * Обработка выбора потока
 */
function handleStreamSelect(item: SelectionItem): void {
  selectedStreamId.value = item._id;
}

/**
 * Сброс выбора потока
 */
function handleStreamReset(): void {
  selectedStreamId.value = null;
}

/**
 * Открытие диалога выбора/замены потока
 */
function openStreamDialog(mode: 'replace' | 'select'): void {
  streamDialogMode.value = mode;
  showStreamDialog.value = true;
}

/**
 * Подтверждение выбора потока и обновление материала
 */
async function handleStreamConfirm(streamId: string | null): Promise<void> {
  if (!streamId) {
    showStreamDialog.value = false;
    return;
  }

  isUpdatingMaterial.value = true;

  try {
    await materialApi.update({
      _id: props.material._id,
      s_id: streamId,
    });

    $q.notify({
      type: 'positive',
      message:
        streamDialogMode.value === 'replace' ? 'Поток успешно заменен' : 'Поток успешно выбран',
      position: 'top',
    });

    // Перезагружаем данные потока для материала
    await loadStreamData();

    // Закрываем диалог и сбрасываем состояние
    showStreamDialog.value = false;
    selectedStreamId.value = null;
  } catch (error) {
    console.error('Failed to update material stream:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при обновлении потока',
      position: 'top',
    });
  } finally {
    isUpdatingMaterial.value = false;
  }
}

/**
 * Отмена выбора потока
 */
function cancelStreamSelection(): void {
  showStreamDialog.value = false;
  selectedStreamId.value = null;
}

/**
 * Отвязать поток от материала
 */
function handleUnbindStream(): void {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите отвязать поток от материала?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      isUpdatingMaterial.value = true;

      try {
        // Передаем null для удаления связи с потоком
        await updateMaterial({
          _id: props.material._id,
          s_id: null as unknown as string,
        });

        $q.notify({
          type: 'positive',
          message: 'Поток успешно отвязан',
          position: 'top',
        });

        // Очищаем данные потока и перезагружаем
        clearMaterialStream();
        await loadStreamData();
      } catch (error) {
        console.error('Failed to unbind stream:', error);
        $q.notify({
          type: 'negative',
          message: 'Ошибка при отвязке потока',
          position: 'top',
        });
      } finally {
        isUpdatingMaterial.value = false;
      }
    })();
  });
}

// Загружаем потоки при открытии диалога
watch(showStreamDialog, (isOpen) => {
  if (isOpen) {
    selectedStreamId.value =
      streamDialogMode.value === 'replace' ? materialStream.value?._id || null : null;
    void loadStreams();
  }
});
</script>

<style scoped lang="scss">
.pointer_badge {
  cursor: pointer;
  background-color: var(--gray);
  color: black;
  font-weight: 400;
  &:hover {
    background-color: var(--secondary);
    color: white;
  }
}
.flow-tab {
  height: 100%;
  overflow-y: auto;
  padding: 0;

  .flow-content {
    padding: 16px;
  }

  .flow-header {
    .flow-header-title {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-direction: column;
      gap: 16px;
      flex-wrap: wrap;
    }
    .flow-header-name-title {
      margin: 0;
      flex: 1;
    }

    .flow-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 200px;

      .flow-controls-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #666;
      }

      .flow-controls-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .q-btn {
          justify-content: flex-start;
        }
      }
    }

    .flow-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;

      span {
        display: flex;
        align-items: center;
      }
    }
  }

  .flow-operations {
    .operations-list {
      .multi-operation {
        border-radius: 5px;
        margin-bottom: 8px;
      }
      .operation-group-row {
        display: grid;
        gap: 12px;

        .operation-item {
          margin-bottom: 0;
          height: 100%;
        }
      }

      .operation-item {
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        background: #fafafa;
        transition: all 0.2s ease;

        &.operation-item--clickable {
          cursor: pointer;
        }

        &:hover {
          border-color: #1976d2;
          background: #f5f9ff;
        }

        .operation-header {
          display: flex;
          align-items: flex-start;

          .operation-number {
            flex-shrink: 0;
          }

          .operation-info {
            .text-weight-medium {
              font-size: 12px;
            }
          }
        }

        .operation-details {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .detail-item {
            display: flex;
            align-items: center;
            font-size: 10px;
            color: var(--strong-gray);

            .q-icon {
              font-size: 13px;
              color: var(--strong-gray);
            }
          }
        }
      }
    }
  }

  .flow-materials {
    .q-list {
      border-radius: 8px;

      .q-item {
        padding: 12px 16px;

        .q-item-label {
          font-size: 14px;
          color: #333;
        }

        .q-item-label[caption] {
          margin-top: 4px;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }

  .flow-comment {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #1976d2;
  }
}

// Адаптивность
@media (max-width: 768px) {
  .flow-tab {
    .flow-header {
      .flow-header-title {
        flex-direction: column;
        align-items: stretch;
      }

      .flow-controls {
        min-width: auto;
        width: 100%;
      }
    }

    .flow-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .operation-details {
      flex-direction: column;
      gap: 8px;
    }

    .flow-operations .operations-list .operation-group-row {
      grid-template-columns: 1fr !important;
    }

    .flow-materials .q-item {
      flex-direction: column;
      align-items: flex-start;

      .q-item-label[caption] {
        margin-top: 8px;
      }
    }
  }
}
</style>
