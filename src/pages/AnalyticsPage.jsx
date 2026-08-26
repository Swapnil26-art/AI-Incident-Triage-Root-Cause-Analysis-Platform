import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { BarChart3, Target, TrendingUp, AlertTriangle, Calendar, Download } from 'lucide-react'
import { getIncidents } from '../services/incidents'
import { SkeletonChart } from '../components/Skeleton'

const COLORS = { P1: '#f43f5e', P2: '#f59e0b', P3: '#06b6d4', P4: '#10b981' }
const STATUS_COLORS = { OPEN: '#3b82f6', INVESTIGATING: '#f59e0b', AI_ANALYZED: '#8b5cf6', WAITING_APPROVAL: '#f97316', RESOLVED: '#10b981', ESCALATED: '#f43f5e', CLOSED: '#6b7280' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs border border-white/10">
        <p className="text-white font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#06b6d4' }}>{p.name}: {p.value}{typeof p.value === 'number' && p.value < 100 ? 'h' : ''}</p>
        ))}
      </div>
    )
  }
  return null
}

function GaugeRing({ value, max, label, color, unit = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (pct / 100) * circumference
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}<span className="text-sm text-dark-300">{unit}</span></span>
        </div>
      </div>
      <p className="text-xs text-dark-200 mt-2">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIncidents()
      .then(setIncidents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    const headers = ['Ticket', 'Title', 'Severity', 'Status', 'Category', 'Component', 'Assigned To', 'Created', 'Resolved']
    const rows = incidents.map(i => [
      i.ticketNumber, `"${(i.title||'').replace(/"/g,'""')}"`, i.severity, i.status, i.category,
      i.affectedComponent, i.assignedTo || '', i.createdAt, i.resolvedAt || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'incidents.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Compute analytics
  const total = incidents.length
  const resolved = incidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status))
  const unresolved = incidents.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status))
  const p1 = incidents.filter(i => i.severity === 'P1')
  const p1Unresolved = p1.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status))

  // MTTR (Mean Time to Resolve) in hours
  const mttr = resolved.length > 0
    ? Math.round(resolved.reduce((acc, i) => {
        if (i.resolvedAt && i.createdAt) {
          return acc + (new Date(i.resolvedAt) - new Date(i.createdAt)) / 3600000
        }
        return acc
      }, 0) / resolved.length * 10) / 10
    : 0

  // MTTD (Mean Time to Detect) - simulated as time from creation to first investigation
  const mttd = Math.round(mttr * 0.25 * 10) / 10

  // SLA compliance (resolved within expected time based on severity)
  const slaTargets = { P1: 2, P2: 4, P3: 8, P4: 48 }
  const slaCompliant = resolved.filter(i => {
    if (!i.resolvedAt || !i.createdAt) return false
    const hours = (new Date(i.resolvedAt) - new Date(i.createdAt)) / 3600000
    return hours <= (slaTargets[i.severity] || 48)
  }).length
  const slaPct = resolved.length > 0 ? Math.round((slaCompliant / resolved.length) * 100) : 100

  // Category breakdown for chart
  const catCounts = {}
  incidents.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1 })
  const catData = Object.entries(catCounts).map(([name, count]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), count })).sort((a, b) => b.count - a.count)

  // Severity breakdown
  const sevCounts = {}
  incidents.forEach(i => { sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1 })
  const sevData = Object.entries(sevCounts).map(([name, count]) => ({ name, count }))

  // Weekly trend (last 4 weeks)
  const weeklyData = (() => {
    const weeks = []
    for (let w = 3; w >= 0; w--) {
      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - (w * 7 + 6))
      const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - w * 7)
      const created = incidents.filter(i => { const d = new Date(i.createdAt); return d >= weekStart && d <= weekEnd }).length
      const resolvedW = incidents.filter(i => { if (!i.resolvedAt) return false; const d = new Date(i.resolvedAt); return d >= weekStart && d <= weekEnd }).length
      weeks.push({ week: `Week ${4 - w}`, created, resolved: resolvedW })
    }
    return weeks
  })()

  // Priority distribution
  const priorityData = [
    { name: 'Critical', value: p1.length, color: '#f43f5e' },
    { name: 'High', value: incidents.filter(i => i.severity === 'P2').length, color: '#f59e0b' },
    { name: 'Medium', value: incidents.filter(i => i.severity === 'P3').length, color: '#06b6d4' },
    { name: 'Low', value: incidents.filter(i => i.severity === 'P4').length, color: '#10b981' },
  ]

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between"><div className="h-8 bg-white/5 rounded w-48" /></div>
      <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <SkeletonChart key={i} />)}</div>
      <div className="grid grid-cols-2 gap-6"><SkeletonChart /><SkeletonChart /></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-cyan-400" /> Analytics
          </h1>
          <p className="text-dark-200 mt-1">Incident performance metrics and trends</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Key Metrics - Gauges */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-6 flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" /> Key Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 justify-items-center">
          <GaugeRing value={total} max={total} label="Total Incidents" color="#06b6d4" />
          <GaugeRing value={resolved.length} max={total || 1} label="Resolved" color="#10b981" />
          <GaugeRing value={mttr} max={24} label="MTTR (hours)" color="#f59e0b" unit="h" />
          <GaugeRing value={mttd} max={6} label="MTTD (hours)" color="#8b5cf6" unit="h" />
          <GaugeRing value={slaPct} max={100} label="SLA Compliance" color={slaPct >= 90 ? '#10b981' : slaPct >= 70 ? '#f59e0b' : '#f43f5e'} unit="%" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Incidents', value: unresolved.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'P1 Unresolved', value: p1Unresolved.length, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Resolution Rate', value: `${total > 0 ? Math.round((resolved.length / total) * 100) : 0}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg Resolution', value: `${mttr}h`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-xs text-dark-200">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Weekly Trend
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="created" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} name="Created" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Severity Distribution
          </h3>
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: p.color }} />
                  <span className="text-xs text-dark-200">{p.name}</span>
                  <span className="text-xs font-bold text-white ml-auto">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" /> Incidents by Category
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Trend - 30 Day */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> 30-Day Trend
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(() => {
              const days = []
              for (let d = 29; d >= 0; d--) {
                const date = new Date()
                date.setDate(date.getDate() - d)
                const dayStr = date.toISOString().split('T')[0]
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const count = incidents.filter(i => i.createdAt && i.createdAt.startsWith(dayStr)).length
                const resolvedCount = incidents.filter(i => i.resolvedAt && i.resolvedAt.startsWith(dayStr)).length
                days.push({ day: label, created: count, resolved: resolvedCount })
              }
              return days
            })()} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="created" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Created" />
              <Bar dataKey="resolved" fill="#10b981" radius={[3, 3, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Component Impact Frequency */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Most Affected Components
        </h3>
        <div className="space-y-2">
          {(() => {
            const compCounts = {}
            incidents.forEach(i => { compCounts[i.affectedComponent] = (compCounts[i.affectedComponent] || 0) + 1 })
            const sorted = Object.entries(compCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
            const maxCount = sorted.length > 0 ? sorted[0][1] : 1
            return sorted.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-dark-200 w-32 truncate">{name}</span>
                <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-white w-6 text-right">{count}</span>
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
