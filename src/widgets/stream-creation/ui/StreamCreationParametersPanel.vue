<template>
  <div class="stream-creation-parameters-panel">
    <div class="q-pa-md">
      <div class="text-h6 q-mb-md">Параметры потока</div>

      <!-- Форма создания/редактирования потока -->
      <StreamForm ref="formRef" :production-unit-id="productionUnitId" :stream-id="streamId" :mode="mode" :active="true"
        :show-actions="false" :initial-data="initialData" :on-close="handleClose" @submit="handleSubmit" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamStore } from 'src/entities/stream';
import { StreamForm } from 'src/widgets/_forms';
import type { MaterialListItem } from 'src/entities/material';

interface Props {
  productionUnitId: string | null;
  /** ID потока (для режима редактирования) */
  streamId?: string | null;
  /** Режим работы формы */
  mode?: 'create' | 'edit';
  onClose?: () => void;
}

interface Emits {
  (e: 'submit', data: { name: string; materialIds: string[] }): void;
}

const props = withDefaults(defineProps<Props>(), {
  streamId: null,
  mode: 'create',
  onClose: () => { },
});

const emit = defineEmits<Emits>();

const streamStore = useStreamStore();
const { streamFormData, selectedStream } = storeToRefs(streamStore);
const formRef = ref<InstanceType<typeof StreamForm>>();
const isFormInitialized = ref(false);

const initialData = computed(() => {
  // В режиме редактирования используем данные выбранного потока
  if (props.mode === 'edit' && selectedStream.value) {
    // Извлекаем IDs материалов из массива materials
    const materialIds = selectedStream.value.materials?.map(m => m._id) || [];
    // Преобразуем StreamMaterial[] в MaterialListItem[]
    const materials: MaterialListItem[] = (selectedStream.value.materials || []).map(m => {
      const material: MaterialListItem = {
        _id: m._id,
        name: m.name,
        p_id: m.p_id || '',
        type: 'raw_material', // Значение по умолчанию, так как в StreamMaterial нет type
      };
      if (m.measure !== undefined) {
        material.measure = m.measure;
      }
      if (m.totalQuantity !== undefined) {
        material.totalQuantity = m.totalQuantity;
      }
      if (m.batchCount !== undefined) {
        material.batchCount = m.batchCount;
      }
      if (m.value !== undefined && m.value !== null) {
        const materialValue = m.value as MaterialListItem['value'];
        if (materialValue !== undefined) {
          material.value = materialValue;
        }
      }
      return material;
    });
    return {
      name: selectedStream.value.name || '',
      materialIds,
      materials,
    };
  }

  // В режиме создания используем данные из формы
  return {
    name: streamFormData.value.name || '',
    materialIds: streamFormData.value.materialIds || [],
  };
});

// Синхронизировать данные формы при первом получении потока в режиме редактирования
watch(
  () => selectedStream.value,
  (stream) => {
    if (props.mode !== 'edit' || !stream) {
      return;
    }

    // Инициализируем форму только один раз, чтобы последующие изменения
    // (например, при переключении табов) не затирали несохранённые правки.
    if (!isFormInitialized.value) {
      const materialIds = stream.materials?.map(m => m._id) || [];
      streamStore.setStreamFormData({
        name: stream.name || '',
        materialIds,
      });
      if (formRef.value) {
        void formRef.value.reset();
      }
      isFormInitialized.value = true;
    }
  },
  { immediate: true, deep: true }
);

function handleClose(): void {
  props.onClose();
}

function handleSubmit(data: { name: string; materialIds: string[] }): void {
  emit('submit', data);
}

defineExpose({
  formRef,
});
</script>

<style lang="scss" scoped>
.stream-creation-parameters-panel {
  height: 100%;
  background: #fff;
}
</style>
