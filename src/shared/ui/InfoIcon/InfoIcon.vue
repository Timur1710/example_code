<template>
  <div class="info-icon" v-bind="$attrs">
    <q-icon name="help_outline" size="16px" :class="dark_mode?'info-dark':'info-light' + 'info-icon__content'">
      <q-popup-proxy :offset="[150, vertical_offset(text.length)]" v-if="!dark_mode" class="tooltip_mode" id="tooltip_banner">
        <q-banner>
          <span class="tooltip_text">{{ text }} </span>
          <router-link
            class="q-ml-sm"
            :to="{ name: 'help', hash:hash ,query:{section: section,help_text:text} }"
          >
            Подробнее...
          </router-link>
        </q-banner>
      </q-popup-proxy>
      <q-tooltip v-else class="info-icon__tooltip" anchor="top middle" self="bottom middle">
        {{ text }}
      </q-tooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'InfoIcon',
  inheritAttrs: false,
});

defineProps({
  dark_mode:{ type: Boolean, default: false },
  text: { type: String, required: true },
  hash: { type: String,required: true},
  section: { type: String,required: true},
});

function vertical_offset (letters:number):number {
  const number_of_lines = Math.ceil(letters/60)
  return (45+number_of_lines*15)*-1
}
</script>

<style lang="scss" scoped>
div.tooltip_mode div.q-banner {
  color: #ffffff;
  background-color: #757575;
  padding: 0.4rem;
  min-height: 0;
  max-width: 300px;
  border-radius: 4px;
  font-size: 0.625rem;
  line-height: 1.2;

  :deep(.text-body2) {
    line-height: 1;
  }

  span {
    font-size: 0.625rem;
  }

  a {
    font-size: 0.625rem;
    color: #bbdefb;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #90caf9;
    }
  }
}
.info-dark {
  background-color: #000000;
  color: #ffffff;
  cursor: pointer;
  border-radius: 50%;
  &:hover {
    background-color: #3a3a3a;
    color: #ffffff;
  }
}
.info-light {
  background-color: #e0e0e0;
  color: #666666;
  
  border-radius: 50%;
  &:hover {
    background-color: #cccccc;
    color: #333333;
  }
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  cursor: help;
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
:deep(.q-field__append .info-icon),
:deep(.q-field__prepend .info-icon) {
  margin-left: 4px;
  margin-right: 4px;
}
</style>
