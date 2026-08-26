import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Sparkles, AlertTriangle, Bot, User, Trash2 } from 'lucide-react'
import { getIncidents } from '../services/incidents'
import api from '../services/api'

const SUGGESTIONS = [
  "What are the most critical open incidents right now?",
  "Analyze the root cause pattern across all network incidents",
  "Which incidents have been open the longest?",
  "Generate a runbook for handling P1 database outages",
  "What components are most frequently affected?",
  "Summarize all incidents requiring immediate attention",
]

export default function AiChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [incidents, setIncidents] = useState([])
  const messagesEnd = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getIncidents().then(setIncidents).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const question = text || input.trim()
    if (!question || loading) return

    setInput('')
    const userMsg = { role: 'user', content: question, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await api.post('/ai/chat', { message: question, incidents: incidents.slice(0, 20) })
      setMessages(prev => [...prev, {
        role: 'assistant', content: response.data.response, time: new Date()
      }])
    } catch {
      try {
        const response = generateLocalResponse(question, incidents)
        setMessages(prev => [...prev, { role: 'assistant', content: response, time: new Date() }])
      } catch (err) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please ensure the backend AI service is running.',
          time: new Date()
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const generateLocalResponse = (question, incs) => {
    const q = question.toLowerCase()
    const open = incs.filter(i => i.status === 'OPEN')
    const p1 = incs.filter(i => i.severity === 'P1')
    const investigating = incs.filter(i => i.status === 'INVESTIGATING')
    const aiAnalyzed = incs.filter(i => i.status === 'AI_ANALYZED')

    if (q.includes('critical') || q.includes('p1') || q.includes('urgent')) {
      if (p1.length === 0) return 'There are currently no P1 critical incidents. The infrastructure appears healthy.'
      return `**P1 Critical Incidents (${p1.length}):**\n\n${p1.map(i => `• **${i.ticketNumber}**: ${i.title}\n  Component: ${i.affectedComponent} | Status: ${i.status}\n  ${i.description.slice(0, 120)}...`).join('\n\n')}\n\n**Recommendation:** Focus on the oldest P1 incident first. Escalate if investigation has been ongoing for more than 2 hours.`
    }

    if (q.includes('open') || q.includes('outstanding')) {
      return `**Open Incidents Summary (${open.length}):**\n\nBy severity: ${['P1','P2','P3','P4'].map(s => `${s}: ${open.filter(i => i.severity === s).length}`).join(' | ')}\n\n${open.slice(0, 5).map(i => `• **${i.ticketNumber}** (${i.severity}) - ${i.affectedComponent}: ${i.title}`).join('\n')}\n\n${open.length > 5 ? `\n...and ${open.length - 5} more open incidents.` : ''}\n\n**Priority:** Address P1/P2 incidents before they escalate. Consider assigning unassigned incidents to available engineers.`
    }

    if (q.includes('network')) {
      const net = incs.filter(i => i.category === 'NETWORK')
      return `**Network Incidents (${net.length}):**\n\n${net.map(i => `• **${i.ticketNumber}** (${i.severity}) - ${i.status}: ${i.title}`).join('\n')}\n\n**Pattern Analysis:** Network incidents tend to affect multiple downstream services. Check for correlated application errors in the last 24 hours. Consider running diagnostic commands on affected network devices.`
    }

    if (q.includes('runbook') || q.includes('how to')) {
      return `**Incident Response Runbook:**\n\n**Step 1: Triage**\n• Confirm the incident is valid and not a false positive\n• Determine severity based on user impact\n• Assign an owner immediately\n\n**Step 2: Investigate**\n• Check monitoring dashboards for anomalies\n• Review recent deployments or changes\n• Examine application and infrastructure logs\n\n**Step 3: Mitigate**\n• If related to a recent deployment, consider rollback\n• Scale up affected services if under load\n• Enable additional logging for debugging\n\n**Step 4: Resolve**\n• Implement the fix\n• Verify the fix in production\n• Monitor for 30 minutes post-fix\n\n**Step 5: Document**\n• Update the incident with root cause\n• Create a post-mortem if P1/P2\n• Add preventive measures to backlog`
    }

    if (q.includes('component') || q.includes('frequently')) {
      const compCounts = {}
      incs.forEach(i => { compCounts[i.affectedComponent] = (compCounts[i.affectedComponent] || 0) + 1 })
      const sorted = Object.entries(compCounts).sort((a, b) => b[1] - a[1])
      return `**Most Affected Components:**\n\n${sorted.slice(0, 8).map(([comp, count], i) => `${i + 1}. **${comp}** - ${count} incidents`).join('\n')}\n\n**Recommendation:** Components with 3+ incidents should be investigated for systemic issues. Consider adding additional monitoring, redundancy, or architectural improvements.`
    }

    if (q.includes('pattern') || q.includes('trend')) {
      const cats = {}
      incs.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1 })
      return `**Incident Pattern Analysis:**\n\n**By Category:**\n${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => `• ${c}: ${n} incidents`).join('\n')}\n\n**By Severity:** P1: ${p1.length} | P2: ${incs.filter(i => i.severity === 'P2').length} | P3: ${incs.filter(i => i.severity === 'P3').length} | P4: ${incs.filter(i => i.severity === 'P4').length}\n\n**Resolution Rate:** ${incs.filter(i => ['RESOLVED','CLOSED'].includes(i.status)).length}/${incs.length} resolved\n\n**Key Insight:** Focus resources on the category with the most P1/P2 incidents. Consider implementing automated alerts for recurring patterns.`
    }

    return `I can help you analyze your ${incs.length} incidents. Here's a quick overview:\n\n• **${p1.length}** P1 Critical incidents\n• **${open.length}** currently open\n• **${investigating.length}** under investigation\n• **${aiAnalyzed.length}** AI analyzed\n\nTry asking me about specific incidents, components, severity levels, or request a runbook for a particular type of outage.`
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-glow-violet">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Copilot</h1>
            <p className="text-dark-300 text-xs">Ask questions about your incidents</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="btn-ghost text-xs flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-4 border border-violet-500/10">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">How can I help?</h2>
              <p className="text-dark-300 text-sm mb-6 max-w-md">Ask me anything about your incidents, or try one of these suggestions</p>
              <div className="grid grid-cols-2 gap-2 max-w-xl">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-dark-200 hover:bg-white/[0.06] hover:border-cyan-500/20 hover:text-white transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white'
                    : 'bg-white/[0.04] border border-white/[0.06] text-dark-100'
                }`}>
                  <div className="whitespace-pre-wrap" style={{ fontSize: '13px' }}>
                    {msg.content.split('\n').map((line, j) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={j} className="font-semibold text-white mt-2 first:mt-0">{line.replace(/\*\*/g, '')}</p>
                      }
                      if (line.startsWith('•')) {
                        return <p key={j} className="ml-2">{line}</p>
                      }
                      return <p key={j}>{line}</p>
                    })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about incidents, patterns, runbooks..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
