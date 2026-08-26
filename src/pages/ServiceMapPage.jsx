import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Network, ArrowRight, Zap, AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'

const NODE_POSITIONS = {}
const CATEGORIES = {
  'API Gateway': { x: 400, y: 60, color: '#06b6d4' },
  'Payment Service': { x: 200, y: 180, color: '#f43f5e' },
  'Order Service': { x: 400, y: 180, color: '#f59e0b' },
  'User Service': { x: 600, y: 180, color: '#8b5cf6' },
  'Search Service': { x: 800, y: 180, color: '#10b981' },
  'SSO Service': { x: 700, y: 300, color: '#ec4899' },
  'JWT Service': { x: 800, y: 300, color: '#f97316' },
  'Email Service': { x: 300, y: 300, color: '#6366f1' },
  'PostgreSQL Primary': { x: 300, y: 420, color: '#3b82f6' },
  'Redis Cluster': { x: 500, y: 420, color: '#ef4444' },
  'ElasticSearch': { x: 700, y: 420, color: '#eab308' },
  'SMTP Gateway': { x: 200, y: 420, color: '#a855f7' },
  'Load Balancer': { x: 100, y: 180, color: '#14b8a6' },
  'K8s Cluster': { x: 100, y: 300, color: '#06b6d4' },
  'Core Router 01': { x: 100, y: 420, color: '#f59e0b' },
  'Firewall Cluster': { x: 100, y: 540, color: '#ef4444' },
  'CDN Cache Invalidation': { x: 800, y: 540, color: '#8b5cf6' },
  'Log Pipeline': { x: 600, y: 540, color: '#64748b' },
  'Analytics DB': { x: 400, y: 540, color: '#3b82f6' },
  'CI/CD Pipeline': { x: 900, y: 60, color: '#10b981' },
}

function getNodePos(name) {
  return CATEGORIES[name] || { x: 500, y: 300, color: '#6b7280' }
}

export default function ServiceMapPage() {
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const { addToast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/service-map').then(r => r.data)
      setGraph(data)
    } catch (err) {
      addToast('Failed to load service map', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const svgWidth = 1000
  const svgHeight = 620

  const connections = useMemo(() => {
    if (!graph) return []
    return graph.edges.map((edge, i) => {
      const from = getNodePos(edge.source)
      const to = getNodePos(edge.target)
      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2 - 20
      return { ...edge, from, to, midX, midY, key: `${edge.source}-${edge.target}-${i}` }
    })
  }, [graph])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Network className="w-6 h-6 text-cyan-400" /> Service Map
          </h1>
          <p className="text-dark-200 mt-1">Service dependency graph and health status</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {graph && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{graph.totalServices}</p>
              <p className="text-xs text-dark-200">Services</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{graph.totalDependencies}</p>
              <p className="text-xs text-dark-200">Dependencies</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{graph.nodes?.filter(n => n.healthy).length || 0}</p>
              <p className="text-xs text-dark-200">Healthy</p>
            </div>
          </div>
        </div>
      )}

      {/* Graph */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : graph ? (
          <div className="glass-card p-6 overflow-x-auto">
           <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#475569" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {connections.map((conn) => {
              const isSelected = selectedNode && (conn.source === selectedNode || conn.target === selectedNode)
              const errorRate = conn.errorRate || 0
              const strokeColor = errorRate > 3 ? '#f43f5e' : errorRate > 1 ? '#f59e0b' : '#475569'
              return (
                <g key={conn.key}>
                  <line
                    x1={conn.from.x} y1={conn.from.y}
                    x2={conn.to.x} y2={conn.to.y}
                    stroke={isSelected ? '#06b6d4' : strokeColor}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={conn.type === 'async' ? '5,5' : conn.type === 'infra' ? '2,3' : 'none'}
                    markerEnd="url(#arrowhead)"
                    opacity={selectedNode ? (isSelected ? 1 : 0.2) : 0.6}
                    className="transition-all duration-300"
                  />
                  <text
                    x={conn.midX} y={conn.midY}
                    textAnchor="middle"
                    className="fill-dark-400"
                    fontSize="8"
                    opacity={selectedNode ? (isSelected ? 1 : 0) : 0.7}
                  >
                    {conn.latencyMs}ms
                  </text>
                </g>
              )
            })}

            {graph.nodes?.map((node) => {
              const pos = getNodePos(node.id)
              const isSelected = selectedNode === node.id
              const r = isSelected ? 28 : 24
              return (
                <g key={node.id}
                   onClick={() => setSelectedNode(isSelected ? null : node.id)}
                   className="cursor-pointer"
                >
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 4}
                    fill={pos.color} opacity={0.15}
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={pos.x} cy={pos.y} r={r}
                    fill="rgba(15,23,42,0.9)"
                    stroke={isSelected ? '#06b6d4' : node.healthy ? '#10b981' : '#f43f5e'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter={isSelected ? 'url(#glow)' : undefined}
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={pos.x - 8} cy={pos.y + 1}
                    r={3}
                    fill={node.healthy ? '#10b981' : '#f43f5e'}
                  />
                  <text
                    x={pos.x} y={pos.y + r + 14}
                    textAnchor="middle"
                    className="fill-dark-200"
                    fontSize="9"
                    fontWeight="500"
                  >
                    {node.id.length > 16 ? node.id.substring(0, 14) + '…' : node.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      ) : null}

      {/* Selected Node Details */}
      {selectedNode && graph && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">{selectedNode}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-dark-400 hover:text-white text-xs">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-dark-300 uppercase mb-2">Depends On (Outgoing)</h4>
              {graph.edges.filter(e => e.source === selectedNode).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-dark-200 py-1">
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  <span>{e.target}</span>
                  <span className="text-dark-400">· {e.latencyMs}ms</span>
                  <span className="text-dark-400">· {e.type}</span>
                </div>
              ))}
              {graph.edges.filter(e => e.source === selectedNode).length === 0 && (
                <p className="text-xs text-dark-400">No outgoing dependencies</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-dark-300 uppercase mb-2">Used By (Incoming)</h4>
              {graph.edges.filter(e => e.target === selectedNode).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-dark-200 py-1">
                  <ArrowRight className="w-3 h-3 text-amber-400 rotate-180" />
                  <span>{e.source}</span>
                  <span className="text-dark-400">· {e.latencyMs}ms</span>
                  <span className="text-dark-400">· {e.type}</span>
                </div>
              ))}
              {graph.edges.filter(e => e.target === selectedNode).length === 0 && (
                <p className="text-xs text-dark-400">No incoming dependencies</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
