import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Sparkles } from 'lucide-react'
import { createIncident } from '../services/incidents'
import { useToast } from './Toast'

const SEVERITIES = ['P1', 'P2', 'P3', 'P4']
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const CATEGORIES = ['NETWORK', 'APPLICATION', 'DATABASE', 'API', 'AUTHENTICATION', 'INFRASTRUCTURE', 'OTHER']
const STATUSES = ['OPEN', 'INVESTIGATING', 'WAITING_APPROVAL']
const SOURCES = ['Manual', 'Monitoring Alert', 'User Report', 'Automated', 'Security Scan']
const SEVERITY_DESC = { P1: 'Critical — Immediate response required', P2: 'High — Significant impact', P3: 'Medium — Moderate impact', P4: 'Low — Minimal impact' }

export default function CreateIncidentModal({ isOpen, onClose, onCreated }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', severity: 'P2', priority: 'MEDIUM',
    category: 'APPLICATION', status: 'OPEN', source: 'Manual',
    affectedComponent: '', assignedTo: '',
  })

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createIncident(form)
      addToast(`Incident ${result.ticketNumber} created successfully`, 'success')
      onCreated?.(result)
      onClose()
      setForm({ title: '', description: '', severity: 'P2', priority: 'MEDIUM', category: 'APPLICATION', status: 'OPEN', source: 'Manual', affectedComponent: '', assignedTo: '' })
    } catch (err) {
      addToast(err.displayMessage || 'Failed to create incident', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">New Incident</h2>
                  <p className="text-xs text-dark-300">Report a new incident</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-dark-200 mb-1.5">Title *</label>
                <input type="text" required value={form.title} onChange={e => update('title', e.target.value)}
                  className="input-field" placeholder="Brief description of the incident" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-dark-200 mb-1.5">Description *</label>
                <textarea required rows={3} value={form.description} onChange={e => update('description', e.target.value)}
                  className="input-field resize-none" placeholder="Detailed description of the issue, impact, and symptoms" />
              </div>

              {/* Severity & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Severity *</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SEVERITIES.map(s => (
                      <button key={s} type="button" onClick={() => { update('severity', s); update('priority', s === 'P1' || s === 'P2' ? 'HIGH' : 'MEDIUM') }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          form.severity === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-dark-800/50 text-dark-300 border border-white/[0.06] hover:border-white/10'
                        }`}>{s}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-dark-400 mt-1">{SEVERITY_DESC[form.severity]}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => update('priority', e.target.value)} className="input-field text-sm">
                    {PRIORITIES.map(p => <option key={p} value={p} className="bg-dark-800">{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Category & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)} className="input-field text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-dark-800">{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Source</label>
                  <select value={form.source} onChange={e => update('source', e.target.value)} className="input-field text-sm">
                    {SOURCES.map(s => <option key={s} value={s} className="bg-dark-800">{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Component & Assignee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Affected Component *</label>
                  <input type="text" required value={form.affectedComponent} onChange={e => update('affectedComponent', e.target.value)}
                    className="input-field" placeholder="e.g. API Gateway" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1.5">Assign To</label>
                  <input type="text" value={form.assignedTo} onChange={e => update('assignedTo', e.target.value)}
                    className="input-field" placeholder="Username (optional)" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" /> Create Incident</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
