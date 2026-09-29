<template>
<DetailsPageTemplate 
:title="materialTitle"
:subtitle="'Материал'"
:detailsError="detailsError"
:item="material"
:isDetailsLoading="isDetailsLoading"
:fetchItemById="(id) => materialStore.fetchMaterialById(id)"
:clearSelectedItem="() => materialStore.clearSelectedMaterial()"
>
  <template #details-card>
      <template v-if="material">
      <MaterialDetailsCard :material="material" :format-date="formatDate" />
      <q-card v-if="hasSupply" class="material-details-page__card">
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">Поставки</div>
          <q-table
            :rows="supplyRows"
            :columns="supplyColumns"
            row-key="date"
            flat
            dense
            hide-bottom
          >
            <template #body-cell-date="props">
              <q-td :props="props">
                {{ formatDate(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
      </template> 
  </template>
</DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { useMaterialStore } from 'src/entities/material';
import { MaterialDetailsCard } from 'src/widgets';
import { DetailsPageTemplate, formatDate } from 'src/shared/templates/DetailsPageTemplate';

defineOptions({
  name: 'MaterialDetailsPage',
});

const materialStore = useMaterialStore();
const { selectedMaterial, isMaterialDetailsLoading, materialDetailsError } =
  storeToRefs(materialStore);

const material = computed(() => selectedMaterial.value);
const materialTitle = computed(() => material.value?.name || 'Загрузка...');
const isDetailsLoading = computed(() => isMaterialDetailsLoading.value);
const detailsError = computed(() => materialDetailsError.value);

const supplyColumns: QTableProps['columns'] = [
  { name: 'date', label: 'Дата', field: 'date', align: 'left' },
  { name: 'amount', label: 'Кол-во', field: 'amount', align: 'left' },
];

const supplyRows = computed(() => material.value?.value?.supply ?? []);
const hasSupply = computed(() => supplyRows.value.length > 0);
</script>

