import type { QVueGlobals } from 'quasar';
import { CloseModalConfirmTemplate } from 'src/shared/templates';

type UpdateModelValueEmit = (e: 'update:modelValue', value: boolean) => void;

interface CloseDialogWithWarningsParams {
  force?: boolean;
  hasFilledFields: boolean;
  emit: UpdateModelValueEmit;
  $q: QVueGlobals;
}

export function closeDialogWithWarnings({
  force = false,
  hasFilledFields,
  emit,
  $q,
}: CloseDialogWithWarningsParams): Promise<void> | void {
  const shouldConfirm = force !== true && hasFilledFields;

  if (!shouldConfirm) {
    emit('update:modelValue', false);
    return;
  }

  return new Promise((resolve) => {
    $q.dialog({
      component: CloseModalConfirmTemplate,
    })
      .onOk(() => {
        emit('update:modelValue', false);
        resolve();
      })
      .onCancel(() => resolve());
  });
}