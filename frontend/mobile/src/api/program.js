import { api } from './request'

export const programApi = {
  // 获取所有节目
  getPrograms: () => {
    return api.get('/programs')
  },
  
  // 获取单个节目详情
  getProgram: (id) => {
    return api.get(`/programs/${id}`)
  },
  
  // 获取当前投票节目
  getCurrentProgram: () => {
    return api.get('/programs/current')
  },
  
  // 获取下一个节目
  getNextProgram: () => {
    return api.get('/programs/next')
  },
  
  // 获取节目时间表
  getSchedule: () => {
    return api.get('/programs/schedule')
  },
  
  // 获取节目投票状态
  getVotingStatus: (id) => {
    return api.get(`/programs/${id}/voting-status`)
  }
}