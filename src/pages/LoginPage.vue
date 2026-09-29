<template>
  <div class="container">
    <div class="login">
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoginForm } from 'src/widgets';
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

.login {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 10px 0 50px;
}
</style>

