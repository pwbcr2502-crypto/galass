import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从 localStorage 获取管理员 token
    const adminToken = localStorage.getItem('admin_token')
    if (adminToken) {
      config.headers['Authorization'] = `Bearer ${adminToken}`
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    console.log('API Request:', config.method.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.status)
    
    // 直接返回 data 部分
    if (response.data) {
      return response.data
    }
    
    return response
  },
  error => {
    console.error('Response Error:', error)
    
    // 处理不同的错误状态码
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('admin_token')
          console.warn('Unauthorized access, please login again')
          break
          
        case 403:
          console.error('Access forbidden')
          break
          
        case 404:
          console.error('API endpoint not found:', error.config.url)
          break
          
        case 429:
          console.error('Too many requests, please try again later')
          break
          
        case 500:
          console.error('Internal server error')
          break
          
        default:
          console.error(`HTTP Error ${status}:`, data?.message || error.message)
      }
      
      // 返回错误信息
      return Promise.reject({
        status,
        message: data?.message || error.message,
        data: data
      })
    } else if (error.request) {
      // 网络错误
      console.error('Network Error:', error.message)
      return Promise.reject({
        status: 0,
        message: '网络连接失败，请检查网络连接',
        data: null
      })
    } else {
      // 其他错误
      console.error('Error:', error.message)
      return Promise.reject({
        status: -1,
        message: error.message,
        data: null
      })
    }
  }
)

export default request