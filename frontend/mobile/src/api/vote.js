import { api } from './request'

export const voteApi = {
  // 提交投票
  submitVote: (data) => {
    return api.post('/votes', data)
  },
  
  // 获取我的投票记录
  getMyVotes: () => {
    return api.get('/votes/mine')
  },
  
  // 获取节目投票统计
  getProgramVotes: (programId) => {
    return api.get(`/votes/program/${programId}`)
  },
  
  // 获取投票统计
  getVotingStatistics: () => {
    return api.get('/votes/statistics')
  },
  
  // 获取排行榜
  getLeaderboard: (params = {}) => {
    return api.get('/votes/leaderboard', params)
  },
  
  // 检查是否可以投票
  canVote: (programId) => {
    return api.get(`/votes/can-vote/${programId}`)
  },
  
  // 获取投票摘要
  getVotingSummary: () => {
    return api.get('/votes/summary')
  }
}