import request from '../utils/request.js'

// API 基础配置
const API_BASE_URL = import.meta.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api'

/**
 * 获取投票统计数据
 */
export const getVoteStatistics = async () => {
  return await request.get('/vote/statistics')
}

/**
 * 获取节目排行榜
 */
export const getProgramRanking = async () => {
  return await request.get('/program/ranking')
}

/**
 * 获取五维度分析数据
 */
export const getDimensionAnalysis = async () => {
  return await request.get('/vote/dimension-analysis')
}

/**
 * 生成QR码
 */
export const generateQRCode = async (url) => {
  return await request.post('/admin/qrcode', { url })
}

/**
 * 导出投票结果
 */
export const exportResults = async (format = 'excel') => {
  return await request.get(`/admin/export/${format}`, {
    responseType: 'blob'
  })
}

/**
 * 获取投票趋势数据
 */
export const getVoteTrend = async () => {
  return await request.get('/vote/trend')
}

/**
 * 获取概览统计数据
 */
export const getOverviewStatistics = async () => {
  return await request.get('/vote/overview')
}

/**
 * 获取投票分布数据
 */
export const getVoteDistribution = async () => {
  return await request.get('/vote/distribution')
}

/**
 * 获取时间分布数据
 */
export const getTimeDistribution = async () => {
  return await request.get('/vote/time-distribution')
}

/**
 * 获取部门参与度数据
 */
export const getDepartmentParticipation = async () => {
  return await request.get('/vote/department-participation')
}

/**
 * 获取评分热力图数据
 */
export const getScoreHeatmap = async () => {
  return await request.get('/vote/score-heatmap')
}

/**
 * 获取系统设置
 */
export const getSystemSettings = async () => {
  return await request.get('/admin/settings')
}

/**
 * 更新系统设置
 */
export const updateSystemSettings = async (settings) => {
  return await request.put('/admin/settings', settings)
}

/**
 * 获取系统信息
 */
export const getSystemInfo = async () => {
  return await request.get('/admin/system-info')
}

/**
 * 测试连接
 */
export const testConnection = async () => {
  return await request.get('/admin/test-connection')
}

/**
 * 导出数据
 */
export const exportData = async (format) => {
  return await request.get(`/admin/export-data/${format}`, {
    responseType: 'blob'
  })
}

/**
 * 创建备份
 */
export const createBackup = async () => {
  return await request.post('/admin/backup')
}

/**
 * 恢复备份
 */
export const restoreBackup = async (formData) => {
  return await request.post('/admin/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取实时数据（WebSocket相关）
 */
export const getRealTimeData = async () => {
  return await request.get('/vote/realtime')
}

/**
 * 管理员登录
 */
export const adminLogin = async (token) => {
  return await request.post('/admin/login', { token })
}

/**
 * 验证管理员权限
 */
export const verifyAdmin = async () => {
  return await request.get('/admin/verify')
}

// 默认导出所有API方法
const api = {
  getVoteStatistics,
  getProgramRanking,
  getDimensionAnalysis,
  generateQRCode,
  exportResults,
  getVoteTrend,
  getOverviewStatistics,
  getVoteDistribution,
  getTimeDistribution,
  getDepartmentParticipation,
  getScoreHeatmap,
  getSystemSettings,
  updateSystemSettings,
  getSystemInfo,
  testConnection,
  exportData,
  createBackup,
  restoreBackup,
  getRealTimeData,
  adminLogin,
  verifyAdmin
}

export default api