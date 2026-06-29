const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

const AMBIGUOUS = new Set(['0', 'O', 'l', '1', 'I'])

function randomChar(pool) {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return pool[arr[0] % pool.length]
}

export function generatePassword(options) {
  const {
    length = 16,
    useUpper = true,
    useLower = true,
    useNumbers = true,
    useSymbols = true,
    excludeAmbiguous = false,
    allowRepeat = true,
    prefix = '',
    suffix = '',
  } = options

  const filter = (chars) =>
    excludeAmbiguous ? chars.split('').filter((c) => !AMBIGUOUS.has(c)).join('') : chars

  const sets = [
    useUpper && filter(CHARS.upper),
    useLower && filter(CHARS.lower),
    useNumbers && filter(CHARS.numbers),
    useSymbols && CHARS.symbols,
  ].filter(Boolean)

  if (!sets.length) return ''

  const pool = sets.join('')
  const targetLen = length - prefix.length - suffix.length
  if (targetLen <= 0) return prefix + suffix

  const result = []

  // Guarantee at least one char from each required set
  for (const set of sets) {
    if (result.length < targetLen) result.push(randomChar(set))
  }

  // Fill remaining slots
  let attempts = 0
  while (result.length < targetLen) {
    const ch = randomChar(pool)
    if (!allowRepeat && result.includes(ch)) {
      if (++attempts > 10000) break
      continue
    }
    result.push(ch)
    attempts = 0
  }

  // Fisher-Yates shuffle using CSPRNG
  for (let i = result.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    const j = arr[0] % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return prefix + result.join('') + suffix
}

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '無', color: 'gray' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: '弱', color: 'red' }
  if (score <= 4) return { score, label: '中', color: 'yellow' }
  if (score <= 5) return { score, label: '強', color: 'blue' }
  return { score, label: '非常強', color: 'green' }
}
