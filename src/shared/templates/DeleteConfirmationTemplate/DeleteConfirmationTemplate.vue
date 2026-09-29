<template>
  <q-dialog ref="dialogRef" :persistent="persistent" @hide="onDialogHide">
    <q-card class="q-dialog-plugin delete-confirmation">
      <q-card-section class="row items-center no-wrap q-gutter-sm">
        <q-icon name="warning" color="negative" size="24px" />
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section>
        {{ message }}
      </q-card-section>

      <q-card-actions class="delete-confirmation__actions">
        <q-btn flat color="grey-8" :label="cancelLabel" @click="onDialogCancel" />
        <q-btn unelevated color="negative" :label="confirmLabel" @click="onConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    persistent?: boolean;
  }>(),
  {
    title: 'Подтверждение удаления',
    message: 'Вы уверены, что хотите удалить этот элемент?',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    persistent: true,
  }
);

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onConfirm() {
  onDialogOK();
}
</script>

<style scoped lang="scss">
.delete-confirmation {
  min-width: 360px;
  max-width: 420px;
}

.delete-confirmation__actions {
  display: flex;
  justify-content: space-between;
}
</style>