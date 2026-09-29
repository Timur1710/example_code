<template>
  <q-dialog v-show="show_dialog" ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center text-h6">
        <div class="text-h6">{{t('route_dialog.detailed_description')}}</div>
      </q-card-section>

      <q-card-section>
        {{t('route_dialog.go_to_card') +' '+props.item.name}}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="positive" :label="t('yes')" @click="onOKClick" />
        <q-btn color="negative" :label="t('no')" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useDialogPluginComponent } from 'quasar'
defineOptions({
  name: 'RouteDialogTemplate',
});
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  show_dialog: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: true
  }
})
const { t } = useI18n();
defineEmits([
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
function onOKClick () {
  onDialogOK()
}
</script>