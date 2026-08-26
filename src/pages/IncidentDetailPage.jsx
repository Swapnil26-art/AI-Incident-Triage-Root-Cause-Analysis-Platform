import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, Clock, MessageSquare, AlertTriangle, Sparkles, Send, ChevronRight, FileText } from 'lucide-react'
import { getIncident, updateIncidentStatus, addIncidentLog, analyzeIncident } from '../services/incidents'
import { useToast } from '../components/Toast'
import api from '../services/api'

const SEVERITY_COLORS = {
  P1: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  P2: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  P3: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  P4: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
}
const STATUS_COLORS = {
  OPEN: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  INVESTIGATING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  AI_ANALYZED: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  WAITING_APPROVAL: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  ESCALATED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  CLOSED: 'bg-dark-400/10 text-dark-300 border border-dark-400/20',
}
const STATUS_DOT = {
  OPEN: 'bg-blue-400', INVESTIGATING: 'bg-amber-400', AI_ANALYZED: 'bg-violet-400',
  WAITING_APPROVAL: 'bg-orange-400', RESOLVED: 'bg-emerald-400', ESCALATED: 'bg-rose-400', CLOSED: 'bg-dark-400',
}

function formatStatus(s) { return (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) }
function formatDate(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '' }

export default function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [logMessage, setLogMessage] = useState('')
  const [logAuthor, setLogAuthor] = useState('')
  const [addingLog, setAddingLog] = useState(false)

  const loadIncident = async () => {
    try {
      const data = await getIncident(id)
      setIncident(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIncident() }, [id])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const result = await analyzeIncident(id)
      setIncident(prev => ({
        ...prev,
        status: 'AI_ANALYZED',
        aiRootCause: result.root_cause,
        aiSuggestedActions: result.suggested_actions,
        aiConfidenceScore: result.confidence_score,
        logs: [...(prev.logs || []), {
          id: Date.now(), timestamp: new Date().toISOString(),
          message: `AI Analysis completed. Confidence: ${(result.confidence_score * 100).toFixed(1)}%`,
          author: 'AI-ANALYSIS'
        }]
      }))
    } catch (err) { addToast('AI analysis failed. Please try again.', 'error') }
    finally { setAnalyzing(false) }
  }

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const updated = await updateIncidentStatus(id, newStatus)
      setIncident(updated)
      addToast(`Status updated to ${formatStatus(newStatus)}`, 'success')
    } catch (err) { addToast('Failed to update status', 'error') }
    finally { setUpdatingStatus(false) }
  }

  const handleAddLog = async (e) => {
    e.preventDefault()
    if (!logMessage.trim()) return
    setAddingLog(true)
    try {
      const updated = await addIncidentLog(id, logMessage, logAuthor || 'user')
      setIncident(updated)
      setLogMessage('')
      setLogAuthor('')
      addToast('Log entry added', 'success')
    } catch (err) { addToast('Failed to add log entry', 'error') }
    finally { setAddingLog(false) }
  }

  const downloadPostMortem = async () => {
    try {
      const data = await api.get(`/incidents/${id}/postmortem`).then(r => r.data)
      const blob = new Blob([data.markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `postmortem-${data.ticket_number || id}.md`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Post-mortem report downloaded', 'success')
    } catch (err) {
      addToast('Failed to generate post-mortem', 'error')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  )

  if (!incident) return (
    <div className="text-center py-16">
      <p className="text-dark-200 text-lg">Incident not found</p>
      <button onClick={() => navigate('/incidents')} className="btn-primary mt-4">Back to Incidents</button>
    </div>
  )

  const timelineEvents = []
  if (incident.createdAt) timelineEvents.push({ type: 'created', time: incident.createdAt, message: 'Incident created', author: 'system' })
  if (incident.logs) {
    incident.logs.forEach(log => timelineEvents.push({ type: log.author === 'AI-ANALYSIS' ? 'ai' : 'log', time: log.timestamp, message: log.message, author: log.author }))
  }
  if (incident.resolvedAt) timelineEvents.push({ type: 'resolved', time: incident.resolvedAt, message: 'Incident resolved', author: 'system' })
  timelineEvents.sort((a, b) => new Date(b.time) - new Date(a.time))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/incidents')} className="flex items-center gap-1 text-sm text-dark-300 hover:text-cyan-400 transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Incidents
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono">{incident.ticketNumber}</h1>
            <span className={`status-badge ${SEVERITY_COLORS[incident.severity]}`}>{incident.severity}</span>
            <span className={`status-badge ${STATUS_COLORS[incident.status]}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[incident.status]}`} />
              {formatStatus(incident.status)}
            </span>
          </div>
          <p className="text-dark-200 mt-1">{incident.title}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPostMortem} className="btn-ghost flex items-center gap-2">
            <FileText className="w-4 h-4" /> Post-Mortem
          </button>
          {incident.status !== 'AI_ANALYZED' && incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 shadow-glow-violet">
              {analyzing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> AI Analyze</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-3">Description</h3>
            <p className="text-dark-200 text-sm leading-relaxed">{incident.description}</p>
          </div>

          {/* AI Analysis */}
          {incident.aiRootCause && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-6 border border-violet-500/20"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-violet-300">AI Root Cause Analysis</h3>
                  {incident.aiConfidenceScore && (
                    <span className="ml-auto text-xs font-medium text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                      {(incident.aiConfidenceScore * 100).toFixed(1)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm text-dark-100 mb-4 leading-relaxed">{incident.aiRootCause}</p>
                {incident.aiSuggestedActions && (
                  <div>
                    <h4 className="text-xs font-semibold text-violet-400/80 mb-2 uppercase tracking-wider">Suggested Actions</h4>
                    <pre className="text-xs text-dark-200 whitespace-pre-wrap font-sans leading-relaxed bg-dark-800/30 rounded-xl p-4 border border-white/[0.04]">
                      {incident.aiSuggestedActions}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Activity Log */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Activity Log
            </h3>
            <div className="space-y-0 max-h-96 overflow-y-auto mb-4">
              {timelineEvents.length === 0 ? (
                <p className="text-dark-400 text-sm text-center py-8">No activity yet</p>
              ) : (
                timelineEvents.map((evt, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        evt.type === 'ai' ? 'bg-violet-400 shadow-glow-violet' :
                        evt.type === 'created' ? 'bg-cyan-400' :
                        evt.type === 'resolved' ? 'bg-emerald-400' :
                        'bg-dark-400'
                      }`} />
                      {i < timelineEvents.length - 1 && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{evt.author || 'System'}</span>
                        <span className="text-[10px] text-dark-400">{formatDate(evt.time)}</span>
                      </div>
                      <p className="text-xs text-dark-200 mt-0.5 leading-relaxed">{evt.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddLog} className="border-t border-white/[0.06] pt-4 space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={logAuthor}
                onChange={(e) => setLogAuthor(e.target.value)}
                className="input-field text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a log entry..."
                  value={logMessage}
                  onChange={(e) => setLogMessage(e.target.value)}
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={addingLog || !logMessage.trim()}
                  className="btn-primary px-4 disabled:opacity-40 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Severity', value: <span className={`status-badge ${SEVERITY_COLORS[incident.severity]}`}>{incident.severity}</span> },
                { label: 'Priority', value: incident.priority },
                { label: 'Category', value: incident.category },
                { label: 'Source', value: incident.source },
                { label: 'Component', value: incident.affectedComponent },
                { label: 'Assigned To', value: incident.assignedTo || 'Unassigned' },
                { label: 'Created', value: formatDate(incident.createdAt) },
                { label: 'Updated', value: formatDate(incident.updatedAt) },
                incident.resolvedAt && { label: 'Resolved', value: formatDate(incident.resolvedAt) },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-dark-300">{item.label}</span>
                  <span className="text-white text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Update Status</h3>
            <div className="space-y-1.5">
              {['OPEN', 'INVESTIGATING', 'AI_ANALYZED', 'WAITING_APPROVAL', 'RESOLVED', 'ESCALATED', 'CLOSED'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={incident.status === status || updatingStatus}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 group ${
                    incident.status === status
                      ? 'bg-white/5 text-dark-400 cursor-not-allowed'
                      : 'hover:bg-white/5 text-dark-200 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  {formatStatus(status)}
                  {incident.status === status && <span className="ml-auto text-[10px] text-dark-400">current</span>}
                  {incident.status !== status && <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
