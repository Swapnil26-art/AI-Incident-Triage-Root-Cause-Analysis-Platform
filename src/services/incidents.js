import api from './api'

export const getIncidents = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category) params.append('category', filters.category)
  if (filters.severity) params.append('severity', filters.severity)
  if (filters.status) params.append('status', filters.status)
  const response = await api.get(`/incidents?${params.toString()}`)
  return response.data
}

export const getIncident = async (id) => {
  const response = await api.get(`/incidents/${id}`)
  return response.data
}

export const createIncident = async (incident) => {
  const response = await api.post('/incidents', incident)
  return response.data
}

export const updateIncident = async (id, incident) => {
  const response = await api.put(`/incidents/${id}`, incident)
  return response.data
}

export const deleteIncident = async (id) => {
  await api.delete(`/incidents/${id}`)
}

export const updateIncidentStatus = async (id, status) => {
  const response = await api.patch(`/incidents/${id}/status`, { status })
  return response.data
}

export const addIncidentLog = async (incidentId, message, author) => {
  const response = await api.post(`/incidents/${incidentId}/logs`, { message, author })
  return response.data
}

export const getIncidentLogs = async (incidentId) => {
  const response = await api.get(`/incidents/${incidentId}/logs`)
  return response.data
}

export const analyzeIncident = async (id) => {
  const response = await api.post(`/ai/analyze/${id}`)
  return response.data
}

export const getAnalysis = async (id) => {
  const response = await api.get(`/ai/analyze/${id}`)
  return response.data
}

export const sendAiChat = async (message) => {
  const response = await api.post('/ai/chat', { message })
  return response.data
}
