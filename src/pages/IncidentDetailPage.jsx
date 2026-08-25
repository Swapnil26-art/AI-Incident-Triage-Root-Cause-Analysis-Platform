import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIncident, updateIncident, addLog, analyzeIncident } from '../services/incidents'

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

export default function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [newLog, setNewLog] = useState('')
  const [logAuthor, setLogAuthor] = useState('')
  const [addingLog, setAddingLog] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    loadIncident()
  }, [id])

  const loadIncident = async () => {
    try {
      const data = await getIncident(id)
      setIncident(data)
    } catch (err) {
      console.error('Failed to load incident:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const analysis = await analyzeIncident(id)
      setIncident(prev => ({
        ...prev,
        status: 'AI_ANALYZED',
        aiRootCause: analysis.root_cause,
        aiSuggestedActions: analysis.suggested_actions,
        aiConfidenceScore: analysis.confidence_score,
        logs: [...(prev.logs || []), {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          message: `AI Analysis completed. Confidence: ${(analysis.confidence_score * 100).toFixed(1)}%`,
          author: 'AI-ANALYSIS',
        }]
      }))
    } catch (err) {
      console.error('Failed to analyze:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const updated = await updateIncident(id, { ...incident, status: newStatus })
      setIncident(updated)
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddLog = async (e) => {
    e.preventDefault()
    if (!newLog.trim()) return
    setAddingLog(true)
    try {
      const updated = await addLog(id, newLog, logAuthor || 'user')
      setIncident(updated)
      setNewLog('')
      setLogAuthor('')
    } catch (err) {
      console.error('Failed to add log:', err)
    } finally {
      setAddingLog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg">Incident not found</p>
        <button onClick={() => navigate('/incidents')} className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Incidents
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/incidents')} className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Incidents
        </button>
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{incident.ticketNumber}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[incident.severity]}`}>
                {incident.severity}
              </span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[incident.status]}`}>
                {formatStatus(incident.status)}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{incident.title}</p>
          </div>
          <div className="flex gap-2">
            {incident.status !== 'AI_ANALYZED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Analyze
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{incident.description}</p>
          </div>

          {incident.aiRootCause && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-sm font-semibold text-purple-800">AI Root Cause Analysis</h3>
                {incident.aiConfidenceScore && (
                  <span className="ml-auto text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    {(incident.aiConfidenceScore * 100).toFixed(1)}% confidence
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-3">{incident.aiRootCause}</p>
              {incident.aiSuggestedActions && (
                <div>
                  <h4 className="text-xs font-semibold text-purple-700 mb-2">Suggested Actions</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">{incident.aiSuggestedActions}</pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Log</h3>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {incident.logs && incident.logs.length > 0 ? (
                incident.logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{log.author || 'System'}</span>
                        <span className="text-gray-400 text-xs">{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-gray-600 mt-0.5">{log.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No logs yet</p>
              )}
            </div>

            <form onSubmit={handleAddLog} className="border-t border-gray-100 pt-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={logAuthor}
                  onChange={(e) => setLogAuthor(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a log entry..."
                  value={newLog}
                  onChange={(e) => setNewLog(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={addingLog || !newLog.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Severity</dt>
                <dd><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${severityStyles[incident.severity]}`}>{incident.severity}</span></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Priority</dt>
                <dd className="text-gray-900 font-medium">{incident.priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{incident.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="text-gray-900">{incident.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Component</dt>
                <dd className="text-gray-900">{incident.affectedComponent}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Assigned To</dt>
                <dd className="text-gray-900">{incident.assignedTo || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(incident.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-900">{formatDate(incident.updatedAt)}</dd>
              </div>
              {incident.resolvedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resolved</dt>
                  <dd className="text-gray-900">{formatDate(incident.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Update Status</h3>
            <div className="space-y-2">
              {['OPEN', 'INVESTIGATING', 'AI_ANALYZED', 'WAITING_APPROVAL', 'RESOLVED', 'ESCALATED', 'CLOSED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={incident.status === status || updatingStatus}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    incident.status === status
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusStyles[status]?.includes('bg-') ? statusStyles[status].split(' ')[0] : 'bg-gray-400'}`}></span>
                  {formatStatus(status)}
                  {incident.status === status && <span className="ml-2 text-xs text-gray-400">(current)</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
