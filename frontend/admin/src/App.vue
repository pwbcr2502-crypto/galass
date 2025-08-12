<template>
  <div id="app" class="admin-app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.admin-app {
  min-height: 100vh;
  background-color: #f0f2f5;
}
</style>