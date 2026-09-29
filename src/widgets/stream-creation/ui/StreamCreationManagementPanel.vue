<template>
  <div class="stream-creation-management-panel">
    <ManagementStream v-if="productionUnitId" v-bind="managementStreamProps" @save="handleSave" @revert="handleRevert"
      @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ManagementStream } from 'src/widgets/management-stream';
import type { StreamType } from 'src/entities/stream';

interface StreamCreationManagementPanelProps {
  /** ID производственной единицы */
  productionUnitId: string | null;
  /** ID потока (для режима редактирования) */
  streamId?: string | null;
  /** Режим создания (true) или редактирования (false) */
  isNew?: boolean;
  /** Тип потока */
  streamType?: StreamType;
}

const props = withDefaults(defineProps<StreamCreationManagementPanelProps>(), {
  streamId: null,
  isNew: true,
  streamType: 'stream',
});

const managementStreamProps = computed(() => {
  const result: {
    productionUnitId: string;
    streamId?: string;
    isNew: boolean;
    streamType: StreamType;
  } = {
    productionUnitId: props.productionUnitId as string,
    isNew: props.isNew,
    streamType: props.streamType,
  };

  if (props.streamId) {
    result.streamId = props.streamId;
  }

  return result;
});

const emit = defineEmits<{
  save: [];
  revert: [];
  export: [];
}>();

function handleSave(): void {
  emit('save');
}

function handleRevert(): void {
  emit('revert');
}

function handleExport(): void {
  emit('export');
}
</script>

<style lang="scss" scoped>
.stream-creation-management-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>