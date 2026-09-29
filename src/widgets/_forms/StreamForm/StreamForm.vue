<template>
  <q-form ref="formRef" class="stream-form" @submit.prevent="submit">
    <!-- Поле имени потока -->
    <q-input
      v-model="formData.name"
      outlined
      dense
      :label="t('stream_form.stream_name')"
      autofocus
      :rules="nameRules"
      :disable="isFormBusy"
      hide-bottom-space
      @keyup.enter="submit"
    />

    <!-- Выбор типа потока -->
    <div class="stream-form__radio-group">
      <div class="stream-form__radio-label">{{ t('stream_form.material_type') }}</div>
      <q-option-group
        v-model="formData.hasMaterials"
        :options="materialTypeOptions"
        color="primary"
        type="radio"
        :disable="isFormBusy"
      />
    </div>

    <!-- Секция выбора материалов -->
    <div v-if="formData.hasMaterials" class="stream-form__materials-section">
      <div class="stream-form__materials-header">
        <div class="text-subtitle1">Применяется для следующих материалов:</div>
        <q-btn
          :label="t('stream_form.add_material')"
          :icon="'add'"
          color="primary"
          size="sm"
          @click="openMaterialsDialog"
        />
      </div>

      <!-- Список выбранных материалов -->
      <div v-if="selectedMaterials.length > 0" class="stream-form__materials-list">
        <q-chip
          v-for="material in selectedMaterials"
          :key="material._id"
          :label="material.name"
          color="blue-grey-1"
          text-color="black"
          removable
          @remove="removeMaterial(material._id)"
        >
          <q-tooltip>{{ material.description || material.name }}</q-tooltip>
        </q-chip>
      </div>
      <div v-else class="stream-form__no-materials">
        {{ t('stream_form.no_materials_selected') }}
      </div>
    </div>

    <!-- Кнопки действий -->
    <div v-if="showActions" class="stream-form__actions">
      <q-btn
        :label="t('cancel')"
        flat
        color="grey"
        @click="() => props.onClose?.()"
        class="custom-btn"
      />
      <q-btn
        :label="submitLabel"
        color="primary"
        :disable="isSubmitDisabled"
        :loading="isSubmitting"
        @click="submit"
        class="custom-btn"
      />
    </div>
  </q-form>

  <!-- Диалог выбора материалов -->
  <q-dialog v-model="materialsDialogVisible" persistent>
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section>
        <div class="text-h6">{{ t('stream_form.select_materials') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <ResourceSelectionTemplate
          resource-type="material"
          :items="materialsItems"
          :selected-items="selectedMaterialIds"
          :pagination="materialsPagination"
          :loading="materialsLoading"
          @search="handleMaterialsSearch"
          @pagination="handleMaterialsPagination"
          @toggle="handleMaterialToggle"
          @select-all="handleMaterialsSelectAll"
          @confirm="handleMaterialsConfirm"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn :label="t('close')" color="grey" flat @click="closeMaterialsDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { QForm, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ResourceSelectionTemplate } from 'src/shared/templates';
import { useMaterialStore } from 'src/entities/material';
import type { MaterialListItem } from 'src/entities/material';
import type {
  SelectionItem,
  PaginationParams,
} from 'src/shared/templates/AlternativesSelectionTemplate/model/types';
import { useStreamStore } from 'src/entities/stream';

interface Props {
  productionUnitId: string | null;
  mode?: 'create' | 'edit';
  /** Активность формы (для сброса при открытии диалога) */
  active?: boolean;
  /** Показывать ли кнопки действий */
  showActions?: boolean;
  /** Функция закрытия диалога */
  onClose?: () => void;
  /** Начальные данные для заполнения формы */
  initialData?: { name: string; materialIds: string[]; materials?: MaterialListItem[] } | null;
}

interface Emits {
  (e: 'submit', data: { name: string; materialIds: string[] }): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  active: true,
  showActions: true,
  onClose: () => {},
  initialData: null,
});

const emit = defineEmits<Emits>();

const $q = useQuasar();
const { t } = useI18n();
const materialStore = useMaterialStore();
const streamStore = useStreamStore();

const formRef = ref<QForm>();
const isSubmitting = ref(false);

// Состояние формы
const formData = reactive({
  name: '',
  hasMaterials: false,
});

// Выбранные материалы
const selectedMaterials = ref<MaterialListItem[]>([]);

// Диалог материалов
const materialsDialogVisible = ref(false);
const materialsItems = ref<SelectionItem[]>([]);
const selectedMaterialIds = ref<string[]>([]);
const materialsLoading = ref(false);
const materialsPagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  pagesNumber: 1,
});

// Правила валидации
const nameRules = [
  (val: string) => !!val?.trim() || t('stream_form.enter_name'),
  (val: string) => val.trim().length >= 2 || t('stream_form.minimum_of_2_characters'),
];

const hasFilledFields = computed(() => Boolean(formData.name.trim()));

// Опции для q-radio
const materialTypeOptions = computed(() => [
  { label: t('stream_form.with_materials'), value: true },
  { label: t('stream_form.without_materials'), value: false },
]);

// Вычисляемые свойства
const isEditMode = computed(() => props.mode === 'edit');
const isFormBusy = computed(() => isSubmitting.value);
const submitLabel = computed(() => (isEditMode.value ? t('save') : t('create')));

const isSubmitDisabled = computed(() => {
  if (!formData.name.trim() || isFormBusy.value) {
    return true;
  }
  return !props.productionUnitId;
});

// Методы
function syncStreamFormData(): void {
  streamStore.setStreamFormData({
    name: formData.name || '',
    materialIds: selectedMaterials.value.map((m) => m._id),
  });
}

function reset(): void {
  if (props.initialData) {
    // Заполняем форму начальными данными
    formData.name = props.initialData.name || '';
    formData.hasMaterials = props.initialData.materialIds.length > 0;
    selectedMaterials.value = [];
    selectedMaterialIds.value = [...props.initialData.materialIds];
    // Используем материалы из initialData, если они переданы, иначе ищем в store
    if (props.initialData.materialIds.length > 0) {
      if (props.initialData.materials && props.initialData.materials.length > 0) {
        // Используем переданные материалы
        selectedMaterials.value = props.initialData.materials;
      } else {
        // Ищем материалы в store
        const materials = materialStore.materials.filter((material) =>
          props.initialData!.materialIds.includes(material._id)
        );
        selectedMaterials.value = materials;
      }
    }
  } else {
    // Очищаем форму
    formData.name = '';
    formData.hasMaterials = false;
    selectedMaterials.value = [];
    selectedMaterialIds.value = [];
  }
  formRef.value?.resetValidation();
  syncStreamFormData();
}

function openMaterialsDialog(): void {
  materialsDialogVisible.value = true;
  selectedMaterialIds.value = selectedMaterials.value.map((m) => m._id);
  void loadMaterials();
}

function closeMaterialsDialog(): void {
  materialsDialogVisible.value = false;
  selectedMaterialIds.value = [];
}

async function loadMaterials(params: Partial<PaginationParams> = {}): Promise<void> {
  materialsLoading.value = true;
  try {
    const response = await materialStore.fetchAll({
      page: materialsPagination.value.page,
      rowsPerPage: materialsPagination.value.rowsPerPage,
      ...params,
    });

    materialsItems.value = response.data.map((material) => {
      const result: { _id: string; name: string; description?: string } = {
        _id: material._id,
        name: material.name,
      };
      if (material.description) {
        result.description = material.description;
      }
      return result;
    });

    materialsPagination.value = {
      ...materialsPagination.value,
      ...response.pagination,
    };
  } catch (error) {
    console.error('Failed to load materials:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить материалы',
    });
  } finally {
    materialsLoading.value = false;
  }
}

function handleMaterialsSearch(query: string): void {
  void loadMaterials({ search: query, page: 1 });
}

function handleMaterialsPagination(params: Omit<PaginationParams, 'filter'>): void {
  materialsPagination.value = {
    ...materialsPagination.value,
    ...params,
  };
  void loadMaterials(params);
}

function handleMaterialToggle(item: SelectionItem): void {
  const index = selectedMaterialIds.value.indexOf(item._id);
  if (index > -1) {
    selectedMaterialIds.value.splice(index, 1);
  } else {
    selectedMaterialIds.value.push(item._id);
  }
}

function handleMaterialsSelectAll(selected: boolean): void {
  if (selected) {
    const currentPageIds = materialsItems.value.map((item) => item._id);
    selectedMaterialIds.value = [...new Set([...selectedMaterialIds.value, ...currentPageIds])];
  } else {
    const currentPageIds = new Set(materialsItems.value.map((item) => item._id));
    selectedMaterialIds.value = selectedMaterialIds.value.filter((id) => !currentPageIds.has(id));
  }
}

function handleMaterialsConfirm(selectedIds: string[]): void {
  selectedMaterialIds.value = selectedIds;
  // Обновляем список выбранных материалов
  const allMaterials = materialStore.materials;
  selectedMaterials.value = allMaterials.filter((material) => selectedIds.includes(material._id));
  closeMaterialsDialog();
  syncStreamFormData();
}

function removeMaterial(materialId: string): void {
  selectedMaterials.value = selectedMaterials.value.filter((m) => m._id !== materialId);
  syncStreamFormData();
}

async function submit(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    const materialIds = selectedMaterials.value.map((m) => m._id);
    streamStore.setStreamFormData({
      name: formData.name.trim(),
      materialIds,
    });
    emit('submit', {
      name: formData.name.trim(),
      materialIds,
    });
  } catch (error) {
    console.error('Failed to submit form:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось сохранить поток',
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Watchers
watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      reset();
    }
  }
);

watch(
  () => props.productionUnitId,
  () => {
    if (formData.hasMaterials) {
      // Если выбран режим с материалами, загружаем материалы
      void loadMaterials();
    }
  }
);

watch(
  () => formData.hasMaterials,
  (hasMaterials) => {
    if (hasMaterials) {
      // Если переключаемся на режим с материалами, загружаем материалы
      void loadMaterials();
    } else if (!hasMaterials) {
      // Если переключаемся на режим без материалов, очищаем выбранные материалы
      selectedMaterials.value = [];
      syncStreamFormData();
    }
  }
);

watch(
  () => formData.name,
  () => {
    syncStreamFormData();
  }
);

onMounted(() => {
  if (props.active) {
    reset();
    // Если форма активна и выбран режим с материалами, загружаем материалы
    if (formData.hasMaterials) {
      void loadMaterials();
    }
  }
});

defineExpose({
  submit,
  reset,
  isSubmitting,
  isSubmitDisabled,
  hasFilledFields,
});
</script>

<style scoped lang="scss">
.stream-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stream-form__radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stream-form__radio-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.stream-form__materials-section {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 16px;
  background-color: #fafafa;
}

.stream-form__materials-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stream-form__materials-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.stream-form__no-materials {
  color: rgba(0, 0, 0, 0.54);
  font-style: italic;
  margin-top: 8px;
}

.stream-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.custom-btn {
  text-transform: none !important;
  width: 100px;
}
</style>
