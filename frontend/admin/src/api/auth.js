import request from './request'

export const login = (credentials) => {
  return request.post('/auth/admin-login', {
    username: credentials.username,
    password: credentials.password
  })
}

export const getUserInfo = () => {
  return request.get('/auth/admin/profile')
}

export const logout = () => {
  return request.post('/auth/admin/logout')
}