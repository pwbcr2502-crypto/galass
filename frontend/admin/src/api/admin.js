import request from './request'

// Dashboard
export const getDashboard = () => {
  return request.get('/admin/dashboard')
}

// Employee management
export const getEmployees = (params) => {
  return request.get('/admin/employees', { params })
}

export const createEmployee = (employee) => {
  return request.post('/admin/employees', employee)
}

export const updateEmployee = (id, employee) => {
  return request.put(`/admin/employees/${id}`, employee)
}

export const deleteEmployee = (id) => {
  return request.delete(`/admin/employees/${id}`)
}

export const importEmployees = (employees) => {
  return request.post('/admin/employees/import', { employees })
}

// Program management
export const getPrograms = (eventId = null) => {
  const params = eventId ? { event_id: eventId } : {}
  return request.get('/admin/programs', { params })
}

export const createProgram = (program) => {
  return request.post('/admin/programs', program)
}

export const updateProgram = (id, program) => {
  return request.put(`/admin/programs/${id}`, program)
}

export const deleteProgram = (id) => {
  return request.delete(`/admin/programs/${id}`)
}

// Voting control
export const controlVoteWindow = (programId, params) => {
  return request.post(`/admin/programs/${programId}/vote-window`, params)
}

// Event management
export const getEvents = () => {
  return request.get('/admin/events')
}

// QR Code
export const generateQRCode = (eventCode) => {
  return request.get(`/admin/qrcode/${eventCode}`)
}

// Data export
export const exportData = (params) => {
  return request.get('/admin/export/votes', { params })
}

// Awards
export const calculateAwards = (eventId) => {
  return request.post('/admin/awards/calculate', { eventId })
}

export const getAwards = (params) => {
  return request.get('/admin/awards', { params })
}

// System health
export const healthCheck = () => {
  return request.get('/admin/health')
}