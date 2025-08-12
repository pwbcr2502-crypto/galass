import axios from 'axios'
import { ElMessage } from 'element-plus'
import store from '../store'
import router from '../router'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const request = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 10000
})

// Request interceptor
request.interceptors.request.use(
  config => {
    // Always use the admin token for admin panel
    const adminToken = 'admin-anniversary-2025-secret'
    config.headers['X-Admin-Token'] = adminToken
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  response => {
    const { code, message, data } = response.data
    
    if (code === 200) {
      return { data, message }
    } else {
      ElMessage.error(message || 'Request failed')
      return Promise.reject(new Error(message || 'Request failed'))
    }
  },
  error => {
    console.error('Response error:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        ElMessage.error('认证失败，请重新登录')
        store.dispatch('auth/logout')
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error('访问被拒绝')
      } else if (status === 404) {
        // Don't show error for 404, might be expected (no data)
        console.warn('Resource not found (404)')
      } else if (status === 500) {
        ElMessage.error('服务器错误')
      } else {
        ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时')
    } else if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查后端服务是否正常运行')
    } else {
      ElMessage.error('网络错误')
    }
    
    return Promise.reject(error)
  }
)

// Admin API request helper
export const adminRequest = {
  get: (url, config) => request.get(`/admin${url}`, config),
  post: (url, data, config) => request.post(`/admin${url}`, data, config),
  put: (url, data, config) => request.put(`/admin${url}`, data, config),
  delete: (url, config) => request.delete(`/admin${url}`, config)
}

export default request