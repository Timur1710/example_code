<template>
  <div class="list-toolbar">
    <q-input
      v-model="searchProxy"
      dense
      clearable
      filled
      debounce="100"
      :placeholder="searchPlaceholder"
      class="list-toolbar__search"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
    <!-- <FilterTableButton class="icon_bordered" @click="emit('filter_table')" :text="t('filter')" /> -->

    <!-- Кастомные элементы -->
    <slot name="custom-elements" />

    <!-- Общие элементы -->
    <div class="list-toolbar__actions">
      <q-btn
        color="primary"
        dense
        unelevated
        icon="add"
        label="Добавить"
        no-caps
        :disable="addDisabled"
        @click="emit('add')"
      >
        <q-tooltip v-if="addDisabledTooltip && addDisabled">
          {{ addDisabledTooltip }}
        </q-tooltip>
      </q-btn>
      <q-toggle v-model="toggleProxy" dense color="primary" label="Включая дочерние" />
      <q-btn
        flat
        dense
        round
        icon="refresh"
        color="primary"
        :loading="loading"
        @click="emit('reload')"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
// import { FilterTableButton } from 'src/shared';
// import { useI18n } from 'vue-i18n';
interface Props {
  searchValue: string;
  toggleValue: boolean;
  loading: boolean;
  searchPlaceholder: string;
  addDisabled?: boolean;
  addDisabledTooltip?: string | undefined;
}
// const { t } = useI18n();
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:searchValue', value: string): void;
  (e: 'update:toggleValue', value: boolean): void;
  (e: 'add'): void;
  (e: 'filter_table'): void;
  (e: 'reload'): void;
}>();

const searchProxy = computed({
  get: () => props.searchValue,
  set: (value: string) => emit('update:searchValue', value),
});

const toggleProxy = computed({
  get: () => props.toggleValue,
  set: (value) => emit('update:toggleValue', value),
});
</script>
<style scoped lang="scss">
.list-toolbar {
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;

  &__search {
    flex-grow: 1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
}
</style>
