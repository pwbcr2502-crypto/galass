import { api } from './request'

export const authApi = {
  // 登录
  login: (data) => {
    return api.post('/auth/login', data)
  },
  
  // 登出
  logout: () => {
    return api.post('/auth/logout')
  },
  
  // 验证token
  validateToken: () => {
    return api.get('/auth/validate')
  },
  
  // 刷新token
  refreshToken: () => {
    return api.post('/auth/refresh')
  },
  
  // 获取用户资料
  getProfile: () => {
    return api.get('/auth/profile')
  },
  
  // 获取会话信息
  getSessionInfo: () => {
    return api.get('/auth/session')
  }
}