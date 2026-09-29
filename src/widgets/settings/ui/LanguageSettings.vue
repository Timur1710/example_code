<template>
  <q-card class="language-settings">
    <q-card-section>
      <div class="language-settings__header">
        <q-icon name="translate" size="24px" class="language-settings__icon" />
        <span class="language-settings__title">{{ t('language') }}</span>
      </div>

      <q-select
        v-model="selectedLocale"
        :options="localeOptions"
        :label="t('language')"
        emit-value
        map-options
        outlined
        dense
        class="language-settings__select"
        @update:model-value="onLocaleChange"
      >
        <template #prepend>
          <q-icon name="language" />
        </template>

        <template #option="{ opt, itemProps }">
          <q-item v-bind="itemProps">
            <q-item-section avatar>
              <span class="locale-flag">{{ opt.flag }}</span>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <template #selected-item="{ opt }">
          <div class="locale-selected">
            <span class="locale-flag">{{ opt.flag }}</span>
            <span>{{ opt.label }}</span>
          </div>
        </template>
      </q-select>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from 'src/stores/system-store';
import {
  LOCALE_OPTIONS,
  type SupportedLocale,
} from 'src/shared/config/locale';

const { t, locale } = useI18n();
const systemStore = useSystemStore();

const localeOptions = LOCALE_OPTIONS;
const selectedLocale = ref<SupportedLocale>(systemStore.currentLocale);

function onLocaleChange(newLocale: SupportedLocale) {
  systemStore.setLocale(newLocale);
  // Обновляем глобальный locale в i18n
  locale.value = newLocale;
}
</script>

<style lang="scss" scoped>
.language-settings {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__icon {
    color: #1976d2;
  }

  &__title {
    font-size: 18px;
    font-weight: 500;
    color: #333;
  }

  &__select {
    max-width: 650px;
  }
}

.locale-flag {
  font-size: 20px;
  margin-right: 8px;
}

.locale-selected {
  display: flex;
  align-items: center;
}
</style>

