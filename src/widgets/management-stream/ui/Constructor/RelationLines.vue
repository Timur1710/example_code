<template>
  <div class="constructor-relations-wrapper">
    <svg class="constructor-relations">
      <RelationLine
        v-for="(relation, index) in relations"
        :key="relation._id || index"
        :relation="relation"
        :edit="edit"
        @click="handleRelationClick"
        @contextmenu="handleRelationContextMenu"
      />
    </svg>
    
    <!-- Невидимый элемент для позиционирования меню -->
    <div
      ref="menuTargetRef"
      class="menu-target"
      :style="menuTargetStyle"
    />
    
    <!-- Контекстное меню -->
    <q-menu
      v-model="showContextMenu"
      :target="menuTarget"
      anchor="top left"
      self="top left"
      touch-position
      no-parent-event
    >
      <q-list dense style="min-width: 150px">
        <q-item
          v-if="selectedRelation"
          clickable
          v-close-popup
          @click="handleDelete"
        >
          <q-item-section avatar>
            <q-icon name="delete" color="negative" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Удалить</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, nextTick } from 'vue';
import type { CSSProperties } from 'vue';
import type { DrawnRelation } from '../../lib/constructor';

const RelationLine = defineAsyncComponent(() => import('./RelationLine.vue'));

interface Props {
  relations: DrawnRelation[];
  edit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  edit: true,
});

const emit = defineEmits<{
  relationClick: [relation: DrawnRelation, event: MouseEvent];
  relationDelete: [relation: DrawnRelation];
}>();

const showContextMenu = ref(false);
const selectedRelation = ref<DrawnRelation | null>(null);
const menuTargetRef = ref<HTMLElement | null>(null);
const menuPosition = ref({ x: 0, y: 0 });

// Вычисляемый target для меню (не может быть null)
const menuTarget = computed(() => {
  return menuTargetRef.value ?? false;
});

// Вычисляемые стили для невидимого элемента-цели меню
const menuTargetStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${menuPosition.value.x}px`,
  top: `${menuPosition.value.y}px`,
  width: '1px',
  height: '1px',
  pointerEvents: 'none' as CSSProperties['pointerEvents'],
  zIndex: -1,
}));

function handleRelationClick(relation: DrawnRelation, event: MouseEvent) {
  emit('relationClick', relation, event);
}

function handleRelationContextMenu(relation: DrawnRelation, event: MouseEvent) {
  if (!props.edit) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  // Сохраняем связь
  selectedRelation.value = relation;
  
  // Устанавливаем позицию меню в месте клика
  menuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  };
  
  // Открываем меню после обновления позиции
  void nextTick(() => {
    showContextMenu.value = true;
  });
}

function handleDelete() {
  if (selectedRelation.value) {
    emit('relationDelete', selectedRelation.value);
    selectedRelation.value = null;
  }
  showContextMenu.value = false;
}
</script>

<style lang="scss" scoped>
.constructor-relations-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.constructor-relations {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  :deep(path) {
    pointer-events: stroke;
  }
}

.menu-target {
  position: fixed;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
  z-index: -1;
}
</style>
