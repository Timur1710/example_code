<template>
  <q-card class="stream-details-page__card q-px-none">
  <div class="stream-tabs">
    <StreamCreationNavigation v-model="activeTab" :items="navItems" />
    <q-tab-panels v-model="activeTab" animated class="stream-tabs__panels">
      <!-- Стандартные табы -->
      <q-tab-panel name="management" class="stream-tabs__panel">
        <keep-alive>
          <StreamCreationManagementPanel
            :production-unit-id="productionUnitId"
            :stream-id="streamId"
            :is-new="isNew"
            :stream-type="streamType"
            @save="handleManagementSave"
            @revert="handleManagementRevert"
            @export="handleManagementExport"
          />
        </keep-alive>
      </q-tab-panel>

      <q-tab-panel name="parameters" class="stream-tabs__panel">
        <keep-alive>
          <StreamCreationParametersPanel
            ref="parametersPanelRef"
            :production-unit-id="productionUnitId"
            :stream-id="streamId"
            :mode="mode"
            :on-close="onClose"
            @submit="handleParametersSubmit"
          />
        </keep-alive>
      </q-tab-panel>

      <!-- Дополнительные табы через слоты -->
      <slot
        name="tabs"
        :active-tab="activeTab"
        :switch-to-tab="switchToTab"
      />
    </q-tab-panels>
  </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { StreamType } from 'src/entities/stream';
import type { TabsNavMenuItem } from 'src/shared/ui';
import type { AdditionalStreamNavItem } from '../lib';
import {
  StreamCreationNavigation,
  StreamCreationManagementPanel,
  StreamCreationParametersPanel,
  STREAM_CREATION_NAV_ITEMS,
} from '..';

interface StreamTabsProps {
  /** ID производственной единицы */
  productionUnitId: string | null;
  /** ID потока (для режима редактирования) */
  streamId?: string | null;
  /** Режим создания (true) или редактирования (false) */
  isNew?: boolean;
  /** Режим работы формы параметров */
  mode?: 'create' | 'edit';
  /** Тип потока */
  streamType?: StreamType;
  /** Callback для закрытия (для режима создания) */
  onClose?: () => void;
  /** Дополнительные элементы навигации */
  additionalNavItems?: AdditionalStreamNavItem[];
}

interface StreamTabsEmits {
  /** Событие сохранения из management панели */
  managementSave: [];
  /** Событие отката из management панели */
  managementRevert: [];
  /** Событие экспорта из management панели */
  managementExport: [];
  /** Событие submit из parameters панели */
  parametersSubmit: [data: { name: string; materialIds: string[] }];
  /** Событие изменения активного таба */
  tabChange: [tab: string];
}

const props = withDefaults(defineProps<StreamTabsProps>(), {
  streamId: null,
  isNew: true,
  mode: 'create',
  streamType: 'stream',
  onClose: () => {},
  additionalNavItems: () => [],
});

const emit = defineEmits<StreamTabsEmits>();

const activeTab = ref<string>('management');
const parametersPanelRef = ref<{
  formRef: {
    validate?: () => Promise<boolean>;
  } | null;
}>();

// Объединяем стандартные и дополнительные элементы навигации
const navItems = computed<TabsNavMenuItem<string>[]>(() => [
  ...STREAM_CREATION_NAV_ITEMS,
  ...props.additionalNavItems,
]);

// Обработчики для management панели
function handleManagementSave() {
  emit('managementSave');
}

function handleManagementRevert() {
  emit('managementRevert');
}

function handleManagementExport() {
  emit('managementExport');
}

// Обработчик для parameters панели
function handleParametersSubmit(data: { name: string; materialIds: string[] }) {
  emit('parametersSubmit', data);
}

// Метод для программного переключения на указанный таб
function switchToTab(tabName: string) {
  activeTab.value = tabName;
  emit('tabChange', tabName);
}

// Метод для программного переключения на таб параметров
function switchToParametersTab() {
  switchToTab('parameters');
}

// Экспортируем методы для внешнего использования
defineExpose({
  switchToTab,
  switchToParametersTab,
  get parametersPanelRef() {
    return parametersPanelRef.value;
  },
  get activeTab() {
    return activeTab.value;
  },
});
</script>

<style scoped lang="scss">
.stream-tabs {
  width: 100%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 149px);
  &__panels {
    background: transparent;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__panel {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  // Стили для табов на всю ширину
  :deep(.tabs-nav-menu) {
    width: 100%;

    .q-tabs {
      width: 100%;

      &__content {
        justify-content: space-around;
      }
    }
  }
}
</style>
