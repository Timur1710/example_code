<template>
  <q-dialog v-model="dialogVisible" persistent @before-hide="handleClose">
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <ProductionUnitSelectionTemplate
          v-bind="getTemplateProps()"
          @select="handleSelect"
          @confirm="handleConfirm"
          @cancel="handleCancel"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ProductionUnitSelectionTemplate from './ProductionUnitSelectionTemplate.vue';

interface Props {
  modelValue: boolean;
  entityKey: string;
  title?: string;
  isActive?: boolean;
  emptyText?: string;
  noResultsText?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', groupId: string, groupName: string): void;
  (e: 'select', groupId: string, groupName: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: true,
  loading: false,
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(props.modelValue);

// Создаем объект с опциональными props
const getTemplateProps = () => {
  const baseProps: {
    entityKey: string;
    isActive: boolean;
    loading: boolean;
    emptyText?: string;
    noResultsText?: string;
  } = {
    entityKey: props.entityKey,
    isActive: props.isActive,
    loading: props.loading,
  };

  if (props.emptyText) {
    baseProps.emptyText = props.emptyText;
  }

  if (props.noResultsText) {
    baseProps.noResultsText = props.noResultsText;
  }

  return baseProps;
};

// Синхронизация с v-model
watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal;
  }
);

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

const handleSelect = (groupId: string, groupName: string) => {
  emit('select', groupId, groupName);
};

const handleConfirm = (groupId: string, groupName: string) => {
  emit('confirm', groupId, groupName);
  dialogVisible.value = false;
};

const handleCancel = () => {
  dialogVisible.value = false;
};

const handleClose = () => {
  emit('update:modelValue', false);
};
</script>
