import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, AlertTriangle, Brain, Gamepad2, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/ai-chat', label: 'AI Copilot', icon: Brain },
  { path: '/game-day', label: 'Game Day', icon: Gamepad2 },
]

const roleColors = {
  ROLE_ADMIN: 'from-rose-500/20 to-orange-500/10 text-rose-400 border-rose-500/20',
  ROLE_ENGINEER: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/20',
  ROLE_VIEWER: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/20',
}

export default function Layout({ children, user, onLogout }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen flex bg-dark-900">
      <div className="noise-overlay" />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col border-r border-white/[0.06] bg-dark-800/40 backdrop-blur-xl z-10"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-sm font-bold text-white whitespace-nowrap">Incident Triage</h1>
                <p className="text-[10px] text-dark-200 whitespace-nowrap">AI Root Cause Analysis</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-dark-700 border border-white/10 rounded-full flex items-center justify-center text-dark-300 hover:text-white hover:border-cyan-500/30 transition-all z-20"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gradient-to-r ${roleColors[user?.role] || roleColors.ROLE_VIEWER}`}>
                    {user?.role?.replace('ROLE_', '') || 'VIEWER'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
