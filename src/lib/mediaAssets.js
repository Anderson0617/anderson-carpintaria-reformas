import { GALLERY_BUCKET } from './gallery'
import { getSupabaseClient } from './supabase'

const EDITABLE_MEDIA_TABLE = 'editable_media_assets'

export const EDITABLE_MEDIA_PATHS = {
  presentationPhoto: 'media.presentationPhoto',
  carpentryTop: 'media.carpentryTop',
  carpentryBottom: 'media.carpentryBottom',
  masonryTop: 'media.masonryTop',
  masonryBottom: 'media.masonryBottom',
}

const EDITABLE_MEDIA_KEYS = Object.keys(EDITABLE_MEDIA_PATHS)

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function validateMediaKey(key) {
  if (!EDITABLE_MEDIA_KEYS.includes(key)) {
    throw new Error('Chave de mídia editável inválida.')
  }
}

function getPublicImageUrl(imagePath) {
  const supabase = getSupabaseClient()
  const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

function getExtensionFromType(type) {
  return MIME_EXTENSION_MAP[type] || 'jpg'
}

function createStoragePath(key, type) {
  const extension = getExtensionFromType(type)
  return `editable-media/${key}/${Date.now()}-${crypto.randomUUID()}.${extension}`
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl)
  if (!response.ok) {
    throw new Error('Não foi possível preparar a imagem para upload.')
  }

  return response.blob()
}

export function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:')
}

export async function listPublicEditableMedia() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(EDITABLE_MEDIA_TABLE)
    .select('media_key, storage_path')
    .in('media_key', EDITABLE_MEDIA_KEYS)

  if (error) {
    throw error
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.media_key, getPublicImageUrl(row.storage_path)]),
  )
}

export async function uploadEditableMediaAssets({ assets, adminPassword }) {
  const supabase = getSupabaseClient()
  const uploadedPaths = []
  const uploadedUrls = {}

  try {
    for (const [key, dataUrl] of Object.entries(assets)) {
      validateMediaKey(key)

      const blob = await dataUrlToBlob(dataUrl)
      const storagePath = createStoragePath(key, blob.type)

      const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || undefined,
      })

      if (uploadError) {
        throw uploadError
      }

      uploadedPaths.push(storagePath)

      const { error: upsertError } = await supabase.rpc('admin_upsert_editable_media_asset', {
        asset_key: key,
        asset_storage_path: storagePath,
        admin_password: adminPassword,
      })

      if (upsertError) {
        throw upsertError
      }

      uploadedUrls[key] = getPublicImageUrl(storagePath)
    }

    return uploadedUrls
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(GALLERY_BUCKET).remove(uploadedPaths)
    }
    throw error
  }
}
