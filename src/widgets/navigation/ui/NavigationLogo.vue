<template>
  <div :class="!isCollapsed?'navigation-logo':'text-center'">
    <router-link :to="{ name: 'main' }" class="logo-link">
      <img src="/img/logo1.svg" :width="isCollapsed ? '70' : '149'" alt="MSA Logo" :class="['logo-image', { 'q-mx-auto q-my-md': isCollapsed }]" />
    </router-link>
    <q-btn
      flat
      round
      :ripple="false"
      dense
      :icon="isCollapsed ? 'chevron_right' : 'chevron_left'"
      class="collapse-btn"
      @click="$emit('toggle')"
    />

  </div>
</template>

<script setup lang="ts">
defineProps<{
  isCollapsed: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style lang="scss" scoped>
.navigation-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 15px 20px;
  min-height: 93px;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-image {
  max-width: 149px;
  height: auto;
  transition: max-width 0.3s ease;

  .navigation--collapsed & {
    max-width: 50px;
  }
}

.collapse-btn {
  color: #ffffff;
  transition: all 0.2s ease;
  position: absolute;
  top: calc(50vh + 17px);
  right: -17px;
  // background: rgba(0, 0, 0, 1);
  background: linear-gradient(to left, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 50%);
  opacity: 1;

  &:hover {
    background: linear-gradient(to left, rgba(0, 0, 0,0.75) 50%, rgba(0, 0, 0, 0) 50%)!important;
    :deep(span.q-focus-helper) {
      opacity: 0;
    }
  }
  &:focus {
    background: linear-gradient(to left, rgba(0, 0, 0,1) 50%, rgba(0, 0, 0, 0) 50%)!important;
    :deep(span.q-focus-helper) {
      opacity: 0;
    }
  }
  :deep(span i.material-icons) {
    position: relative;
    right: -6px;
  }
}
</style>

