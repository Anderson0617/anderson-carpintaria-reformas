import { getSupabaseClient } from './supabase'

const GALLERY_TABLE = 'gallery_entries'
export const GALLERY_BUCKET = 'site-gallery'
const GALLERY_CATEGORIES = ['carpintaria', 'alvenaria']

function getPublicImageUrl(imagePath) {
  const supabase = getSupabaseClient()
  const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

function normalizeGalleryEntry(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description ?? '',
    status: row.status,
    imagePath: row.image_path,
    src: getPublicImageUrl(row.image_path),
    createdAt: row.created_at,
    publishedAt: row.published_at,
    sortOrder: row.sort_order ?? null,
  }
}

function normalizeGalleryEntries(rows) {
  return (rows ?? []).map(normalizeGalleryEntry)
}

function sanitizeFileName(name) {
  const trimmed = name.replace(/\.[^/.]+$/, '').toLowerCase()
  const sanitized = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return sanitized || 'foto'
}

function createStoragePath(category, file) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const slug = sanitizeFileName(file.name).slice(0, 50)
  return `${category}/${Date.now()}-${crypto.randomUUID()}-${slug}.${extension}`
}

function sortGalleryEntries(entries) {
  return [...entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
}

function validateCategory(category) {
  if (!GALLERY_CATEGORIES.includes(category)) {
    throw new Error('Categoria de galeria inválida.')
  }
}

export function groupGalleryEntries(entries) {
  return {
    carpintaria: sortGalleryEntries(entries.filter((entry) => entry.category === 'carpintaria')),
    alvenaria: sortGalleryEntries(entries.filter((entry) => entry.category === 'alvenaria')),
  }
}

export async function listPublicGalleryEntries() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(GALLERY_TABLE)
    .select('id, category, name, description, status, image_path, created_at, published_at, sort_order')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return normalizeGalleryEntries(data)
}

export async function listAdminGalleryEntries(adminPassword) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_gallery_entries', {
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }

  return normalizeGalleryEntries(data)
}

export async function uploadGalleryEntry({ file, category, adminPassword }) {
  validateCategory(category)

  const supabase = getSupabaseClient()
  const imagePath = createStoragePath(category, file)
  const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(imagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (uploadError) {
    throw uploadError
  }

  const { data, error } = await supabase.rpc('admin_insert_gallery_entry', {
    entry_category: category,
    entry_name: file.name,
    entry_image_path: imagePath,
    admin_password: adminPassword,
  })

  if (error) {
    await supabase.storage.from(GALLERY_BUCKET).remove([imagePath])
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  return normalizeGalleryEntry(row)
}

export async function updateGalleryEntryDescription(entryId, description, adminPassword) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_update_gallery_entry_description', {
    entry_id: entryId,
    next_description: description,
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }
}

export async function publishGalleryEntries(adminPassword) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_publish_gallery_entries', {
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }
}

export async function publishGalleryEntriesByIds(adminPassword, entryIds) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_publish_gallery_entries_by_ids', {
    admin_password: adminPassword,
    entry_ids: entryIds,
  })

  if (error) {
    throw error
  }
}

export async function deleteGalleryEntry(entry, adminPassword) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_delete_gallery_entry', {
    entry_id: entry.id,
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }

  if (entry.imagePath) {
    const { error: storageError } = await supabase.storage.from(GALLERY_BUCKET).remove([entry.imagePath])
    if (storageError) {
      throw storageError
    }
  }
}
