<template>
  <div class="scripts-tab">
    <div class="scripts-tab__header">
      <q-tabs
        v-model="activeTab"
        class="scripts-tab__tabs"
        active-color="black"
        indicator-color="black"
        align="left"
        dense
      >
        <q-tab name="operation" label="Операция" no-caps />
        <q-tab name="order" label="Заказ" no-caps />
      </q-tabs>
    </div>

    <q-separator />

    <div class="scripts-tab__content">
      <q-tab-panels v-model="activeTab" animated transition-prev="fade" transition-next="fade">
        <q-tab-panel name="operation" class="scripts-tab__panel">
          <div class="scripts-tab__editor-wrapper">
            <div class="scripts-tab__editor-label">
              <q-icon name="code" size="20px" class="q-mr-sm" />
              Скрипт уровня операции
            </div>
            <Codemirror
              v-model:value="operationScript"
              :options="editorOptions"
              border
              :height="'100%'"
              class="scripts-tab__editor"
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="order" class="scripts-tab__panel">
          <div class="scripts-tab__editor-wrapper">
            <div class="scripts-tab__editor-label">
              <q-icon name="description" size="20px" class="q-mr-sm" />
              Скрипт уровня заказа
            </div>
            <Codemirror
              v-model:value="orderScript"
              :options="editorOptions"
              border
              :height="'100%'"
              class="scripts-tab__editor"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <div class="scripts-tab__footer">
      <q-btn
        color="primary"
        label="Сохранить"
        :loading="isSaving"
        :disable="isSaving"
        @click="handleSave"
        unelevated
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import Codemirror from 'codemirror-editor-vue3';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/lib/codemirror.css';
import {
  useOperationStore,
  type OperationInfoDto,
  type OperationScriptsDto,
} from 'src/entities/operation';

const props = defineProps<{
  operation: OperationInfoDto;
}>();

const $q = useQuasar();
const operationStore = useOperationStore();

const activeTab = ref<'operation' | 'order'>('operation');
const isSaving = ref(false);

// Реактивные значения для скриптов
const operationScript = ref('');
const orderScript = ref('');

// Инициализация значений из props
const initializeScripts = () => {
  operationScript.value = props.operation.scripts?.operation_level?.script || '';
  orderScript.value = props.operation.scripts?.order_level?.script || '';
};

// Инициализация при монтировании
initializeScripts();

// Отслеживание изменений операции
watch(
  () => props.operation.scripts,
  () => {
    initializeScripts();
  },
  { deep: true }
);

// Настройки редактора CodeMirror
const editorOptions = {
  mode: 'text/javascript',
  theme: 'default',
  lineNumbers: true,
  smartIndent: true,
  indentUnit: 2,
  lineWrapping: true,
  viewportMargin: Infinity,
  extraKeys: { 'Ctrl-Space': 'autocomplete' },
};

// Обработка сохранения
const handleSave = async () => {
  if (!props.operation._id) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка: ID операции не найден',
      position: 'top',
    });
    return;
  }

  isSaving.value = true;

  try {
    const scripts: OperationScriptsDto = {
      operation_level: {
        script: operationScript.value,
      },
      order_level: {
        script: orderScript.value,
      },
    };

    await operationStore.updateOperation({
      _id: props.operation._id,
      scripts,
    });

    $q.notify({
      type: 'positive',
      message: 'Скрипты успешно сохранены',
      position: 'top',
    });
  } catch (error) {
    console.error('Ошибка сохранения скриптов:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка сохранения скриптов',
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
.scripts-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  &__header {
    padding: 0;
  }

  &__tabs {
    background: white;
    color: black;

    :deep(.q-tab) {
      min-height: 44px;
      padding: 0 20px;
      font-weight: 500;
      font-size: 13px;
      text-transform: none;
    }

    :deep(.q-tab--active) {
      background: #fff;
      color: #000;
      border-radius: 4px;
    }

    :deep(.q-tabs__content) {
      padding: 8px 16px;
      gap: 16px;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  &__panel {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__editor-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
  }

  &__editor-label {
    font-size: 16px;
    font-weight: 600;
    color: #1f1f1f;
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
  }

  &__editor {
    border-radius: 4px;
    overflow: hidden;
    min-height: 300px;

    :deep(.CodeMirror) {
      height: 100%;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  &__footer {
    padding: 16px 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    background: white;
  }
}

:deep(.q-tab-panels) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
