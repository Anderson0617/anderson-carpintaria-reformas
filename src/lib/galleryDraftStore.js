const DB_NAME = 'anderson-carpintaria-gallery-drafts'
const STORE_NAME = 'galleryDrafts'
const DB_VERSION = 1

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB não disponível neste navegador.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o IndexedDB.'))
  })
}

function runTransaction(mode, executor) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        const request = executor(store)

        transaction.oncomplete = () => {
          database.close()
        }

        transaction.onerror = () => {
          database.close()
          reject(transaction.error || new Error('Falha ao acessar o IndexedDB.'))
        }

        transaction.onabort = () => {
          database.close()
          reject(transaction.error || new Error('A operação no IndexedDB foi abortada.'))
        }

        if (request) {
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error || new Error('Falha ao acessar o IndexedDB.'))
        } else {
          resolve(undefined)
        }
      }),
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Não foi possível preparar a foto para o GitHub.'))
    reader.readAsDataURL(file)
  })
}

export async function saveGalleryDraftFile(entryId, file) {
  await runTransaction('readwrite', (store) =>
    store.put({
      id: entryId,
      file,
      name: file.name,
      type: file.type || 'image/jpeg',
      updatedAt: Date.now(),
    }),
  )
}

export async function deleteGalleryDraftFile(entryId) {
  await runTransaction('readwrite', (store) => store.delete(entryId))
}

export async function getGalleryDraftPublishPayload(entryId) {
  const record = await runTransaction('readonly', (store) => store.get(entryId))
  if (!record?.file) {
    return null
  }

  const dataUrl = await fileToDataUrl(record.file)
  const [header, base64] = dataUrl.split(',', 2)
  const mimeMatch = header.match(/^data:(.+);base64$/)

  return {
    fileName: record.name || 'foto.jpg',
    mimeType: mimeMatch?.[1] || record.type || 'image/jpeg',
    base64: base64 || '',
  }
}
