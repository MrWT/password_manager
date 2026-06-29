const PBKDF2_ITERATIONS = 100000
const TEST_PLAINTEXT = 'password-manager-v1-verification'

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(32))
}

export async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt instanceof Uint8Array ? salt : new Uint8Array(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function createVerification(key) {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(TEST_PLAINTEXT)
  )
  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  }
}

export async function verifyKey(key, verification) {
  try {
    const dec = new TextDecoder()
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(verification.iv)) },
      key,
      base64ToBuffer(verification.ciphertext)
    )
    return dec.decode(decrypted) === TEST_PLAINTEXT
  } catch {
    return false
  }
}

export async function encrypt(key, data) {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  )
  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  }
}

export async function decrypt(key, encrypted) {
  const dec = new TextDecoder()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(encrypted.iv)) },
    key,
    base64ToBuffer(encrypted.ciphertext)
  )
  return JSON.parse(dec.decode(decrypted))
}
