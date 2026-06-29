import { useState, useEffect, useCallback } from 'react'
import { getAllPasswords, addPassword, updatePassword, deletePassword } from '../utils/db'
import { encrypt, decrypt } from '../utils/crypto'
import PasswordForm from './PasswordForm'
import { showToast } from './Toast'

const CLIPBOARD_TTL = 30000

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  showToast('已複製！')
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText('')
      showToast('剪貼簿已清除', 'warning', 3000)
    } catch {
      // clipboard clear is best-effort
    }
  }, CLIPBOARD_TTL)
}

export default function PasswordList({ cryptoKey }) {
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [visibleIds, setVisibleIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const loadPasswords = useCallback(async () => {
    try {
      const raw = await getAllPasswords()
      const decrypted = await Promise.all(
        raw.map(async (item) => {
          try {
            const data = await decrypt(cryptoKey, { iv: item.iv, ciphertext: item.ciphertext })
            return { ...data, id: item.id, createdAt: item.createdAt, updatedAt: item.updatedAt }
          } catch {
            return null
          }
        })
      )
      setEntries(decrypted.filter(Boolean))
    } catch (err) {
      console.error('Failed to load passwords:', err)
    } finally {
      setLoading(false)
    }
  }, [cryptoKey])

  useEffect(() => {
    loadPasswords()
  }, [loadPasswords])

  async function handleSave(data) {
    try {
      const encrypted = await encrypt(cryptoKey, data)
      if (editItem) {
        await updatePassword(editItem.id, encrypted)
        showToast('密碼已更新')
      } else {
        await addPassword(encrypted)
        showToast('密碼已新增')
      }
      await loadPasswords()
      setShowForm(false)
      setEditItem(null)
    } catch (err) {
      showToast('儲存失敗', 'error')
      console.error(err)
    }
  }

  async function handleDelete(id, siteName) {
    if (!window.confirm(`確定要刪除「${siteName}」的密碼嗎？`)) return
    try {
      await deletePassword(id)
      showToast('密碼已刪除')
      await loadPasswords()
    } catch {
      showToast('刪除失敗', 'error')
    }
  }

  function toggleVisible(id) {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openEdit(entry) {
    setEditItem(entry)
    setShowForm(true)
  }

  function openAdd() {
    setEditItem(null)
    setShowForm(true)
  }

  const filtered = entries
    .filter((e) => {
      if (!search) return true
      const q = search.toLowerCase()
      return e.site?.toLowerCase().includes(q) || e.account?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'site') return (a.site ?? '').localeCompare(b.site ?? '')
      if (sortBy === 'favorite') return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
      return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋網站或帳號…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="createdAt">最新</option>
          <option value="site">名稱</option>
          <option value="favorite">常用</option>
        </select>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + 新增
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500 text-center py-16 text-sm">載入中…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {search ? '找不到符合的密碼' : '尚無密碼紀錄，點擊「+ 新增」開始'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              visible={visibleIds.has(entry.id)}
              onToggleVisible={() => toggleVisible(entry.id)}
              onCopy={() => copyToClipboard(entry.password).catch(() => showToast('複製失敗', 'error'))}
              onEdit={() => openEdit(entry)}
              onDelete={() => handleDelete(entry.id, entry.site)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PasswordForm
          initial={editItem}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditItem(null)
          }}
        />
      )}
    </div>
  )
}

function EntryCard({ entry, visible, onToggleVisible, onCopy, onEdit, onDelete }) {
  const masked = '•'.repeat(Math.min(entry.password?.length ?? 8, 20))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {entry.isFavorite && <span className="text-sm">⭐</span>}
            <h3 className="font-medium text-white truncate">{entry.site}</h3>
          </div>
          {entry.url && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{entry.url}</p>
          )}
          <p className="text-sm text-gray-400 mt-1 truncate">{entry.account}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-mono text-sm text-gray-300 select-none">
              {visible ? entry.password : masked}
            </span>
            <button
              onClick={onToggleVisible}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              {visible ? '隱藏' : '顯示'}
            </button>
            <button
              onClick={onCopy}
              className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              複製密碼
            </button>
          </div>
        </div>

        <div className="flex gap-3 shrink-0 mt-0.5">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            編輯
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-400 text-xs transition-colors"
          >
            刪除
          </button>
        </div>
      </div>

      {entry.notes && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">{entry.notes}</p>
      )}
    </div>
  )
}
