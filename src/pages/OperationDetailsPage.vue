<template>
<DetailsPageTemplate 
:title="operationTitle"
:subtitle="'Операция'"
:detailsError="detailsError"
:item="operation"
:isDetailsLoading="isDetailsLoading"
:fetchItemById="(id) => operationStore.fetchOperationInfo(id)"
:clearSelectedItem="() => operationStore.clearOperationInfo()"
>
  <template #details-card>
    <template v-if="operation">
      <OperationDetailsCard :operation="operation" :format-date="formatDate" />
    </template>
  </template>
</DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useOperationStore } from 'src/entities/operation';
import { OperationDetailsCard } from 'src/widgets';
import { DetailsPageTemplate, formatDate } from 'src/shared/templates/DetailsPageTemplate';

defineOptions({
  name: 'OperationDetailsPage',
});

const operationStore = useOperationStore();

const { operationInfo, isOperationInfoLoading, operationInfoError } =
  storeToRefs(operationStore);

const operation = computed(() => operationInfo.value);
const operationTitle = computed(() => operation.value?.name || 'Загрузка...');
const isDetailsLoading = computed(() => isOperationInfoLoading.value);
const detailsError = computed(() => operationInfoError.value);
</script>

