import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, AlertTriangle, ExternalLink } from 'lucide-react'
import { getIncidents } from '../services/incidents'

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

function formatStatus(s) {
  return (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function IncidentListPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ severity: '', status: '', category: '' })

  useEffect(() => {
    setLoading(true)
    getIncidents(filters)
      .then(setIncidents)
      .catch(err => setError(err.displayMessage || 'Failed to load incidents'))
      .finally(() => setLoading(false))
  }, [filters])

  const filtered = incidents.filter(inc => {
    if (!search) return true
    const q = search.toLowerCase()
    return (inc.ticketNumber || '').toLowerCase().includes(q) ||
      (inc.title || '').toLowerCase().includes(q) ||
      (inc.affectedComponent || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-dark-200 mt-1">{filtered.length} incidents found</p>
        </div>
        <Link to="/incidents/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Incident
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {[
            { key: 'severity', options: ['', 'P1', 'P2', 'P3', 'P4'], labels: ['All Severity', 'P1 Critical', 'P2 High', 'P3 Medium', 'P4 Low'] },
            { key: 'status', options: ['', 'OPEN', 'INVESTIGATING', 'AI_ANALYZED', 'WAITING_APPROVAL', 'RESOLVED', 'ESCALATED', 'CLOSED'],
              labels: ['All Status', 'Open', 'Investigating', 'AI Analyzed', 'Waiting Approval', 'Resolved', 'Escalated', 'Closed'] },
            { key: 'category', options: ['', 'NETWORK', 'APPLICATION', 'DATABASE', 'API', 'AUTHENTICATION', 'INFRASTRUCTURE', 'OTHER'],
              labels: ['All Categories', 'Network', 'Application', 'Database', 'API', 'Authentication', 'Infrastructure', 'Other'] },
          ].map(f => (
            <select
              key={f.key}
              value={filters[f.key]}
              onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
              className="input-field w-auto min-w-[140px]"
            >
              {f.options.map((opt, i) => (
                <option key={opt} value={opt} className="bg-dark-800">{f.labels[i]}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-dark-200 text-sm mb-4">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); getIncidents(filters).then(setIncidents).catch(setError).finally(() => setLoading(false)) }} className="btn-primary">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((inc, i) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/incidents/${inc.id}`}
                  className="block glass-card-hover p-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[inc.status] || 'bg-dark-400'}`} />
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <span className="text-xs font-mono text-cyan-400">{inc.ticketNumber}</span>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">{inc.title}</p>
                        <p className="text-xs text-dark-300 truncate mt-0.5">{inc.affectedComponent}</p>
                      </div>
                      <div className="col-span-1">
                        <span className={`status-badge ${SEVERITY_COLORS[inc.severity]}`}>{inc.severity}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`status-badge ${STATUS_COLORS[inc.status]}`}>{formatStatus(inc.status)}</span>
                      </div>
                      <div className="col-span-2 text-xs text-dark-300">
                        {inc.assignedTo || 'Unassigned'}
                      </div>
                      <div className="col-span-1 text-xs text-dark-400 text-right">
                        {timeAgo(inc.createdAt)}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-dark-400 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && !error && (
            <div className="text-center py-16">
              <p className="text-dark-300 text-lg">No incidents found</p>
              <p className="text-dark-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
