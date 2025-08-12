import * as adminApi from '../../api/admin'

export default {
  namespaced: true,
  state: {
    dashboard: {
      statistics: {},
      recentActivity: [],
      activePrograms: []
    },
    employees: [],
    programs: [],
    events: [],
    qrCode: null
  },
  mutations: {
    SET_DASHBOARD(state, data) {
      state.dashboard = data
    },
    SET_EMPLOYEES(state, employees) {
      state.employees = employees
    },
    SET_PROGRAMS(state, programs) {
      state.programs = programs
    },
    SET_EVENTS(state, events) {
      state.events = events
    },
    SET_QR_CODE(state, qrCode) {
      state.qrCode = qrCode
    },
    ADD_EMPLOYEE(state, employee) {
      state.employees.unshift(employee)
    },
    UPDATE_EMPLOYEE(state, employee) {
      const index = state.employees.findIndex(e => e.id === employee.id)
      if (index !== -1) {
        state.employees.splice(index, 1, employee)
      }
    },
    DELETE_EMPLOYEE(state, employeeId) {
      const index = state.employees.findIndex(e => e.id === employeeId)
      if (index !== -1) {
        state.employees.splice(index, 1)
      }
    },
    ADD_PROGRAM(state, program) {
      state.programs.push(program)
    },
    UPDATE_PROGRAM(state, program) {
      const index = state.programs.findIndex(p => p.id === program.id)
      if (index !== -1) {
        state.programs.splice(index, 1, program)
      }
    }
  },
  actions: {
    async fetchDashboard({ commit }) {
      try {
        const response = await adminApi.getDashboard()
        commit('SET_DASHBOARD', response.data)
        return response
      } catch (error) {
        if (error.response?.status === 404) {
          commit('SET_DASHBOARD', {
            statistics: {},
            recentActivity: [],
            activePrograms: []
          })
          return { data: { statistics: {}, recentActivity: [], activePrograms: [] } }
        }
        throw error
      }
    },
    
    async fetchEmployees({ commit }, params) {
      try {
        const response = await adminApi.getEmployees(params)
        commit('SET_EMPLOYEES', response.data.employees || [])
        return response
      } catch (error) {
        // If it's just no data, don't throw error
        if (error.response?.status === 404) {
          commit('SET_EMPLOYEES', [])
          return { data: { employees: [], pagination: { total: 0 } } }
        }
        throw error
      }
    },
    
    async createEmployee({ commit }, employee) {
      try {
        const response = await adminApi.createEmployee(employee)
        commit('ADD_EMPLOYEE', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async updateEmployee({ commit }, employee) {
      try {
        const response = await adminApi.updateEmployee(employee.id, employee)
        commit('UPDATE_EMPLOYEE', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async deleteEmployee({ commit }, employeeId) {
      try {
        const response = await adminApi.deleteEmployee(employeeId)
        commit('DELETE_EMPLOYEE', employeeId)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async importEmployees({ dispatch }, employees) {
      try {
        const response = await adminApi.importEmployees(employees)
        await dispatch('fetchEmployees')
        return response
      } catch (error) {
        throw error
      }
    },
    
    async fetchPrograms({ commit }, { eventId } = {}) {
      try {
        const response = await adminApi.getPrograms(eventId)
        commit('SET_PROGRAMS', response.data || [])
        return response
      } catch (error) {
        if (error.response?.status === 404) {
          commit('SET_PROGRAMS', [])
          return { data: [] }
        }
        throw error
      }
    },

    async fetchEvents({ commit }) {
      try {
        const response = await adminApi.getEvents()
        const events = response.data || []
        commit('SET_EVENTS', events)
        return events
      } catch (error) {
        if (error.response?.status === 404) {
          commit('SET_EVENTS', [])
          return []
        }
        throw error
      }
    },
    
    async createProgram({ commit }, program) {
      try {
        const response = await adminApi.createProgram(program)
        commit('ADD_PROGRAM', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async updateProgram({ commit }, program) {
      try {
        const response = await adminApi.updateProgram(program.id, program)
        commit('UPDATE_PROGRAM', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async controlVoteWindow({ dispatch }, { programId, action, duration }) {
      try {
        const response = await adminApi.controlVoteWindow(programId, { action, duration })
        await dispatch('fetchDashboard')
        return response
      } catch (error) {
        throw error
      }
    },
    
    async generateQRCode({ commit }, eventCode) {
      try {
        const response = await adminApi.generateQRCode(eventCode)
        commit('SET_QR_CODE', response.data)
        return response
      } catch (error) {
        throw error
      }
    },
    
    async exportData({ }, params) {
      try {
        return await adminApi.exportData(params)
      } catch (error) {
        throw error
      }
    },
    
    async calculateAwards({ }, eventId) {
      try {
        return await adminApi.calculateAwards(eventId)
      } catch (error) {
        throw error
      }
    }
  }
}