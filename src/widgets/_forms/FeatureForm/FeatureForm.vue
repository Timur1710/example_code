<template>
  <div class="feature-form q-mr-md">
    <div class="feature-form__header">
      <div class="feature-form__title">
        {{ title }}
      </div>

      <q-btn
        v-if="!isEditing && rows.length"
        flat
        dense
        round
        icon="edit"
        color="primary"
        class="feature-form__edit-btn"
        @click="$emit('update:isEditing', true)"
      />

      <div class="feature-form__actions">
        <q-btn
          flat
          dense
          :label="t('save')"
          icon="check"
          color="black"
          class="feature-form__save-btn"
          :disable="!isFormValid && rows.length > 1"
          @click="saveButtonHandler"
        />
        <q-btn
          flat
          :label="t('cancel')"
          dense
          icon="close"
          color="negative"
          class="feature-form__cancel-btn"
          @click="$emit('cancel')"
        />
      </div>
    </div>

    <q-form ref="formRef" class="feature-form__body">
      <div class="feature-form__items" ref="formItems">
        <div
          v-for="(item, index) in rows"
          :key="item.id"
          class="feature-form__item"
        >
          <div class="feature-form__label">
            {{ t('characteristic') }} {{ index + 1 }} <span class="error-text">{{ !item.key ? t('fill_out_this_field') : '' }}</span>
          </div>

          <div class="feature-form__row">
            <q-input
              v-model="item.key"
              outlined
              dense
              :label="t('characteristic')"
              :disable="disabled"
              :rules="[(val: string) => !!val]"
              hide-bottom-space
            />

            <q-input
              v-model="item.value"
              outlined
              dense
              :label="t('item')"
              :disable="disabled"
            />

            <q-btn
              flat
              dense
              round
              icon="sym_o_delete"
              color="negative"
              class="feature-form__remove-btn"
              :disable="disabled"
              @click="removeRow(index)"
            />
          </div>
        </div>
      </div>

      <q-btn
        outline
        no-caps
        color="primary"
        class="feature-form__add-btn"
        icon="add"
        :label="addButtonLabel"
        :disable="disabled || !isFormValid"
        @click="addRow"
      />
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FeatureField } from 'src/shared/types';
import { QInput } from 'quasar';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue?: FeatureField[];
  disabled?: boolean;
  addButtonLabel?: string;
  title?: string;
  isEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false,
  addButtonLabel: 'Добавить характеристику',
  title: 'Дополнительная информация',
  isEditing: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FeatureField[]): void;
  (e: 'update:isEditing', value: boolean): void;
  (e: 'save'): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n()

type FeatureRow = FeatureField & { id: number };

const rows = ref<FeatureRow[]>([]);
let nextId = 0;

const formRef = ref<QInput>()
const formItems = ref<HTMLDivElement>()
const isFormValid = computed(() => {
  return rows.value.every(item => item.key.trim().length > 0);
});

function createRow(data?: FeatureField): FeatureRow {
  return {
    id: ++nextId,
    key: data?.key ?? '',
    value: data?.value ?? '',
  };
}

function syncFromModel(value?: FeatureField[]): void {
  if (value && value.length) {
    rows.value = value.map((item) => createRow(item));
    return;
  }

  rows.value = [createRow()];
}

watch(
  () => props.modelValue,
  (next) => syncFromModel(next),
  { deep: true, immediate: true },
);

async function saveButtonHandler(): Promise<void> {
  await emitModel()
  emit('save')
}

async function emitModel(): Promise<void> {
  if(rows.value.length > 1) {
    const isValid = await formRef.value?.validate()
    if(!isValid) return
  } else {
    if(!rows.value[0]?.key.trim()) {
      rows.value = []
    }
  }
  const payload = rows.value.map(({ key, value }) => ({ key, value }));
  emit('update:modelValue', payload);
}

async function addRow(): Promise<void> {
  if(!isFormValid.value) return
  rows.value.push(createRow());
  await emitModel();
  formItems.value?.scrollTo({top: formItems.value.scrollHeight, behavior: 'smooth'})
}

async function removeRow(index: number): Promise<void> {
  rows.value.splice(index, 1);
  await emitModel();
}
</script>

<style scoped lang="scss">
.feature-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.feature-form__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.feature-form__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // flex: 1;
  min-height: 0;
  overflow-y: auto; 
}

.feature-form__item {
  padding: 8px 12px;
  border-radius: 8px;
  background: #f7f7f7;
  border: 1px solid #e0e0e0;
}

.feature-form__label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.feature-form__row {
  display: grid;
  grid-template-columns: 1.1fr 1fr auto;
  column-gap: 12px;
  align-items: center;
}

.feature-form__remove-btn {
  justify-self: flex-start;
}

.feature-form__add-btn {
  align-self: flex-start;
  height: 36px;
  line-height: normal;
  flex-shrink: 0;
  margin-top: 12px;
}

.feature-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.feature-form__title {
  font-size: 18px;
  font-weight: 500;
  text-align: left;
}

.feature-form__actions {
  display: flex;
  gap: 8px;
}

.error-text {
  color: #c10015;
}
</style>

