import api from './api'

export const getDashboardMetrics = async () => {
  const response = await api.get('/dashboard')
  return response.data
}

export const getIncidentsByCategory = async () => {
  const response = await api.get('/dashboard/incidents-by-category')
  return response.data
}

export const getIncidentsBySeverity = async () => {
  const response = await api.get('/dashboard/incidents-by-severity')
  return response.data
}

export const getIncidentsByStatus = async () => {
  const response = await api.get('/dashboard/incidents-by-status')
  return response.data
}

export const getSlaCompliance = async () => {
  const response = await api.get('/dashboard/sla')
  return response.data
}

export const getReportSummary = async () => {
  const response = await api.get('/dashboard/reports/summary')
  return response.data
}
