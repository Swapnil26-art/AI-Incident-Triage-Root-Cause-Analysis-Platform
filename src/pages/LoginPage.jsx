import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { login, register } from '../services/auth'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let result
      if (isRegister) {
        result = await register(username, password)
      } else {
        result = await login(username, password)
      }
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result))
      onLogin(result)
    } catch (err) {
      setError(err.response?.data?.error || err.displayMessage || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u, p) => { setUsername(u); setPassword(p) }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center relative overflow-hidden">
      <div className="noise-overlay" />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Incident Triage</h1>
          <p className="text-dark-200 mt-2">AI-Powered Root Cause Analysis</p>
        </div>

        {/* Form card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isRegister ? 'Create Account' : 'Welcome back'}
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-4 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-xs text-dark-300 text-center mb-3">Quick access</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { user: 'admin', pass: 'admin123', label: 'Admin', color: 'hover:border-rose-500/30 hover:bg-rose-500/5' },
                { user: 'engineer', pass: 'engineer123', label: 'Engineer', color: 'hover:border-cyan-500/30 hover:bg-cyan-500/5' },
                { user: 'viewer', pass: 'viewer123', label: 'Viewer', color: 'hover:border-violet-500/30 hover:bg-violet-500/5' },
              ].map((demo) => (
                <button
                  key={demo.user}
                  onClick={() => fillDemo(demo.user, demo.pass)}
                  className={`px-3 py-2 bg-dark-800/50 border border-white/[0.06] rounded-xl text-xs text-dark-200 transition-all duration-200 ${demo.color}`}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
