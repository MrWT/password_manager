import { useState, useEffect } from 'react'
import { generateSalt, deriveKey, createVerification, verifyKey } from '../utils/crypto'
import { getConfig, saveConfig } from '../utils/db'

export default function Login({ onUnlock }) {
  const [isFirstTime, setIsFirstTime] = useState(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getConfig().then((config) => setIsFirstTime(!config))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isFirstTime) {
        if (password.length < 8) {
          setError('主密碼至少需要 8 個字元')
          return
        }
        if (password !== confirm) {
          setError('兩次輸入的密碼不一致')
          return
        }
        const salt = await generateSalt()
        const key = await deriveKey(password, salt)
        const verification = await createVerification(key)
        await saveConfig({ salt: Array.from(salt), verification })
        onUnlock(key)
      } else {
        const config = await getConfig()
        const salt = new Uint8Array(config.salt)
        const key = await deriveKey(password, salt)
        const valid = await verifyKey(key, config.verification)
        if (!valid) {
          setError('密碼錯誤，請重試')
          return
        }
        onUnlock(key)
      }
    } catch (err) {
      console.error(err)
      setError('發生未知錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  if (isFirstTime === null) return null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none">🔐</div>
          <h1 className="text-2xl font-bold text-white">密碼管理器</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isFirstTime ? '首次使用，請設定您的主密碼' : '輸入主密碼以解鎖'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">主密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isFirstTime ? '設定主密碼（至少 8 字元）' : '輸入主密碼'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {isFirstTime && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">確認主密碼</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次輸入主密碼"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {loading ? '處理中…' : isFirstTime ? '建立主密碼' : '解鎖'}
          </button>

          {isFirstTime && (
            <p className="text-gray-500 text-xs text-center">
              主密碼不會儲存於任何地方。請務必牢記，遺忘後資料將無法恢復。
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
