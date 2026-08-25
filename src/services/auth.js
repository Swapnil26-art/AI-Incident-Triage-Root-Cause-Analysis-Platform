import api from './api'

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export const register = async (username, password, role = 'ROLE_VIEWER') => {
  const response = await api.post('/auth/register', { username, password, role })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
