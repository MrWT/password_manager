import { useState, useEffect } from 'react'

let _setToasts = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _setToasts = setToasts
    return () => {
      _setToasts = null
    }
  }, [])

  return { toasts }
}

export function showToast(message, type = 'success', duration = 2000) {
  if (!_setToasts) return
  const id = Date.now() + Math.random()
  _setToasts((prev) => [...prev, { id, message, type }])
  setTimeout(() => {
    _setToasts?.((prev) => prev.filter((t) => t.id !== id))
  }, duration)
}

const COLOR = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
}

export function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${COLOR[t.type] ?? COLOR.success}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
