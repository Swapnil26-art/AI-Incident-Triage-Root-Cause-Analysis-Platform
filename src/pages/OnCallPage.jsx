import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Shield, Plus, Trash2, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeUntil(d) {
  if (!d) return ''
  const diff = new Date(d) - Date.now()
  if (diff < 0) return 'Expired'
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`
  return `${hrs}h ${mins}m`
}

const ROLE_COLORS = {
  PRIMARY: 'from-cyan-500 to-blue-500 text-white',
  SECONDARY: 'from-violet-500 to-purple-500 text-white',
  ESCALATION: 'from-amber-500 to-orange-500 text-white',
}

export default function OnCallPage() {
  const [schedules, setSchedules] = useState([])
  const [currentOnCall, setCurrentOnCall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ username: '', role: 'PRIMARY', startTime: '', endTime: '' })
  const { addToast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [all, current] = await Promise.all([
        api.get('/oncall'),
        api.get('/oncall/current').then(r => r.data).catch(() => ({ active: false }))
      ])
      setSchedules(all.data)
      setCurrentOnCall(current)
    } catch (err) {
      addToast('Failed to load on-call schedule', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const addSchedule = async (e) => {
    e.preventDefault()
    try {
      await api.post('/oncall', {
        ...form,
        startTime: form.startTime ? new Date(form.startTime).toISOString().slice(0, 19) : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString().slice(0, 19) : undefined,
      })
      addToast('On-call schedule created', 'success')
      setShowAdd(false)
      setForm({ username: '', role: 'PRIMARY', startTime: '', endTime: '' })
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create schedule', 'error')
    }
  }

  const deleteSchedule = async (id) => {
    try {
      await api.delete(`/oncall/${id}`)
      addToast('Schedule removed', 'success')
      load()
    } catch (err) {
      addToast('Failed to delete schedule', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="w-6 h-6 text-cyan-400" /> On-Call Rotation
          </h1>
          <p className="text-dark-200 mt-1">Manage who is currently on-call and rotation schedules</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      {/* Current On-Call Hero */}
      {currentOnCall && currentOnCall.active && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6 border border-cyan-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.05) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-glow-cyan">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Currently On-Call</p>
              <p className="text-2xl font-bold text-white">{currentOnCall.username}</p>
              <p className="text-sm text-dark-200 mt-1">
                {currentOnCall.role} · {timeUntil(currentOnCall.endTime)} remaining
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark-300">Next rotation</p>
              <p className="text-sm text-white font-medium">{formatDateTime(currentOnCall.endTime)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {!currentOnCall?.active && !loading && (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-dark-200">No one is currently on-call</p>
          <p className="text-dark-400 text-sm mt-1">Add a schedule to assign on-call rotations</p>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={addSchedule} className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-dark-100">New On-Call Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Username</label>
                  <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="input-field" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
                    <option value="PRIMARY" className="bg-dark-800">Primary</option>
                    <option value="SECONDARY" className="bg-dark-800">Secondary</option>
                    <option value="ESCALATION" className="bg-dark-800">Escalation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Start Time</label>
                  <input type="datetime-local" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">End Time</label>
                  <input type="datetime-local" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create Schedule</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-dark-100">All Schedules</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-dark-300">No schedules configured</p>
          </div>
        ) : (
          <AnimatePresence>
            {schedules.map((s, i) => {
              const isActive = s.startTime && s.endTime &&
                new Date(s.startTime) <= Date.now() && new Date(s.endTime) >= Date.now()
              const isPast = new Date(s.endTime) < Date.now()
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 flex items-center gap-4 ${isActive ? 'border-cyan-500/20' : isPast ? 'opacity-50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLE_COLORS[s.role] || ROLE_COLORS.PRIMARY} flex items-center justify-center flex-shrink-0`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{s.username}</span>
                      <span className="status-badge text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s.role}</span>
                      {isActive && <span className="status-badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>}
                      {isPast && <span className="status-badge text-[10px] bg-dark-400/10 text-dark-300 border border-dark-400/20">Past</span>}
                    </div>
                    <p className="text-xs text-dark-300 mt-0.5">
                      {formatDateTime(s.startTime)} → {formatDateTime(s.endTime)}
                    </p>
                  </div>
                  {!isActive && (
                    <button onClick={() => deleteSchedule(s.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-dark-400 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
