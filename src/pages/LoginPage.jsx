import { useState } from 'react'
import { login, register } from '../services/auth'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data
      if (isRegister) {
        data = await register(username, password, 'ROLE_ENGINEER')
      } else {
        data = await login(username, password)
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      onLogin(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Incident Triage</h1>
          <p className="text-gray-400 mt-1">Root Cause Analysis Platform</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center mb-3">Demo accounts:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button onClick={() => { setUsername('admin'); setPassword('admin123') }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1.5 rounded text-center">admin</button>
              <button onClick={() => { setUsername('engineer'); setPassword('engineer123') }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1.5 rounded text-center">engineer</button>
              <button onClick={() => { setUsername('viewer'); setPassword('viewer123') }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1.5 rounded text-center">viewer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
