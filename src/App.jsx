import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import IncidentListPage from './pages/IncidentListPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { setUser(null) }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/incidents" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <IncidentListPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/incidents/:id" element={
          <ProtectedRoute>
            <Layout user={user} onLogout={handleLogout}>
              <IncidentDetailPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
