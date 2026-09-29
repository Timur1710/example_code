<template>
  <q-expansion-item
    v-if="hasContent"
    dense
    dense-toggle
    expand-separator
    class="additional-info-expansion"
  >
    <template #header>
      <q-item-section>
        {{ t('order_plan.additional_info') }}
      </q-item-section>
    </template>

    <div class="additional-info-expansion__content">
      <q-tabs
        v-model="activeTab"
        class="additional-info-expansion__tabs"
        dense
        align="left"
      >
        <q-tab name="info" :label="t('order_plan.info_title')" no-caps />
        <q-tab name="warnings" :label="t('order_plan.warnings_title')" no-caps />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="activeTab"
        animated
        transition-prev="fade"
        transition-next="fade"
        class="additional-info-expansion__panels"
      >
        <q-tab-panel name="info" class="additional-info-expansion__panel">
          <ul class="q-ma-none q-pl-md">
            <li v-for="(msg, idx) in infoMessages" :key="idx">
              {{ msg }}
            </li>
          </ul>
        </q-tab-panel>

        <q-tab-panel name="warnings" class="additional-info-expansion__panel">
          <ul class="q-ma-none q-pl-md">
            <li v-for="(warning, idx) in warnings" :key="idx">
              {{ warning }}
            </li>
          </ul>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  infoMessages: string[];
  warnings: string[];
}

const props = defineProps<Props>();

const { t } = useI18n();

const hasContent = computed(
  () =>
    (props.infoMessages?.length ?? 0) > 0 || (props.warnings?.length ?? 0) > 0
);

const activeTab = ref<'info' | 'warnings'>('info');
</script>

<style scoped lang="scss">
.additional-info-expansion {
  &__content {
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    margin-left: 10px;
    flex-direction: column;
  }

  &__tabs {
    flex-shrink: 0;
  }

  &__panels {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  &__panel {
    padding: 12px 0;
  }
}
</style>
