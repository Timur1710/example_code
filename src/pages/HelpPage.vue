<template>
<DetailsPageTemplate 
:title="helpTitle"
:subtitle="'Справка'"
:isDetailsLoading="isDetailsLoading"
:detailsError="detailsError"
:item="getMDContent"
>
  <template #details-card>
    <!-- Основной контент -->
    <q-card class="help-page__card">
    <q-list bordered class="rounded-borders">
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        v-for="(section,index) in MENU_ITEMS"
        :key="index"
        :model-value="status[index] ?? false"
        @update:model-value="status[index] = $event"
      >
        <template v-slot:header>
        <q-item-section class="q-pr-none icon" avatar>
          <q-avatar size="24px">
            <img :src="getIconPath(section.key, true)" :alt="section.key"  />
          </q-avatar>
        </q-item-section>
        <q-item-section>
              {{t(section.labelKey)}}
        </q-item-section>
        </template>
          <q-card>
            <q-card-section>
              <!-- Динамический компонент с markdown контентом справки -->
              <component :is="getMDContent(section.key)" />
            </q-card-section>
          </q-card>
      </q-expansion-item>
    </q-list>
  </q-card>
  </template>
</DetailsPageTemplate>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {computed,onBeforeMount,onMounted,ref} from 'vue'
// Импорт markdown контента справки
import  {HELP_FILES}  from "src/shared";
import { MENU_ITEMS,getIconPath} from '../widgets/navigation/lib';
import { useRoute } from 'vue-router';
import { DetailsPageTemplate } from 'src/shared/templates/DetailsPageTemplate';

const { t } = useI18n();
const md_content = HELP_FILES.components;
const route = useRoute();
const $q = useQuasar();
const status = ref<boolean[]>([]);
const helpTitle = computed(() => 'Информация о системе');
const isDetailsLoading = computed(() => false);
const detailsError = computed(() => null);
// Получение компонента markdown по ключу раздела
function getMDContent(key: string) {
  return md_content[key as keyof typeof md_content];
}

// Инициализация перед монтированием - открываем нужную секцию если указана
onBeforeMount(() => {
  status.value = MENU_ITEMS.map((item) => route.query.section === item.key);
})

// Обработка после монтирования - поиск и подсветка текста в справке
onMounted(() => {
  // Проверяем наличие параметров поиска
  if(route.query.section){
      // Извлекаем ID элемента из хеша
      const id = route.hash.replace('#','');
      // Ищем элемент в DOM
      const md_word = document.getElementById(id) as HTMLElement
      // Название раздела справки
      if(md_word) {
        md_word.style.backgroundColor = '#ffe6cc';
        md_word.style.padding = '4px 8px';
      }
      else{
        const section = route.query.section as string;
        const help_text = route.query.help_text as string;
        $q.dialog({
          title: 'Раздел справки в разработке',
          message: `По запросу "`+  help_text  +`" в разделе "`+t(section)+`" информация не найдена.`,
          ok: {
            label: t('оk'),
            color: 'info',
          },
       })
      }  
  }
})
</script>
<style lang="scss" scoped>
:deep(img.md_img) {
  display: block;
}
/* Слева */
:deep(.img-left) {
  margin-right: auto;
}
/* Справа */
:deep(.img-right) {
  margin-left: auto;
}
/* По центру */
:deep(.img-center) {
  margin: 0 auto;
}
:deep(h5.md_header) {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.pointer {
  cursor: pointer;
}
div.icon{
  min-width: 32px;
  .q-avatar{
    border-radius: 0%;
  }
}
</style>
