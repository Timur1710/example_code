<template>
  <div class="bom-tab">
    <!-- Состояние загрузки -->
    <div v-if="isLoading" class="q-pa-md text-center">
      <q-spinner-dots size="40px" color="primary" />
      <div class="text-grey-6 q-mt-sm">Загрузка материалов потока...</div>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="q-pa-md text-center text-negative">
      <q-icon name="error" size="40px" />
      <div class="q-mt-sm">{{ error }}</div>
      <q-btn
        class="q-mt-md"
        color="primary"
        label="Повторить"
        icon="refresh"
        @click="loadBom"
      />
    </div>

    <!-- Состояние: материалы не найдены -->
    <div v-else-if="!isLoading && !bomTree" class="q-pa-md text-center text-grey-6">
      <q-icon name="inventory_2" size="40px" />
      <div class="text-caption q-mt-xs">
        Материал не имеет потока
      </div>
    </div>

    <!-- Дерево материалов -->
    <div v-else-if="bomTree" class="bom-tree-container q-pa-sm">
      <q-tree
        :nodes="treeNodes"
        node-key="_id"
        label-key="label"
        v-model:expanded="expanded"
        default-expand-all
        no-transition
      >
        <template v-slot:default-header="prop">
          <div
            class="row items-center bom-tree-node q-ma-none"
            @contextmenu.prevent="(e) => onContextMenu(e, prop.node)"
          >
          <q-card >  
          <q-chip size="sm" class="q-ma-none q-pa-md" :color="getNodeColor(prop.node)" square>
              <q-avatar> 
                <img src="/img/admin-menu/black_icons/materials.svg" alt="Материал" />
              </q-avatar>
              <div class="col">
                <div class="text-weight-medium material_label line-height-1">
                  <span class="name">{{ prop.node.label.length > 20 ? prop.node.label.slice(0, 17) + '...' : prop.node.label }}</span> 
                  <span :class="prop.node.quantity_consumed ? 'quantity_consumed' : 'quantity_returned'">{{ formatQuantity(prop.node.quantity_consumed || prop.node.quantity_returned) }} {{ getMeasureTranslation(prop.node.measure) }}</span>
                </div>
                <div class="text-caption text-grey">
                  <span v-if="prop.node.totalQuantity !== undefined" class="q-ml-sm">
                    Количество: {{ formatQuantity(prop.node.totalQuantity) }}
                  </span>
                  <span v-if="prop.node.batchCount" class="q-ml-sm">
                    Партий: {{ prop.node.batchCount }}
                  </span>
                </div>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-badge
                  v-if="prop.node.alternative && prop.node.alternative.length > 0"
                  color="blue-grey-5"
                  :label="`${prop.node.alternative.length} альт.`"
                />
              </div>
            </q-chip>
            </q-card>
          </div>
        </template>
      </q-tree>

      <!-- Контекстное меню -->
      <q-menu
        v-model="showContextMenu"
        :touch-position="true"
        :context-menu="true"
        @hide="contextMenuNode = null"
      >
        <q-list style="min-width: 200px">
          <q-item
            clickable
            v-close-popup
            @click="goToMaterial"
          >
            <q-item-section avatar>
              <q-icon name="inventory_2" />
            </q-item-section>
            <q-item-section>Перейти к материалу</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { materialApi, type MaterialListItem } from 'src/entities/material';
import type { MaterialTreeNode } from 'src/entities/material/model/material.types';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  material: MaterialListItem;
  isActive?: boolean;
}>();

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();

// Reactive data
const bomTree = ref<MaterialTreeNode | null>(null);
const expanded = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showContextMenu = ref(false);
const contextMenuNode = ref<MaterialTreeNode | null>(null);

/**
 * Computed свойство для безопасной передачи дерева в q-tree
 * Возвращает массив с корневым узлом, если дерево загружено
 */
const treeNodes = computed(() => {
  if (!bomTree.value) {
    return [] as MaterialTreeNode[];
  }
  return [bomTree.value] as MaterialTreeNode[];
});

/**
 * Рекурсивно собрать все ID узлов дерева для развёртывания
 */
const collectNodeIds = (node: MaterialTreeNode): string[] => {
  const ids = [node._id];
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      ids.push(...collectNodeIds(child));
    });
  }
  return ids;
};

/**
 * Загрузить иерархическое BOM дерево материалов по потоку
 * 
 *  API возвращает единичный корневой узел (объект),
 *  Корень - текущий материал, дети - материалы из потока.
 */
const loadBom = async () => {
  if (!props.material?._id) {
    error.value = 'ID материала не указан';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const data = await materialApi.getBomByStream(props.material._id);

    // Если у корневого узла нет дочерних элементов, не устанавливаем bomTree
    // чтобы отобразился блок "Материал не имеет потока"
    if (data && (!data.children || data.children.length === 0)) {
      bomTree.value = null;
    } else {
      bomTree.value = data;

      // Автоматически развернуть все узлы рекурсивно
      if (data) {
        expanded.value = collectNodeIds(data);
      }
    }
  } catch (err: unknown) {
    console.error('Ошибка при загрузке BOM:', err);

    const httpError = err as { response?: { status?: number } };
    if (httpError.response?.status === 404) {
      error.value = 'Материал не найден';
    } else if (httpError.response?.status === 403) {
      error.value = 'Недостаточно прав для просмотра материалов';
    } else {
      error.value = 'Ошибка при загрузке материалов потока';
    }

    $q.notify({
      type: 'negative',
      message: error.value,
    });
  } finally {
    isLoading.value = false;
  }
};

/**
 * Получить цвет узла в зависимости от его состояния
 */
const getNodeColor = (node: MaterialTreeNode): string => {
  if (node.totalQuantity === 0) return 'negative';
  if (node.totalQuantity && node.totalQuantity < 100) return 'warning';
  return 'white';
};

/**
 * Форматировать количество
 */
const formatQuantity = (quantity: number): string => {
  return new Intl.NumberFormat('ru-RU').format(quantity);
};

/**
 * Получить перевод единицы измерения
 */
const getMeasureTranslation = (measure?: string): string => {
  if (!measure) return '';
  return t(`measurement_units.${measure}`) || measure;
};

/**
 * Показать контекстное меню при правом клике на узел
 */
const onContextMenu = (event: MouseEvent, node: MaterialTreeNode): void => {
  event.preventDefault();
  contextMenuNode.value = node;
  showContextMenu.value = true;
};

/**
 * Перейти к материалу
 */
const goToMaterial = (): void => {
  if (contextMenuNode.value?._id) {
    void router.push({ name: 'material-details', params: { id: contextMenuNode.value._id } });
  }
  showContextMenu.value = false;
  contextMenuNode.value = null;
};

/**
 * Загрузить данные при переключении на таб
 */
watch(
  () => props.isActive,
  (isActive) => {
    if (isActive && props.material?._id) {
      void loadBom();
    }
  },
  { immediate: true }
);

/**
 * Обновить данные при изменении материала
 */
watch(
  () => props.material?._id,
  (newMaterialId, oldMaterialId) => {
    if (newMaterialId && newMaterialId !== oldMaterialId && props.isActive) {
      void loadBom();
    }
  }
);

/**
 * Загрузить данные при монтировании, если таб уже активен
 */
onMounted(() => {
  if (props.isActive && props.material?._id) {
    void loadBom();
  }
});
</script>

<style scoped lang="scss">
.bom-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.line-height-1{
  line-height: 1;
}
.bom-tree-container {
  flex: 1;
  overflow: auto;
  // padding: 5px;
}
div.material_label > .name {
  display: block;
}
div.material_label {
  > .quantity_consumed,
  > .quantity_returned {
    font-size: 9px;
  }

  > .quantity_consumed {
    color: brown;
  }

  > .quantity_returned {
    color: green;
  }
}
.bom-tree-node {
  width: 150px;
  border-radius: 4px;
  transition: background-color 0.2s;

  .q-card {
    width: 100%;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

.q-avatar {
  width: 15px;
  margin-left: -0.25em;
  border-radius: 0;
}
:deep(.q-focus-helper){
  display: none;
}  
:deep(.q-tree__arrow) {
  position: relative;
  left: 140px;
  z-index: 1000;
  width: 0px;
  padding: 0;
  margin: 0;
  color: #9e9e9e;
}

:deep(.q-tree__node) {
  padding: 0;
}

:deep(.q-tree__node-header) {
  padding: 0;
  left: -7px;
  &::before {
    width: 5px;
    left: -6px;
  }
}

:deep(.q-tree__children) {
  margin-left: 160px;
  padding: 0;
  margin-top: -16px;

  &::before {
    content: "";
    position: relative;
    z-index: 999;
    left: -17px;
    top: 0;
    border-bottom: 1px solid currentColor;
    display: block;
    width: 5px;
  }
}

:deep(.q-tree__node--selected) {
  background-color: rgba(25, 118, 210, 0.1);
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
}
</style>
