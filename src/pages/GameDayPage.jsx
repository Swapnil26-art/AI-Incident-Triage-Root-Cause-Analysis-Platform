import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { createIncident } from '../services/incidents'

const SCENARIOS = [
  {
    name: 'Network Outage',
    description: 'Cascading network failure affecting multiple regions',
    incidents: [
      { severity: 'P1', category: 'NETWORK', title: 'Core Router Failure', component: 'Core Router 01', description: 'Primary core router experiencing hardware failure, all traffic failing over to secondary' },
      { severity: 'P1', category: 'NETWORK', title: 'BGP Session Flap', component: 'Border Gateway', description: 'BGP sessions flapping across all peering points, causing routing instability' },
      { severity: 'P2', category: 'APPLICATION', title: 'Downstream Service Degradation', component: 'API Gateway', description: 'API gateway latency spiking due to network path instability' },
      { severity: 'P2', category: 'INFRASTRUCTURE', title: 'CDN Cache Invalidation', component: 'CloudFront CDN', description: 'CDN nodes unable to refresh cache from origin servers' },
    ]
  },
  {
    name: 'Database Crisis',
    description: 'Database cluster failure with data replication issues',
    incidents: [
      { severity: 'P1', category: 'DATABASE', title: 'Primary DB Crash', component: 'PostgreSQL Primary', description: 'Primary database node unresponsive, automatic failover triggered' },
      { severity: 'P1', category: 'DATABASE', title: 'Replication Lag Critical', component: 'PostgreSQL Replica', description: 'Read replicas 5+ minutes behind, data inconsistency risk' },
      { severity: 'P2', category: 'APPLICATION', title: 'Connection Pool Exhaustion', component: 'Order Service', description: 'Connection pool exhausted across all application instances' },
    ]
  },
  {
    name: 'Security Incident',
    description: 'Suspected breach with auth system compromise',
    incidents: [
      { severity: 'P1', category: 'AUTHENTICATION', title: 'Suspected Credential Leak', component: 'SSO Service', description: 'Abnormal login patterns detected from multiple geographic regions' },
      { severity: 'P1', category: 'INFRASTRUCTURE', title: 'Unauthorized Access Detected', component: 'WAF', description: 'WAF blocking suspicious requests from known malicious IPs' },
      { severity: 'P2', category: 'AUTHENTICATION', title: 'Token Validation Failures', component: 'JWT Service', description: 'JWT tokens failing validation, users unable to authenticate' },
      { severity: 'P2', category: 'API', title: 'Rate Limiting Engaged', component: 'API Gateway', description: 'Aggressive rate limiting activated due to suspected DDoS' },
    ]
  },
  {
    name: 'Deploy Disaster',
    description: 'Bad deployment causing cascading failures',
    incidents: [
      { severity: 'P1', category: 'APPLICATION', title: 'Production Deployment v3.2.0 Failed', component: 'Payment Service', description: 'New deployment causing 500 errors on all payment processing endpoints' },
      { severity: 'P2', category: 'APPLICATION', title: 'Memory Leak Detected', component: 'User Service', description: 'Memory usage climbing steadily since last deployment, OOM kills imminent' },
      { severity: 'P2', category: 'API', title: 'Breaking API Change', component: 'REST API', description: 'API v3 response format breaking mobile client compatibility' },
    ]
  }
]

export default function GameDayPage() {
  const runningRef = useRef(false)
  const [phase, setPhase] = useState('idle')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [createdIncidents, setCreatedIncidents] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [stats, setStats] = useState({ created: 0, elapsed: 0 })
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const startSimulation = async (scenario) => {
    setSelectedScenario(scenario)
    setPhase('simulating')
    setCreatedIncidents([])
    setCurrentStep(0)
    runningRef.current = true
    startTimeRef.current = Date.now()
    setStats({ created: 0, elapsed: 0 })

    timerRef.current = setInterval(() => {
      setStats(prev => ({ ...prev, elapsed: Math.floor((Date.now() - startTimeRef.current) / 1000) }))
    }, 1000)

    for (let i = 0; i < scenario.incidents.length; i++) {
      if (!runningRef.current) break
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, 2000))
      if (!runningRef.current) break
      try {
        const inc = await createIncident(scenario.incidents[i])
        setCreatedIncidents(prev => [...prev, inc])
        setStats(prev => ({ ...prev, created: prev.created + 1 }))
      } catch (err) {
        console.error('Failed to create incident:', err)
      }
    }

    runningRef.current = false
    setPhase('complete')
    clearInterval(timerRef.current)
  }

  const reset = () => {
    runningRef.current = false
    setPhase('idle')
    setSelectedScenario(null)
    setCreatedIncidents([])
    setCurrentStep(0)
    setStats({ created: 0, elapsed: 0 })
    clearInterval(timerRef.current)
  }

  useEffect(() => () => { clearInterval(timerRef.current); runningRef.current = false }, [])

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400" />
            Game Day Simulator
          </h1>
          <p className="text-dark-200 mt-1">Simulate cascading incidents to test your triage workflow</p>
        </div>
        {phase !== 'idle' && (
          <button onClick={reset} className="btn-ghost flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {phase === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((scenario, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -2 }}
              onClick={() => startSimulation(scenario)}
              className="glass-card-hover p-6 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/10">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">{scenario.name}</h3>
                  <p className="text-sm text-dark-300 mb-3">{scenario.description}</p>
                  <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span>{scenario.incidents.length} incidents</span>
                    <span>·</span>
                    <span>{scenario.incidents.filter(j => j.severity === 'P1').length} P1 Critical</span>
                    <span>·</span>
                    <span>~{scenario.incidents.length * 2}s simulation</span>
                  </div>
                </div>
                <Play className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {(phase === 'simulating' || phase === 'complete') && (
        <div className="space-y-6">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${phase === 'simulating' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="text-sm font-medium text-white">
                    {phase === 'simulating' ? 'Simulating...' : 'Complete'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-200">
                  <Clock className="w-4 h-4" /> {formatTime(stats.elapsed)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-dark-200">
                  <span className="text-cyan-400 font-bold">{stats.created}</span> created
                </span>
                <span className="text-dark-200">
                  Step <span className="text-white font-bold">{Math.min(currentStep + 1, selectedScenario?.incidents.length || 0)}</span>/{selectedScenario?.incidents.length || 0}
                </span>
              </div>
            </div>

            <div className="mt-3 h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                animate={{ width: `${(stats.created / (selectedScenario?.incidents.length || 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-dark-100">Incidents Created</h3>
            <AnimatePresence>
              {createdIncidents.map((inc, i) => (
                <motion.div
                  key={inc.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">{inc.ticketNumber}</span>
                      <span className={`status-badge text-[10px] ${
                        inc.severity === 'P1' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>{inc.severity}</span>
                    </div>
                    <p className="text-sm text-white mt-0.5">{inc.title}</p>
                    <p className="text-xs text-dark-300">{inc.affectedComponent}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {createdIncidents.length === 0 && phase === 'simulating' && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                <p className="text-dark-300 text-sm mt-3">Generating incidents...</p>
              </div>
            )}
          </div>

          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 text-center"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Simulation Complete</h3>
              <p className="text-dark-200 text-sm mb-4">
                {createdIncidents.length} incidents generated in {formatTime(stats.elapsed)}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={reset} className="btn-primary">Try Another Scenario</button>
                <a href="/incidents" className="btn-ghost">View All Incidents</a>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
