import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import { Activity, AlertTriangle, Brain, CheckCircle2, Clock, Flame, TrendingUp, RefreshCw } from 'lucide-react'
import { getDashboardMetrics, getIncidentsByCategory, getIncidentsBySeverity, getIncidentsByStatus } from '../services/dashboard'
import { getIncidents } from '../services/incidents'

const SEVERITY_COLORS = { P1: '#f43f5e', P2: '#f59e0b', P3: '#06b6d4', P4: '#10b981' }
const STATUS_COLORS = {
  OPEN: '#3b82f6', INVESTIGATING: '#f59e0b', AI_ANALYZED: '#8b5cf6',
  WAITING_APPROVAL: '#f97316', RESOLVED: '#10b981', ESCALATED: '#f43f5e', CLOSED: '#6b7280'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs border border-white/10">
        <p className="text-white font-medium">{label || payload[0]?.name}</p>
        <p className="text-cyan-400">{payload[0]?.value} incidents</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [category, setCategory] = useState([])
  const [severity, setSeverity] = useState([])
  const [status, setStatus] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, cat, sev, sta, inc] = await Promise.all([
        getDashboardMetrics(), getIncidentsByCategory(), getIncidentsBySeverity(),
        getIncidentsByStatus(), getIncidents()
      ])
      setMetrics(m); setCategory(cat); setSeverity(sev); setStatus(sta); setIncidents(inc)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const timeData = (() => {
    if (!incidents.length) return []
    const hours = {}
    for (let i = 23; i >= 0; i--) {
      const d = new Date(); d.setHours(d.getHours() - i)
      hours[d.getHours()] = 0
    }
    incidents.forEach(inc => {
      const h = new Date(inc.createdAt).getHours()
      if (h in hours) hours[h]++
    })
    return Object.entries(hours).map(([h, c]) => ({ hour: `${h}:00`, incidents: c }))
  })()

  const stats = [
    { label: 'Total Incidents', value: metrics?.total_incidents || 0, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'after:bg-cyan-500' },
    { label: 'Open', value: metrics?.open_incidents || 0, icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'after:bg-blue-500' },
    { label: 'Investigating', value: metrics?.investigating_incidents || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'after:bg-amber-500' },
    { label: 'P1 Critical', value: metrics?.p1_incidents || 0, icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'after:bg-rose-500' },
    { label: 'AI Analyzed', value: metrics?.ai_analyzed_incidents || 0, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10', glow: 'after:bg-violet-500' },
    { label: 'Resolved', value: metrics?.resolved_incidents || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'after:bg-emerald-500' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-dark-200 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
        <p className="text-dark-200 text-sm mb-4">{error}</p>
        <button onClick={loadData} className="btn-primary">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-200 mt-1">Real-time incident overview and metrics</p>
        </div>
        <button onClick={loadData} className="btn-ghost flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-stagger">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              whileHover={{ y: -2 }}
              className="metric-card group cursor-default"
            >
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-dark-200 mt-0.5">{s.label}</p>
              <div className={`absolute top-0 right-0 w-20 h-20 ${s.glow} rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity`} />
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">By Severity</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severity} dataKey="count" nameKey="severity" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {severity.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {severity.map(s => (
              <div key={s.severity} className="flex items-center gap-1.5 text-xs text-dark-200">
                <div className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[s.severity] }} />
                {s.severity} ({s.count})
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">By Status</h3>
          <div className="space-y-3">
            {status.map(s => {
              const total = metrics?.total_incidents || 1
              const pct = Math.round((s.count / total) * 100)
              return (
                <div key={s.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-200">{s.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <span className="text-white font-medium">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: STATUS_COLORS[s.status] || '#6b7280' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-4">By Category</h3>
          <div className="space-y-3">
            {category.map(c => {
              const maxCount = Math.max(...category.map(x => x.count), 1)
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-xs text-dark-200 w-24 truncate">{c.category.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-white w-4 text-right">{c.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            24-Hour Activity
          </h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeData}>
              <defs>
                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="incidents" stroke="#06b6d4" strokeWidth={2} fill="url(#colorIncidents)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Severity Bar Chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4">Severity Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severity} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="severity" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {severity.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
