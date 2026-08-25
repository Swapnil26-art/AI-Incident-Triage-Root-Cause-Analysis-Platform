import { useState, useEffect } from 'react'
import { getDashboardMetrics, getIncidentsByCategory, getIncidentsBySeverity, getIncidentsByStatus } from '../services/dashboard'

const severityColors = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-500',
  P4: 'bg-green-500',
}

const statusColors = {
  OPEN: 'bg-blue-500',
  INVESTIGATING: 'bg-yellow-500',
  AI_ANALYZED: 'bg-purple-500',
  WAITING_APPROVAL: 'bg-orange-500',
  RESOLVED: 'bg-green-500',
  ESCALATED: 'bg-red-500',
  CLOSED: 'bg-gray-500',
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [byCategory, setByCategory] = useState([])
  const [bySeverity, setBySeverity] = useState([])
  const [byStatus, setByStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [m, cat, sev, stat] = await Promise.all([
        getDashboardMetrics(),
        getIncidentsByCategory(),
        getIncidentsBySeverity(),
        getIncidentsByStatus(),
      ])
      setMetrics(m)
      setByCategory(cat)
      setBySeverity(sev)
      setByStatus(stat)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Failed to connect to the server. Please ensure the backend is running and VITE_API_URL is configured correctly.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Incidents', value: metrics?.total_incidents || 0, color: 'bg-blue-500', textColor: 'text-blue-500' },
    { label: 'Open', value: metrics?.open_incidents || 0, color: 'bg-blue-500', textColor: 'text-blue-500' },
    { label: 'Investigating', value: metrics?.investigating_incidents || 0, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: 'P1 Critical', value: metrics?.p1_incidents || 0, color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'AI Analyzed', value: metrics?.ai_analyzed_incidents || 0, color: 'bg-purple-500', textColor: 'text-purple-500' },
    { label: 'Resolved', value: metrics?.resolved_incidents || 0, color: 'bg-green-500', textColor: 'text-green-500' },
  ]

  const maxCategoryCount = Math.max(...byCategory.map(c => c.count), 1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time incident overview and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Incidents by Severity</h3>
          <div className="space-y-3">
            {bySeverity.map((item) => (
              <div key={item.severity} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-gray-700">{item.severity}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${severityColors[item.severity] || 'bg-gray-400'} flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max((item.count / (metrics?.total_incidents || 1)) * 100, 8)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Incidents by Status</h3>
          <div className="space-y-3">
            {byStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span className="w-8 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(item.status) }}></span>
                <span className="text-sm text-gray-700 flex-1">{formatStatus(item.status)}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Incidents by Category</h3>
          <div className="space-y-3">
            {byCategory.map((item) => (
              <div key={item.category} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-28 truncate">{item.category}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Severity Distribution</h3>
        <div className="flex items-end gap-8 justify-center h-40">
          {bySeverity.map((item) => (
            <div key={item.severity} className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{item.count}</span>
              <div
                className={`w-16 rounded-t-lg ${severityColors[item.severity] || 'bg-gray-400'}`}
                style={{ height: `${Math.max((item.count / (metrics?.total_incidents || 1)) * 120, 4)}px` }}
              ></div>
              <span className="text-xs font-medium text-gray-600">{item.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status) {
  const hexColors = {
    OPEN: '#3b82f6',
    INVESTIGATING: '#eab308',
    AI_ANALYZED: '#a855f7',
    WAITING_APPROVAL: '#f97316',
    RESOLVED: '#22c55e',
    ESCALATED: '#ef4444',
    CLOSED: '#6b7280',
  }
  return hexColors[status] || '#9CA3AF'
}

function formatStatus(status) {
  return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || ''
}
