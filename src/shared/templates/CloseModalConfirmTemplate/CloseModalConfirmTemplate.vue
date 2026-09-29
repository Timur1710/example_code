<template>
  <q-dialog ref="dialogRef" :persistent="props.persistent" @hide="onDialogHide">
    <q-card class="q-dialog-plugin close-modal-confirmation">
      <q-card-section class="row items-center no-wrap q-gutter-sm">
        <q-icon :name="props.titleIcon" :color="props.titleIconColor" size="24px" />
        <div class="text-h6">{{ props.title }}</div>
      </q-card-section>

      <q-card-section>
        {{ props.message }}
      </q-card-section>

      <q-card-actions class="close-modal-confirmation__actions">
        <q-btn
          :flat="props.cancelFlat"
          :color="props.cancelColor"
          :label="props.cancelLabel"
          @click="onDialogCancel"
        />
        <q-btn
          :color="props.okColor"
          :label="props.okLabel"
          unelevated
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

defineOptions({
  name: 'CloseModalConfirmTemplate',
});

const props = withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    cancelLabel?: string;
    okLabel?: string;
    okColor?: string;
    cancelColor?: string;
    titleIcon?: string;
    titleIconColor?: string;
    cancelFlat?: boolean;
    persistent?: boolean;
  }>(),
  {
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите закрыть диалоговое окно?',
    cancelLabel: 'Отмена',
    okLabel: 'Закрыть',
    okColor: 'warning',
    cancelColor: 'grey-8',
    titleIcon: 'warning',
    titleIconColor: 'warning',
    cancelFlat: true,
    persistent: true,
  }
);

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onOKClick(): void {
  onDialogOK();
}
</script>

<style scoped lang="scss">
.close-modal-confirmation {
  min-width: 360px;
  max-width: 420px;
}

.close-modal-confirmation__actions {
  display: flex;
  justify-content: space-between;
}
</style>
