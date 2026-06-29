import { useState } from 'react'
import { getPasswordStrength } from '../utils/passwordGen'

const inputClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

function StrengthBar({ password }) {
  if (!password) return null
  const { score, label, color } = getPasswordStrength(password)
  const barColor =
    color === 'red'
      ? 'bg-red-500'
      : color === 'yellow'
        ? 'bg-yellow-500'
        : color === 'blue'
          ? 'bg-blue-500'
          : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded ${score >= i * 1.75 ? barColor : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">強度：{label}</span>
    </div>
  )
}

export default function PasswordForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    site: initial?.site ?? '',
    url: initial?.url ?? '',
    account: initial?.account ?? '',
    password: initial?.password ?? '',
    notes: initial?.notes ?? '',
    isFavorite: initial?.isFavorite ?? false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 px-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{initial ? '編輯密碼' : '新增密碼'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="網站名稱 *">
            <input
              required
              value={form.site}
              onChange={set('site')}
              placeholder="e.g. Google"
              className={inputClass}
            />
          </Field>

          <Field label="網址">
            <input
              value={form.url}
              onChange={set('url')}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>

          <Field label="帳號 / Email *">
            <input
              required
              value={form.account}
              onChange={set('account')}
              placeholder="your@email.com"
              className={inputClass}
              autoComplete="off"
            />
          </Field>

          <Field label="密碼 *">
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="輸入密碼"
                className={inputClass + ' pr-14'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                {showPassword ? '隱藏' : '顯示'}
              </button>
            </div>
            <StrengthBar password={form.password} />
          </Field>

          <Field label="備註">
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="選填"
              rows={2}
              className={inputClass + ' resize-none'}
            />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={set('isFavorite')}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-gray-300">標記為常用 ⭐</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? '儲存中…' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
