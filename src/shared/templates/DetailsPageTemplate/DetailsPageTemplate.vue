<template>
  <q-page class="item-details-page">
    <div class="item-details-page__header">
      <q-btn flat round color="primary" icon="arrow_back" @click="goBack" />
      <div class="item-details-page__title-block">
        <div class="item-details-page__subtitle">{{ props.subtitle }}</div>
        <div class="item-details-page__title">
          {{ props.title }}
        </div>
      </div>
    </div>
    <q-banner
      v-if="props.detailsError"
      class="q-mb-md"
      rounded
      dense
      color="negative"
      text-color="white"
      icon="warning"
    >
      {{ props.detailsError }}
    </q-banner>

    <q-banner
      v-else-if="!props.item && !props.isDetailsLoading"
      class="q-mb-md"
      rounded
      dense
      color="grey-2"
      text-color="grey-9"
      icon="badge"
    >
      {{ props.subtitle }} не найден или недоступен
    </q-banner>
    <slot name="details-card"></slot>
    <q-inner-loading :showing="props.isDetailsLoading">
      <q-spinner-dots color="primary" size="48px" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
defineOptions({
  name: 'DetailsPage',
});
import type { PropType, Ref} from 'vue';
import { useRoute, useRouter} from 'vue-router';
import { useQuasar } from 'quasar';
import { computed,watch,onBeforeUnmount } from 'vue';
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const _id = computed(() => route.params.id as string | undefined);
const props = defineProps({
  item: {
      type: Object as PropType<object | null>,
      required: true
  },
fetchItemById: {
    type: Function as PropType<((id: string) => Promise<unknown>) | undefined>,
    required: false
},
  clearSelectedItem: {
      type: Function as PropType<(() => void) | undefined>,
      required: false
  },
  subtitle: {
    type: String,
    required: true
  },
  title: {
    type: Object as PropType<string | Ref<string>>,
    required: true
  },
  isDetailsLoading: {
        type: Boolean as PropType<boolean | undefined>,
        required: true
    },
  detailsError: {
    type: String as PropType<string | null>,
    required: false
    }
});
watch(
  _id,
  (id) => {
    if (id) {
      void loadWorker(id);
    } else {
      props.clearSelectedItem?.();
    }
  },
  { immediate: true }
);

async function loadWorker(id: string): Promise<void> {
  try {
    await props.fetchItemById?.(id);
  } catch (e) {
    console.error('Failed to load', e);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить',
    });
  }
}

function goBack(): void {
  void router.go(-1);
}
onBeforeUnmount(() => {
  props.clearSelectedItem?.();
});
</script>

<style scoped lang="scss">
.stream-details-page{
  display: flex;
  flex-direction: column;
  //height: calc(100vh - 49px);
  //overflow: hidden;
}
.item-details-page {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f5f5f5;
  height: calc(100vh - 49px);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__subtitle {
    font-size: 13px;
    color: #7a7a7a;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &__info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px 16px;
  }

  &__info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__description {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}
</style>

