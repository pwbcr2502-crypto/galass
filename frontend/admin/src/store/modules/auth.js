import { login, getUserInfo } from '../../api/auth'

export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('admin_token'),
    userInfo: null
  },
  getters: {
    isLoggedIn: state => {
      const isLoggedIn = !!state.token
      console.log('Auth getter - isLoggedIn:', isLoggedIn, 'token:', state.token)
      return isLoggedIn
    },
    token: state => {
      console.log('Auth getter - token requested:', state.token)
      return state.token
    },
    userInfo: state => state.userInfo
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        localStorage.setItem('admin_token', token)
      } else {
        localStorage.removeItem('admin_token')
      }
    },
    SET_USER_INFO(state, userInfo) {
      state.userInfo = userInfo
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        console.log('Auth store - login attempt with credentials:', credentials)
        const response = await login(credentials)
        console.log('Auth store - login response:', response)
        const { token, user } = response.data
        console.log('Auth store - extracted token:', token)
        console.log('Auth store - extracted user:', user)
        commit('SET_TOKEN', token)
        commit('SET_USER_INFO', user)
        console.log('Auth store - token and user info committed to store')
        return response
      } catch (error) {
        console.error('Auth store - login error:', error)
        throw error
      }
    },
    
    async getUserInfo({ commit }) {
      try {
        const response = await getUserInfo()
        commit('SET_USER_INFO', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    logout({ commit }) {
      commit('SET_TOKEN', null)
      commit('SET_USER_INFO', null)
    }
  }
}