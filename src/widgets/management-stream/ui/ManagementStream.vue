<template>
  <div class="management-stream">
    <!-- Заголовок -->
    <div class="management-stream__header">
      <div class="management-stream__title">
        {{ streamTitle }}
      </div>
      <div class="management-stream__actions">
        <q-btn
          v-if="isEditMode && !readonly"
          flat
          dense
          icon="file_download"
          color="primary"
          :disable="!hasStreamData"
          @click="handleExport"
        >
          <q-tooltip>{{ t('management_stream.export') }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="isEditMode && !readonly"
          flat
          dense
          icon="undo"
          color="primary"
          :disable="!isChanged"
          @click="handleRevert"
        >
          <q-tooltip>{{ t('management_stream.revert') }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Контент -->
    <div class="management-stream__content" ref="contentRef">
      <q-inner-loading :showing="state.isLoading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <template v-if="!state.isLoading && hasStreamData">
        <!-- Конструктор операций -->
        <div class="management-stream__constructor">
          <StreamConstructor
            v-if="state.stream?.operation"
            :cells="constructorCells"
            :names="operationNames"
            :edit="!readonly && isEditMode"
            :stream-type="streamType"
            @update="handleOperationsUpdate"
          />
          <div v-else class="management-stream__constructor-placeholder">
            <q-icon name="account_tree" size="64px" color="grey-5" />
            <div class="text-h6 text-grey-6 q-mt-md">
              {{ t('management_stream.constructor_placeholder') }}
            </div>
            <div class="text-body2 text-grey-5 q-mt-sm">
              {{ t('management_stream.constructor_description') }}
            </div>
          </div>
        </div>

        <!-- Комментарии -->
        <!-- <div class="management-stream__comments">
          <q-expansion-item
            icon="comment"
            :label="t('management_stream.comments')"
            header-class="text-primary"
            dense
          >
            <q-card flat>
              <q-card-section>
                <div v-if="state.stream?.comment.length === 0" class="text-grey-6 text-center">
                  {{ t('management_stream.no_comments') }}
                </div>
                <div v-else>
                  <div
                    v-for="(comment, index) in state.stream?.comment"
                    :key="index"
                    class="q-mb-sm"
                  >
                    <q-chat-message
                      :text="[comment.text]"
                      :stamp="comment.createdAt"
                      text-color="white"
                      bg-color="primary"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div> -->

        <!-- Статус потока -->
        <!-- <div v-if="isEditMode && state.stream?.status" class="management-stream__status">
          <q-select
            v-model="localStatus"
            :options="statusOptions"
            :label="t('management_stream.status')"
            dense
            outlined
            emit-value
            map-options
            class="management-stream__status-select"
            @update:model-value="handleStatusChange"
          />
        </div> -->
      </template>

      <!-- Ошибка -->
      <div v-if="state.error" class="management-stream__error">
        <q-banner class="bg-negative text-white" rounded>
          <template #avatar>
            <q-icon name="error" />
          </template>
          {{ state.error }}
        </q-banner>
      </div>
    </div>

    <!-- Кнопки действий -->
    <!-- <div v-if="isEditMode && !readonly && hasStreamData" class="management-stream__footer">
      <transition name="fade">
        <div v-if="state.saved" class="management-stream__saved">
          <q-icon name="check_circle" color="white" size="20px" class="q-mr-sm" />
          <span>{{ t('management_stream.saved') }}</span>
        </div>
      </transition>

      <q-btn
        :label="t('common.save')"
        color="primary"
        :disable="!isChanged || state.isSaving"
        :loading="state.isSaving"
        @click="handleSave"
      />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useManagementStream } from '../lib/useManagementStream';
import StreamConstructor from './StreamConstructor.vue';
import type { ManagementStreamProps } from '../lib';
import type { ConstructorOperation } from '../lib/constructor';
import { streamDtosToConstructor, constructorToStreamDtos } from '../lib/constructor';
import { useOperationStore } from 'src/entities/operation';
import { useStreamStore } from 'src/entities/stream';
import type { StreamOperationDto } from 'src/entities/stream';

const props = withDefaults(defineProps<ManagementStreamProps>(), {
  readonly: false,
  isNew: false,
  streamType: 'stream',
});

const emit = defineEmits<{
  save: [];
  revert: [];
  export: [];
}>();

const { t } = useI18n();
const operationStore = useOperationStore();
const streamStore = useStreamStore();

const {
  state,
  isChanged,
  isEditMode,
  hasStreamData,
  // saveStream,
  revertChanges,
  // changeStatus,
  exportStream,
} = useManagementStream(props as Readonly<ManagementStreamProps>);

const contentRef = ref<HTMLElement>();
const localStatus = ref(state.value.stream?.status || 'inactive');

// === Computed ===

const streamTitle = computed(() => {
  return state.value.stream?.name || t('management_stream.new_stream');
});

// const statusOptions = computed(() => [
//   { label: t('management_stream.status_active'), value: 'active' },
//   { label: t('management_stream.status_inactive'), value: 'inactive' },
//   { label: t('management_stream.status_draft'), value: 'draft' },
//   { label: t('management_stream.status_archived'), value: 'archived' },
// ]);

const operationNames = computed(() => {
  return {
    order: [
      { label: t('designer_items.start'), value: 'active' },
      { label: t('designer_items.finish'), value: 'complete' },
    ],
    operation: operationStore.operations.map((op) => ({
      label: op.name,
      value: op._id,
    })),
    template: [],
  };
});

// Computed property для ячеек конструктора
const constructorCells = computed(() => {
  if (!state.value.stream?.operation) return [];
  return streamDtosToConstructor(state.value.stream.operation);
});

// === Methods ===

// async function handleSave(): Promise<void> {
//   await saveStream();
//   emit('save');
// }

function handleRevert(): void {
  revertChanges();
  if (state.value.stream?.status) {
    localStatus.value = state.value.stream.status;
  }
  emit('revert');
}

function handleExport(): void {
  exportStream();
  emit('export');
}

// function handleStatusChange(status: string): void {
//   changeStatus(status);
// }

function handleOperationsUpdate(operations: ConstructorOperation[]): void {
  if (state.value.stream) {
    const streamDtos = constructorToStreamDtos(operations);
    state.value.stream.operation = streamDtos;
    // Сохраняем состояние конструктора в store для восстановления при переключении вкладок
    type StoreWithConstructor = typeof streamStore & {
      setConstructorState: (operations: StreamOperationDto[], productionUnitId: string) => void;
    };
    const storeWithConstructor = streamStore as StoreWithConstructor;
    storeWithConstructor.setConstructorState(streamDtos, props.productionUnitId);
  }
}

// === Watchers ===

watch(
  () => state.value.stream?.status,
  (newStatus) => {
    if (newStatus) {
      localStatus.value = newStatus;
    }
  }
);

// === Lifecycle ===

/**
 * Загрузить список операций для отображения имен
 */
async function loadOperationNames() {
  try {
    // Загружаем все операции для заполнения имен
    await operationStore.fetchAll({ rowsPerPage: 1000 });
  } catch (error) {
    console.error('Failed to load operation names:', error);
  }
}

onMounted(() => {
  void loadOperationNames();
});
</script>

<style lang="scss" scoped>
.management-stream {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__content {
    position: relative;
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  &__constructor {
    min-height: 400px;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    margin-bottom: 24px;
    background: #fafafa;
    overflow: hidden;
  }

  &__constructor-placeholder {
    text-align: center;
    padding: 40px;
  }

  &__comments {
    margin-bottom: 24px;
  }

  &__status {
    max-width: 300px;
  }

  &__status-select {
    background: #fff;
  }

  &__error {
    margin-bottom: 24px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
  }

  &__saved {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #21ba45;
    color: white;
    border-radius: 4px;
    font-size: 14px;
    animation: fadeIn 0.3s ease-in;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
