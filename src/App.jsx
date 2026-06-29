import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login'
import PasswordList from './components/PasswordList'
import PasswordGenerator from './components/PasswordGenerator'
import { Toast, useToast } from './components/Toast'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000

export default function App() {
  const [cryptoKey, setCryptoKey] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const { toasts } = useToast()

  const handleUnlock = useCallback((key) => {
    setCryptoKey(key)
    setLastActivity(Date.now())
  }, [])

  const handleLock = useCallback(() => {
    setCryptoKey(null)
  }, [])

  // Reset idle timer on user interaction
  useEffect(() => {
    if (!cryptoKey) return
    const reset = () => setLastActivity(Date.now())
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }))
    return () => events.forEach((ev) => window.removeEventListener(ev, reset))
  }, [cryptoKey])

  // Auto-lock check
  useEffect(() => {
    if (!cryptoKey) return
    const id = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) handleLock()
    }, 30_000)
    return () => clearInterval(id)
  }, [cryptoKey, lastActivity, handleLock])

  if (!cryptoKey) {
    return (
      <>
        <Login onUnlock={handleUnlock} />
        <Toast toasts={toasts} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 select-none">
          <span className="text-xl">🔐</span>
          <h1 className="font-bold text-base">密碼管理器</h1>
        </div>
        <button
          onClick={handleLock}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <span>🔒</span>
          <span>鎖定</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 flex sticky top-[53px] z-20">
        {[
          { id: 'list', label: '我的密碼' },
          { id: 'generate', label: '生成密碼' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'list' && <PasswordList cryptoKey={cryptoKey} />}
        {activeTab === 'generate' && <PasswordGenerator />}
      </main>

      <Toast toasts={toasts} />
    </div>
  )
}
