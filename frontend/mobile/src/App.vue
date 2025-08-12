<template>
  <div id="app">
    <!-- 全局加载状态 -->
    <van-loading v-if="appStore.loading" type="spinner" vertical :text="appStore.loadingText" class="global-loading" />
    
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="keepAliveComponents">
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </router-view>
    
    <!-- 全局提示 -->
    <van-toast />
    <van-notify />
    <van-dialog />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 需要缓存的组件
const keepAliveComponents = computed(() => {
  return ['Home', 'Results', 'MyVotes', 'Profile', 'About']
})

// 初始化应用
onMounted(async () => {
  // 初始化应用状态
  appStore.initializeApp()
  
  // 尝试初始化认证状态
  await authStore.initAuth()
  
  console.log('应用初始化完成', {
    isLoggedIn: authStore.isLoggedIn,
    currentRoute: route.path,
    deviceInfo: appStore.deviceInfo
  })
})

// 清理资源
onUnmounted(() => {
  appStore.cleanup()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: var(--gradient-bg-sunrise);
  position: relative;
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Vant 组件样式覆盖 */
:deep(.van-toast) {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

:deep(.van-notify) {
  border-radius: 0 0 8px 8px;
}

:deep(.van-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* 应用级别动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.3s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>