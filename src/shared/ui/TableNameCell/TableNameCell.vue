<template>
  <div class="column" style="cursor: pointer">
    <span class="text-primary">{{ name }}</span>
    <span color="grey-10">
      {{ id }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  id: string
}>()
</script>
