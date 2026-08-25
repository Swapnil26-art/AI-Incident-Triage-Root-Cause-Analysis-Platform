import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getIncidents } from '../services/incidents'

const severityStyles = {
  P1: 'bg-red-100 text-red-800',
  P2: 'bg-orange-100 text-orange-800',
  P3: 'bg-yellow-100 text-yellow-800',
  P4: 'bg-green-100 text-green-800',
}

const statusStyles = {
  OPEN: 'bg-blue-100 text-blue-800',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800',
  AI_ANALYZED: 'bg-purple-100 text-purple-800',
  WAITING_APPROVAL: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  ESCALATED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

export default function IncidentListPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', severity: '', status: '' })
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    loadIncidents()
  }, [filters])

  const loadIncidents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIncidents(filters)
      setIncidents(data)
    } catch (err) {
      console.error('Failed to load incidents:', err)
      setError('Failed to connect to the server. Please ensure the backend is running and VITE_API_URL is configured correctly.')
    } finally {
      setLoading(false)
    }
  }

  const filteredIncidents = incidents.filter((inc) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inc.ticketNumber?.toLowerCase().includes(q) ||
      inc.title?.toLowerCase().includes(q) ||
      inc.description?.toLowerCase().includes(q) ||
      inc.affectedComponent?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-500 mt-1">{filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severity</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="AI_ANALYZED">AI Analyzed</option>
            <option value="WAITING_APPROVAL">Waiting Approval</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="NETWORK">Network</option>
            <option value="APPLICATION">Application</option>
            <option value="DATABASE">Database</option>
            <option value="API">API</option>
            <option value="AUTHENTICATION">Authentication</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">Connection Error</p>
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button onClick={loadIncidents} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Retry
            </button>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No incidents found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Component</th>
                  <th className="px-6 py-3">Assigned To</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/incidents/${incident.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        {incident.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/incidents/${incident.id}`} className="text-gray-900 hover:text-blue-600 text-sm">
                        {incident.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[incident.status]}`}>
                        {formatStatus(incident.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{incident.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{incident.affectedComponent}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{incident.assignedTo || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(incident.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatStatus(status) {
  return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || ''
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
