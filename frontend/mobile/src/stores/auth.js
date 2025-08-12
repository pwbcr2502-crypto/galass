import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { useAppStore } from './app'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)
  const event = ref(null)
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  const appStore = useAppStore()
  
  // 登录
  const login = async (eventCode, empNo) => {
    try {
      console.log('开始调用登录API...', { eventCode, empNo })
      
      const response = await authApi.login({
        eventCode,
        empNo
      })
      
      console.log('登录API响应:', response)
      
      if (response.code === 200) {
        const { token: authToken, employee, event: eventInfo } = response.data
        
        console.log('登录成功，保存认证信息...', { employee, eventInfo })
        
        // 保存认证信息
        token.value = authToken
        user.value = employee
        event.value = eventInfo
        
        // 保存到本地存储
        localStorage.setItem('token', authToken)
        localStorage.setItem('user', JSON.stringify(employee))
        localStorage.setItem('event', JSON.stringify(eventInfo))
        
        console.log('认证信息已保存，登录完成')
        return { success: true, data: response.data }
      } else {
        console.error('登录API返回错误:', response.message)
        return { success: false, message: response.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      
      let errorMessage = '登录失败，请检查网络连接'
      
      if (error.response) {
        // 服务器响应了错误状态码
        errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`
      } else if (error.request) {
        // 请求发出但没有响应
        errorMessage = '网络连接失败，请检查网络'
      } else {
        // 其他错误
        errorMessage = error.message || '登录失败'
      }
      
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }
  
  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除本地数据
      clearAuth()
    }
  }
  
  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    user.value = null
    event.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('event')
  }
  
  // 验证token
  const validateToken = async () => {
    if (!token.value) {
      return false
    }
    
    try {
      const response = await authApi.validateToken()
      if (response.code === 200) {
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('Token validation error:', error)
      clearAuth()
      return false
    }
  }
  
  // 刷新token
  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken()
      if (response.code === 200) {
        const { token: newToken, employee } = response.data
        
        token.value = newToken
        user.value = employee
        
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(employee))
        
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuth()
      return false
    }
  }
  
  // 获取用户资料
  const getProfile = async () => {
    try {
      const response = await authApi.getProfile()
      if (response.code === 200) {
        const { employee } = response.data
        user.value = { ...user.value, ...employee }
        localStorage.setItem('user', JSON.stringify(user.value))
        return response.data
      }
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  }
  
  // 初始化认证状态
  const initAuth = async () => {
    try {
      // 从本地存储恢复用户信息
      const storedUser = localStorage.getItem('user')
      const storedEvent = localStorage.getItem('event')
      
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
      
      if (storedEvent) {
        event.value = JSON.parse(storedEvent)
      }
      
      // 验证token有效性
      if (token.value) {
        const isValid = await validateToken()
        if (!isValid) {
          clearAuth()
          return false
        }
        return true
      }
      
      return false
    } catch (error) {
      console.error('Init auth error:', error)
      clearAuth()
      return false
    }
  }
  
  // 获取会话信息
  const getSessionInfo = async () => {
    try {
      const response = await authApi.getSessionInfo()
      return response.data
    } catch (error) {
      console.error('Get session info error:', error)
      throw error
    }
  }
  
  // 检查是否需要重新登录
  const checkAuthStatus = async () => {
    if (!isLoggedIn.value) {
      return { needLogin: true }
    }
    
    try {
      const sessionInfo = await getSessionInfo()
      const expiresAt = new Date(sessionInfo.expiresAt)
      const now = new Date()
      const remainingMinutes = Math.floor((expiresAt - now) / 60000)
      
      // 如果剩余时间少于5分钟，尝试刷新token
      if (remainingMinutes < 5) {
        const refreshed = await refreshToken()
        if (!refreshed) {
          return { needLogin: true }
        }
      }
      
      return { 
        needLogin: false, 
        remainingMinutes,
        sessionInfo 
      }
    } catch (error) {
      console.error('Check auth status error:', error)
      return { needLogin: true }
    }
  }
  
  return {
    // 状态
    token,
    user,
    event,
    isLoggedIn,
    
    // Actions
    login,
    logout,
    clearAuth,
    validateToken,
    refreshToken,
    getProfile,
    initAuth,
    getSessionInfo,
    checkAuthStatus
  }
})