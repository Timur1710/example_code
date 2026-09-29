<template>
<DetailsPageTemplate 
:title="equipmentTitle"
:subtitle="'Оборудование'"
:detailsError="detailsError"
:item="equipment"
:isDetailsLoading="isDetailsLoading"
:fetchItemById="(id) => equipmentStore.fetchEquipmentById(id)"
:clearSelectedItem="() => equipmentStore.clearSelectedEquipment()"
>
  <template #details-card>
    <EquipmentDetailsCard
      v-if="equipment"
      :equipment="equipment"
      :format-date="formatDate"
      class="equipment-details-page__card"
    />
  </template>
</DetailsPageTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useEquipmentStore } from 'src/entities/equipment';
import { EquipmentDetailsCard } from 'src/widgets';
import { DetailsPageTemplate, formatDate } from 'src/shared/templates/DetailsPageTemplate';
defineOptions({
  name: 'EquipmentDetailsPage',
});

const equipmentStore = useEquipmentStore();
const { selectedEquipment, isEquipmentDetailsLoading, equipmentDetailsError } =
  storeToRefs(equipmentStore);

const equipment = computed(() => selectedEquipment.value);
const equipmentTitle = computed(() => equipment.value?.name || 'Загрузка...');
const isDetailsLoading = computed(() => isEquipmentDetailsLoading.value);
const detailsError = computed(() => equipmentDetailsError.value);
</script>


