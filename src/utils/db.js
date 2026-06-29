const DB_NAME = 'PasswordManagerDB'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('passwords')) {
        const store = db.createObjectStore('passwords', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getConfig() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readonly')
    const request = tx.objectStore('config').get('master')
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function saveConfig(config) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite')
    const request = tx.objectStore('config').put({ id: 'master', ...config })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllPasswords() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('passwords', 'readonly')
    const request = tx.objectStore('passwords').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addPassword(encrypted) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('passwords', 'readwrite')
    const request = tx.objectStore('passwords').add({
      ...encrypted,
      createdAt: Date.now(),
    })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function updatePassword(id, encrypted) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('passwords', 'readwrite')
    const store = tx.objectStore('passwords')
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const existing = getReq.result
      const putReq = store.put({
        ...existing,
        ...encrypted,
        updatedAt: Date.now(),
      })
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function deletePassword(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('passwords', 'readwrite')
    const request = tx.objectStore('passwords').delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
