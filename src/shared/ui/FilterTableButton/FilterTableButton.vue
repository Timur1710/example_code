<template>
  <div class="filter-icon" v-bind="$attrs">
    <q-icon name="sym_o_filter_alt" :size="props.size" class="filter-icon__content">
      <q-tooltip class="filter-icon__tooltip" anchor="top middle" self="bottom middle">
        {{ text }}
      </q-tooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'FilterTableButton',
  inheritAttrs: false,
});

const props = defineProps({
  text: { type: String, required: true },
  size: { type: String, default: '16px' },
});
</script>

<style lang="scss" scoped>
.active_filter > .filter-icon__content {
  color: var(--negative);
}
.disable_filter > .filter-icon__content {
  color: var(--strong-gray);
  font-weight: 500;
}
.icon_bordered{
  border: 1px solid black;
  border-radius: 5px;
  width: 24px;
  height: 24px;
}
.filter-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: sub;
  transition: all 0.2s ease;
  flex-shrink: 0;
  cursor: pointer;
  &__content {
    font-size: 12px;
    line-height: 1;
  }

  &__tooltip {
    font-size: 12px;
    max-width: 300px;
    white-space: pre-line;
  }
}

// Для использования в q-input (в append/prepend слотах)
:deep(.q-field__append .filter-icon),
:deep(.q-field__prepend .filter-icon) {
  margin-left: 4px;
  margin-right: 4px;
}
</style>
