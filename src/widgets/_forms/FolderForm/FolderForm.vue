<template>
  <div class="folder-form">
    <div v-if="!isEditMode && parentNode" class="folder-form__parent">
      <span class="text-caption text-grey-7">Родительский узел:</span>
      <div class="folder-form__parent-info">
        <q-icon :name="parentNode.icon || 'folder'" size="sm" color="grey-7" />
        <span>{{ parentNode.label }}</span>
      </div>
    </div>

    <q-form ref="formRef" class="folder-form__form" @submit.prevent="submit">
      <q-select
        v-if="!isEditMode && typeOptions.length > 1"
        v-model="selectedType"
        :options="typeOptions"
        label="Тип узла"
        outlined
        dense
        emit-value
        map-options
        class="q-mb-sm"
      />

      <q-input
        v-model="folderName"
        :label="nameLabel"
        outlined
        dense
        autofocus
        :rules="nameRules"
        @keyup.enter="submit"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QForm } from 'quasar';
import type { CreateFolderPayload, ParentNodeInfo, UpdateFolderPayload } from './types';
import type { ProductionUnitTreeNode } from 'src/entities';
import { ProductionUnitTypeLabels, ProductionUnitIcons, ProductionUnitType } from 'src/entities';

interface Props {
  parentNode?: ParentNodeInfo | null;
  active?: boolean;
  mode?: 'create' | 'edit';
  selectedNode: ProductionUnitTreeNode | null;
  allowedTypes?: string[];
}

interface Emits {
  (e: 'create', payload: CreateFolderPayload): void;
  (e: 'updated', selectedNode: UpdateFolderPayload): void;
}

const props = withDefaults(defineProps<Props>(), {
  parentNode: null,
  active: true,
  mode: 'create',
  selectedNode: null,
  allowedTypes: () => [ProductionUnitType.FOLDER],
});

const emit = defineEmits<Emits>();

const formRef = ref<QForm>();
const folderName = ref('');
const selectedType = ref<string>(ProductionUnitType.FOLDER);
const isSubmitting = ref(false);
const isEditMode = computed(() => props.mode === 'edit');

const typeOptions = computed(() =>
  props.allowedTypes.map((t) => ({
    value: t,
    label: ProductionUnitTypeLabels[t as ProductionUnitType] ?? t,
    icon: ProductionUnitIcons[t as ProductionUnitType] ?? 'circle',
  }))
);

const nameLabel = computed(() => {
  if (isEditMode.value) return 'Название';
  const label = ProductionUnitTypeLabels[selectedType.value as ProductionUnitType];
  return label ? `Название (${label.toLowerCase()})` : 'Название';
});

const nameRules = [
  (val: string) => !!val?.trim() || 'Введите название',
  (val: string) => val.trim().length >= 2 || 'Минимум 2 символа',
];

const canSubmit = computed(() => !!folderName.value.trim());

/** В режиме создания — есть ли хотя бы один допустимый тип дочернего узла */
const canCreateNode = computed(() =>
  isEditMode.value ? true : props.allowedTypes.length > 0,
);

function reset(): void {
  folderName.value = '';
  selectedType.value = props.allowedTypes[0] ?? ProductionUnitType.FOLDER;
  formRef.value?.resetValidation();
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  const name = folderName.value.trim();
  if (!name) return;

  isSubmitting.value = true;
  try {
    if (isEditMode.value) {
      emit('updated', { name });
      return;
    }
    emit('create', {
      name,
      parentId: props.parentNode?.id ?? null,
      type: selectedType.value,
    });
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.active,
  (active) => {
    if (!active) return;
    reset();
  }
);

watch(
  () => props.allowedTypes,
  (types) => {
    if (types.length > 0 && !types.includes(selectedType.value)) {
      selectedType.value = types[0] || ProductionUnitType.FOLDER;
    }
  },
  { immediate: true }
);

watch(
  () => [props.mode, props.selectedNode] as const,
  ([mode, node]) => {
    if (mode === 'edit' && node) {
      folderName.value = node.label;
    }
  },
  { immediate: true }
);

defineExpose({
  submit,
  reset,
  isSubmitting,
  canSubmit,
  canCreateNode,
});
</script>

<style scoped lang="scss">
.folder-form__parent {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.folder-form__parent-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-weight: 500;
  color: #424242;
}
</style>
