import axios from 'axios'
import { showToast } from 'vant'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 添加认证token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加设备指纹（简单版本）
    const fingerprint = btoa(navigator.userAgent + screen.width + screen.height).substr(0, 32)
    config.headers['X-Device-ID'] = fingerprint
    
    // 添加请求时间戳
    config.headers['X-Timestamp'] = Date.now().toString()
    
    // 添加用户代理信息
    config.headers['X-User-Agent'] = navigator.userAgent
    
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data
    })
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    console.log(`✅ API响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: data
    })
    
    // 如果后端返回了标准格式的响应
    if (typeof data === 'object' && 'code' in data) {
      return data
    }
    
    // 否则包装成标准格式
    return {
      code: 200,
      message: 'success',
      data: data
    }
  },
  async (error) => {
    console.error(`❌ API错误: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error)
    
    // 网络错误
    if (!error.response) {
      const message = navigator.onLine ? '网络连接超时，请稍后重试' : '网络连接已断开，请检查网络'
      
      showToast({
        type: 'fail',
        message
      })
      
      return Promise.reject({
        code: 0,
        message: message,
        data: null
      })
    }
    
    const { status, data } = error.response
    
    // 处理不同的HTTP状态码
    switch (status) {
      case 401:
        // 未授权，清除认证信息并跳转到登录页
        showToast({
          type: 'fail',
          message: data?.message || '登录已过期，请重新登录'
        })
        
        // 清除本地存储的认证信息
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('event')
        
        // 延迟跳转到登录页，避免在某些情况下路由冲突
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }, 1000)
        break
        
      case 403:
        showToast({
          type: 'fail',
          message: data?.message || '没有权限访问'
        })
        break
        
      case 404:
        showToast({
          type: 'fail',
          message: '请求的资源不存在'
        })
        break
        
      case 429:
        showToast({
          type: 'fail',
          message: data?.message || '请求太频繁，请稍后重试'
        })
        break
        
      case 500:
        showToast({
          type: 'fail',
          message: '服务器内部错误，请联系管理员'
        })
        break
        
      default:
        showToast({
          type: 'fail',
          message: data?.message || `请求失败 (${status})`
        })
    }
    
    // 返回标准错误格式
    return Promise.reject({
      code: status,
      message: data?.message || error.message,
      data: data?.data || null
    })
  }
)

// 导出封装的请求方法
export const api = {
  get: (url, params = {}, config = {}) => {
    return request.get(url, { params, ...config })
  },
  
  post: (url, data = {}, config = {}) => {
    return request.post(url, data, config)
  },
  
  put: (url, data = {}, config = {}) => {
    return request.put(url, data, config)
  },
  
  delete: (url, config = {}) => {
    return request.delete(url, config)
  },
  
  upload: (url, formData, onUploadProgress) => {
    return request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },
  
  download: (url, params = {}, filename) => {
    return request.get(url, {
      params,
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename || 'download')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
  }
}

export default request