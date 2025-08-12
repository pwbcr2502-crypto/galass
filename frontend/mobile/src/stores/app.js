import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const loadingText = ref('加载中...')
  const isOnline = ref(navigator.onLine)
  const networkType = ref('unknown')
  
  // 设备信息
  const deviceInfo = ref({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  })
  
  // 应用配置
  const config = ref({
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    socketUrl: import.meta.env.VITE_SOCKET_URL || '/socket.io',
    enableWebSocket: true,
    enablePWA: true
  })
  
  // 错误信息
  const errors = ref([])
  
  // Actions
  const setLoading = (isLoading, text = '加载中...') => {
    loading.value = isLoading
    loadingText.value = text
  }
  
  const updateNetworkStatus = () => {
    isOnline.value = navigator.onLine
    
    // 获取网络连接类型（如果支持）
    if ('connection' in navigator) {
      networkType.value = navigator.connection.effectiveType || 'unknown'
    }
  }
  
  const updateDeviceInfo = () => {
    deviceInfo.value = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timestamp: new Date().toISOString()
    }
  }
  
  const addError = (error) => {
    const errorInfo = {
      id: Date.now(),
      message: error.message || error,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      url: window.location.href
    }
    
    errors.value.unshift(errorInfo)
    
    // 最多保留10个错误记录
    if (errors.value.length > 10) {
      errors.value = errors.value.slice(0, 10)
    }
    
    console.error('App Error:', errorInfo)
  }
  
  const clearErrors = () => {
    errors.value = []
  }
  
  const initializeApp = () => {
    // 监听网络状态变化
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateDeviceInfo)
    
    // 监听网络连接变化（如果支持）
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkStatus)
    }
    
    // 初始化状态
    updateNetworkStatus()
    updateDeviceInfo()
    
    // 设置全局错误处理
    window.addEventListener('error', (event) => {
      addError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      addError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason
      })
    })
    
    // 检测是否在微信浏览器中
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
    const isAlipay = /AlipayClient/i.test(navigator.userAgent)
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    
    deviceInfo.value.isWeChat = isWeChat
    deviceInfo.value.isAlipay = isAlipay
    deviceInfo.value.isMobile = isMobile
    
    console.log('App initialized', {
      isOnline: isOnline.value,
      networkType: networkType.value,
      deviceInfo: deviceInfo.value
    })
  }
  
  const cleanup = () => {
    window.removeEventListener('online', updateNetworkStatus)
    window.removeEventListener('offline', updateNetworkStatus)
    window.removeEventListener('resize', updateDeviceInfo)
    
    if ('connection' in navigator) {
      navigator.connection.removeEventListener('change', updateNetworkStatus)
    }
  }
  
  // 获取设备指纹（简单版本）
  const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    // 简单哈希
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36)
  }
  
  return {
    // 状态
    loading,
    loadingText,
    isOnline,
    networkType,
    deviceInfo,
    config,
    errors,
    
    // Actions
    setLoading,
    updateNetworkStatus,
    updateDeviceInfo,
    addError,
    clearErrors,
    initializeApp,
    cleanup,
    getDeviceFingerprint
  }
})