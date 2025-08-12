<template>
  <div id="app" class="big-screen-app">
    <!-- 顶部导航栏 -->
    <nav class="top-nav" v-if="showNavigation">
      <div class="nav-brand">
        <h2>🎉 周年庆投票大屏</h2>
      </div>
      <div class="nav-menu">
        <router-link to="/" class="nav-item" active-class="active">
          📊 仪表盘
        </router-link>
        <router-link to="/results" class="nav-item" active-class="active">
          🏆 投票结果
        </router-link>
        <router-link to="/statistics" class="nav-item" active-class="active">
          📈 数据统计
        </router-link>
        <router-link to="/settings" class="nav-item" active-class="active">
          ⚙️ 系统设置
        </router-link>
      </div>
      <div class="nav-actions">
        <!-- 全屏切换 -->
        <button @click="toggleFullscreen" class="action-btn" title="全屏切换">
          <span v-if="!isFullscreen">🔍</span>
          <span v-else>🔍️</span>
        </button>
        
        <!-- 连接状态指示器 -->
        <div class="connection-status" :class="connectionStatusClass" :title="connectionStatusText">
          <div class="status-dot"></div>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content" :class="{ 'fullscreen': isFullscreen }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 全局加载遮罩 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
      </div>
    </div>

    <!-- 全局错误提示 -->
    <div v-if="globalError" class="global-error" @click="clearError">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ globalError }}</div>
        <div class="error-close">点击关闭</div>
      </div>
    </div>

    <!-- 系统通知 -->
    <div v-if="systemNotification" class="system-notification" :class="notificationClass">
      <div class="notification-content">
        <div class="notification-icon">{{ notificationIcon }}</div>
        <div class="notification-message">{{ systemNotification }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBigScreenWebSocket } from './utils/websocket.js'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 响应式数据
    const isFullscreen = ref(false)
    const globalLoading = ref(false)
    const loadingText = ref('加载中...')
    const globalError = ref('')
    const systemNotification = ref('')
    const notificationType = ref('info') // info, success, warning, error
    const isConnected = ref(false)

    // WebSocket 连接
    const { connectBigScreen, disconnect, isConnected: wsConnected } = useBigScreenWebSocket()

    // 计算属性
    const showNavigation = computed(() => {
      // 在全屏模式下可能隐藏导航
      return !isFullscreen.value || route.path === '/settings'
    })

    const connectionStatusClass = computed(() => ({
      'status-connected': isConnected.value,
      'status-connecting': !isConnected.value,
      'status-error': false // 可以根据错误状态设置
    }))

    const connectionStatusText = computed(() => {
      return isConnected.value ? '已连接' : '连接中'
    })

    const notificationClass = computed(() => ({
      [`notification-${notificationType.value}`]: true
    }))

    const notificationIcon = computed(() => {
      const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      }
      return icons[notificationType.value] || 'ℹ️'
    })

    // 方法
    const toggleFullscreen = async () => {
      try {
        if (!isFullscreen.value) {
          // 进入全屏
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen()
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen()
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen()
          }
        } else {
          // 退出全屏
          if (document.exitFullscreen) {
            await document.exitFullscreen()
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen()
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen()
          }
        }
      } catch (error) {
        console.error('Fullscreen toggle failed:', error)
        showNotification('全屏切换失败', 'error')
      }
    }

    const showLoading = (text = '加载中...') => {
      loadingText.value = text
      globalLoading.value = true
    }

    const hideLoading = () => {
      globalLoading.value = false
    }

    const showError = (message) => {
      globalError.value = message
      setTimeout(clearError, 5000) // 5秒后自动关闭
    }

    const clearError = () => {
      globalError.value = ''
    }

    const showNotification = (message, type = 'info', duration = 3000) => {
      systemNotification.value = message
      notificationType.value = type
      
      setTimeout(() => {
        systemNotification.value = ''
      }, duration)
    }

    const handleFullscreenChange = () => {
      isFullscreen.value = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      )
    }

    const handleVoteUpdate = (data) => {
      console.log('Vote update received:', data)
      // 可以在这里触发全局的投票更新事件
      showNotification('投票数据已更新', 'info', 2000)
    }

    const handleSystemUpdate = (data) => {
      console.log('System update received:', data)
      
      switch (data.action) {
        case 'vote_start':
          showNotification('投票已开始！', 'success')
          break
        case 'vote_end':
          showNotification('投票已结束！', 'warning')
          break
        case 'system_maintenance':
          showNotification('系统维护中，请稍候...', 'warning')
          break
        default:
          showNotification(data.message || '系统更新', 'info')
      }
    }

    const initializeApp = async () => {
      try {
        showLoading('初始化系统...')
        
        // 连接 WebSocket
        connectBigScreen(handleVoteUpdate, handleSystemUpdate)
        
        // 监听连接状态变化
        const checkConnection = () => {
          isConnected.value = wsConnected.value
        }
        
        const connectionTimer = setInterval(checkConnection, 1000)
        
        // 在组件卸载时清除定时器
        onUnmounted(() => {
          clearInterval(connectionTimer)
        })

        // 等待连接建立
        setTimeout(() => {
          hideLoading()
          if (wsConnected.value) {
            showNotification('系统初始化完成', 'success')
          } else {
            showNotification('网络连接异常，部分功能可能受限', 'warning')
          }
        }, 2000)

      } catch (error) {
        console.error('App initialization failed:', error)
        hideLoading()
        showError('系统初始化失败，请刷新页面重试')
      }
    }

    // 生命周期
    onMounted(() => {
      // 监听全屏状态变化
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.addEventListener('msfullscreenchange', handleFullscreenChange)

      // 初始化应用
      initializeApp()

      // 处理页面可见性变化
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('Page hidden, pausing updates')
        } else {
          console.log('Page visible, resuming updates')
          // 可以在这里重新连接或刷新数据
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // 处理窗口大小变化
      const handleResize = () => {
        // 响应式布局调整
        console.log('Window resized:', window.innerWidth, 'x', window.innerHeight)
      }
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // 清理事件监听器
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)
      
      // 断开 WebSocket 连接
      disconnect()
    })

    // 全局提供方法给子组件使用
    const globalMethods = {
      showLoading,
      hideLoading,
      showError,
      showNotification
    }

    // 将方法挂载到全局
    const app = getCurrentInstance()
    if (app) {
      Object.assign(app.appContext.config.globalProperties, globalMethods)
    }

    return {
      isFullscreen,
      globalLoading,
      loadingText,
      globalError,
      systemNotification,
      showNavigation,
      connectionStatusClass,
      connectionStatusText,
      notificationClass,
      notificationIcon,
      toggleFullscreen,
      clearError
    }
  }
}
</script>

<style scoped>
/* 全局样式 */
.big-screen-app {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 顶部导航 */
.top-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
  z-index: 100;
}

.nav-brand h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  gap: 20px;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 25px;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.1);
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}

.nav-item.active {
  background: rgba(255,255,255,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

/* 连接状态 */
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  font-size: 0.9rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected .status-dot {
  background: #4CAF50;
}

.status-connecting .status-dot {
  background: #FF9800;
}

.status-error .status-dot {
  background: #F44336;
}

/* 主内容区域 */
.main-content {
  min-height: calc(100vh - 80px);
  transition: all 0.3s ease;
}

.main-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #f8fafc;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 全局加载遮罩 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  text-align: center;
  color: white;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 500;
}

/* 全局错误提示 */
.global-error {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #f44336;
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  max-width: 400px;
  animation: shake 0.5s ease-in-out;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.error-icon {
  font-size: 3rem;
}

.error-message {
  font-size: 1.2rem;
  font-weight: 500;
}

.error-close {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 系统通知 */
.system-notification {
  position: fixed;
  top: 100px;
  right: 30px;
  padding: 15px 25px;
  border-radius: 10px;
  color: white;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.notification-info {
  background: #2196F3;
}

.notification-success {
  background: #4CAF50;
}

.notification-warning {
  background: #FF9800;
}

.notification-error {
  background: #F44336;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-icon {
  font-size: 1.2rem;
}

.notification-message {
  font-weight: 500;
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shake {
  0%, 100% { transform: translate(-50%, -50%) rotateZ(0deg); }
  25% { transform: translate(-50%, -50%) rotateZ(1deg); }
  75% { transform: translate(-50%, -50%) rotateZ(-1deg); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-nav {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .nav-menu {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-item {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
  
  .global-error {
    max-width: 90vw;
    padding: 20px;
  }
  
  .system-notification {
    right: 15px;
    left: 15px;
    top: 80px;
  }
}

@media (max-width: 480px) {
  .nav-brand h2 {
    font-size: 1.2rem;
  }
  
  .nav-menu {
    gap: 10px;
  }
  
  .nav-item {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

/* 打印样式 */
@media print {
  .top-nav,
  .global-loading,
  .global-error,
  .system-notification {
    display: none !important;
  }
  
  .main-content {
    margin: 0;
    padding: 0;
  }
}
</style>

<style>
/* 全局样式，不使用 scoped */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>