import { useState } from 'react'
import { generatePassword, getPasswordStrength } from '../utils/passwordGen'
import { showToast } from './Toast'

const DEFAULTS = {
  length: 16,
  useUpper: true,
  useLower: true,
  useNumbers: true,
  useSymbols: true,
  excludeAmbiguous: false,
  allowRepeat: true,
  prefix: '',
  suffix: '',
}

const CLIPBOARD_TTL = 30000

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
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-10 rounded ${score >= i * 1.75 ? barColor : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">強度：{label}</span>
    </div>
  )
}

export default function PasswordGenerator() {
  const [opts, setOpts] = useState(DEFAULTS)
  const [password, setPassword] = useState('')

  const set = (key) => (val) => setOpts((prev) => ({ ...prev, [key]: val }))
  const setCheck = (key) => (e) => set(key)(e.target.checked)
  const setText = (key) => (e) => set(key)(e.target.value)

  function handleGenerate() {
    setPassword(generatePassword(opts))
  }

  async function handleCopy() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      showToast('已複製！')
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('')
          showToast('剪貼簿已清除', 'warning', 3000)
        } catch {
          // best-effort
        }
      }, CLIPBOARD_TTL)
    } catch {
      showToast('複製失敗', 'error')
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm'

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-5 text-white">自訂規則密碼生成</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        {/* Length slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">密碼長度</span>
            <span className="text-blue-400 font-mono font-semibold">{opts.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={opts.length}
            onChange={(e) => set('length')(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Character types */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">字元類型</p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              ['useUpper', '大寫字母 (A-Z)'],
              ['useLower', '小寫字母 (a-z)'],
              ['useNumbers', '數字 (0-9)'],
              ['useSymbols', '特殊符號 (!@#…)'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={opts[key]}
                  onChange={setCheck(key)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Other options */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">其他選項</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={opts.excludeAmbiguous}
                onChange={setCheck('excludeAmbiguous')}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-300">排除易混淆字元（0、O、l、1、I）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={opts.allowRepeat}
                onChange={setCheck('allowRepeat')}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-300">允許重複字元</span>
            </label>
          </div>
        </div>

        {/* Prefix / Suffix */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">前綴（選填）</label>
            <input
              value={opts.prefix}
              onChange={setText('prefix')}
              placeholder="e.g. MyApp-"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">後綴（選填）</label>
            <input
              value={opts.suffix}
              onChange={setText('suffix')}
              placeholder="e.g. -2024"
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
        >
          {password ? '重新生成' : '生成密碼'}
        </button>
      </div>

      {/* Result */}
      {password && (
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-gray-300">生成結果</p>
          <div className="bg-gray-800 rounded-lg px-4 py-3 font-mono text-white text-sm break-all select-all">
            {password}
          </div>
          <div className="flex items-center justify-between">
            <StrengthBar password={password} />
            <button
              onClick={handleCopy}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              複製
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
