import { createStore } from 'vuex'
import auth from './modules/auth'
import admin from './modules/admin'

export default createStore({
  state: {
    loading: false
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  actions: {
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    }
  },
  modules: {
    auth,
    admin
  }
})