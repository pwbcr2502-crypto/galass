<template>
  <div id="app">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div>正在加载年会投票系统...</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b6b 100%);
}

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b6b 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  z-index: 9999;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 0.2rem solid rgba(255, 255, 255, 0.2);
  border-top: 0.2rem solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.2rem;
  box-shadow: 0 0.2rem 1rem rgba(0, 0, 0, 0.1);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>