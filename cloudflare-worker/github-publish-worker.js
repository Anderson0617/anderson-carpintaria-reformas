const RATE_LIMIT_WINDOW_MS = 15_000
const requestBuckets = new Map()
const GALLERY_JSON_PATH = 'public/published/gallery.json'
const REVIEWS_JSON_PATH = 'public/published/reviews.json'
const GALLERY_CATEGORIES = ['carpintaria', 'alvenaria']
const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  })
}

function normalizeOrigin(value) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed
  }
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN)

  if (!allowedOrigin || origin === allowedOrigin) {
    return {
      'Access-Control-Allow-Origin': allowedOrigin || origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  }

  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function assertAllowedOrigin(request, env) {
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN)
  const origin = request.headers.get('Origin') || ''

  if (allowedOrigin && origin !== allowedOrigin) {
    throw new Error('Origin não permitida.')
  }
}

function getGithubToken(env) {
  return (
    env.DISPATCH_KEY ||
    env.GH_DISPATCH_PAT ||
    env.DISPATCH_PAT ||
    env.WORKFLOW_DISPATCH_TOKEN ||
    env.GITHUB_WORKFLOW_TOKEN ||
    env.GITHUB_TOKEN
  )
}

function assertConfigured(env) {
  const githubToken = getGithubToken(env)
  const required = ['ADMIN_PUBLISH_KEY', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH']

  const missing = required.filter((key) => !env[key])
  if (!githubToken) {
    missing.push('DISPATCH_KEY')
  }
  if (missing.length) {
    throw new Error(`Worker incompleto: faltam secrets ${missing.join(', ')}`)
  }
}

function checkRateLimit(request) {
  const requester =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('Origin') ||
    'unknown'

  const now = Date.now()
  const previous = requestBuckets.get(requester) || 0

  if (now - previous < RATE_LIMIT_WINDOW_MS) {
    throw new Error('Aguarde alguns segundos antes de tentar publicar novamente.')
  }

  requestBuckets.set(requester, now)

  for (const [key, timestamp] of requestBuckets.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      requestBuckets.delete(key)
    }
  }
}

function sanitizeSlug(name) {
  return String(name || 'foto')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'foto'
}

function getExtensionFromMimeType(type, fileName) {
  const fromMime = MIME_EXTENSION_MAP[type]
  if (fromMime) {
    return fromMime
  }

  const fromName = String(fileName || '').split('.').pop()?.toLowerCase()
  return fromName || 'jpg'
}

function buildGalleryAssetPath(item) {
  const extension = getExtensionFromMimeType(item.mimeType, item.fileName)
  const slug = sanitizeSlug(item.name || item.fileName)
  return `public/published/gallery/${item.category}/${item.id}-${slug}.${extension}`
}

function getDefaultGalleryManifest() {
  return {
    carpintaria: [],
    alvenaria: [],
  }
}

function getDefaultReviewsManifest() {
  return []
}

function assertValidGalleryItem(item) {
  if (!item?.id) {
    throw new Error('Item da galeria sem ID.')
  }

  if (!GALLERY_CATEGORIES.includes(item.category)) {
    throw new Error('Categoria inválida para publicação no GitHub.')
  }

  if (!item.base64) {
    throw new Error('Imagem ausente para publicação no GitHub.')
  }
}

function assertValidReviewItem(item) {
  if (!item?.id) {
    throw new Error('Avaliação sem ID para publicação no GitHub.')
  }

  if (!item?.comment) {
    throw new Error('Avaliação sem comentário para publicação no GitHub.')
  }

  if (!Number.isInteger(item?.stars) || item.stars < 1 || item.stars > 5) {
    throw new Error('Avaliação com nota inválida para publicação no GitHub.')
  }
}

async function githubRequest(env, path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getGithubToken(env)}`,
      'User-Agent': 'anderson-carpintaria-reformas-worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  })

  return response
}

async function githubJson(env, path, init = {}) {
  const response = await githubRequest(env, path, init)
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`GitHub recusou a operação: ${response.status} ${text}`)
  }

  return payload
}

async function getCurrentBranchHead(env) {
  return githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/ref/heads/${env.GITHUB_BRANCH}`)
}

async function getCommit(env, commitSha) {
  return githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/commits/${commitSha}`)
}

async function getRepositoryContents(env, path) {
  const response = await githubRequest(
    env,
    `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}?ref=${env.GITHUB_BRANCH}`,
  )

  if (response.status === 404) {
    return null
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(`GitHub recusou a leitura do arquivo: ${response.status} ${text}`)
  }

  return payload
}

async function createBlob(env, content, encoding) {
  const payload = await githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/blobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      encoding,
    }),
  })

  return payload.sha
}

async function createTree(env, baseTreeSha, entries) {
  const payload = await githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/trees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: entries,
    }),
  })

  return payload.sha
}

async function createCommit(env, treeSha, parentSha, message) {
  const payload = await githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/commits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha],
    }),
  })

  return payload.sha
}

async function updateRef(env, commitSha) {
  await githubJson(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/refs/heads/${env.GITHUB_BRANCH}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: commitSha,
      force: false,
    }),
  })
}

async function loadGalleryManifest(env) {
  const contents = await getRepositoryContents(env, GALLERY_JSON_PATH)
  if (!contents?.content) {
    return getDefaultGalleryManifest()
  }

  try {
    return {
      ...getDefaultGalleryManifest(),
      ...JSON.parse(atob(contents.content.replace(/\n/g, ''))),
    }
  } catch {
    return getDefaultGalleryManifest()
  }
}

async function loadReviewsManifest(env) {
  const contents = await getRepositoryContents(env, REVIEWS_JSON_PATH)
  if (!contents?.content) {
    return getDefaultReviewsManifest()
  }

  try {
    const parsed = JSON.parse(atob(contents.content.replace(/\n/g, '')))
    return Array.isArray(parsed) ? parsed : getDefaultReviewsManifest()
  } catch {
    return getDefaultReviewsManifest()
  }
}

function upsertGalleryManifestEntry(manifest, entry) {
  const nextManifest = {
    carpintaria: [...(manifest.carpintaria || [])],
    alvenaria: [...(manifest.alvenaria || [])],
  }

  GALLERY_CATEGORIES.forEach((category) => {
    nextManifest[category] = nextManifest[category].filter((item) => item.id !== entry.id)
  })

  nextManifest[entry.category].unshift(entry)
  return nextManifest
}

function upsertReviewManifestEntry(manifest, entry) {
  return [entry, ...manifest.filter((item) => item.id !== entry.id)]
}

function removeGalleryManifestEntries(manifest, entryIds) {
  const ids = new Set(entryIds)
  const deletedIds = []
  const nextManifest = {
    carpintaria: (manifest.carpintaria || []).filter((item) => {
      if (ids.has(item.id)) {
        deletedIds.push(item.id)
        return false
      }

      return true
    }),
    alvenaria: (manifest.alvenaria || []).filter((item) => {
      if (ids.has(item.id)) {
        deletedIds.push(item.id)
        return false
      }

      return true
    }),
  }

  return {
    nextManifest,
    deletedIds: [...new Set(deletedIds)],
  }
}

function removeReviewManifestEntries(manifest, reviewIds) {
  const ids = new Set(reviewIds)
  const deletedIds = []
  const nextManifest = manifest.filter((item) => {
    if (ids.has(item.id)) {
      deletedIds.push(item.id)
      return false
    }

    return true
  })

  return {
    nextManifest,
    deletedIds,
  }
}

async function syncPublishedContent(
  env,
  { galleryItems = [], reviewItems = [], galleryIdsToDelete = [], reviewIdsToDelete = [] },
) {
  const now = new Date().toISOString()
  const head = await getCurrentBranchHead(env)
  const currentCommitSha = head.object.sha
  const currentCommit = await getCommit(env, currentCommitSha)
  const currentTreeSha = currentCommit.tree.sha
  let galleryManifest = await loadGalleryManifest(env)
  let reviewsManifest = await loadReviewsManifest(env)
  const treeEntries = []
  const publishedGalleryItems = []
  const publishedReviewItems = []
  const deletedGalleryIds = []
  const deletedReviewIds = []

  for (const rawItem of galleryItems) {
    assertValidGalleryItem(rawItem)

    const imagePath = buildGalleryAssetPath(rawItem)
    const imageBlobSha = await createBlob(env, rawItem.base64, 'base64')

    treeEntries.push({
      path: imagePath,
      mode: '100644',
      type: 'blob',
      sha: imageBlobSha,
    })

    const manifestEntry = {
      id: rawItem.id,
      category: rawItem.category,
      name: rawItem.name || rawItem.fileName || 'foto',
      description: rawItem.description || '',
      imagePath: imagePath.replace(/^public\//, ''),
      publishedAt: now,
    }

    galleryManifest = upsertGalleryManifestEntry(galleryManifest, manifestEntry)
    publishedGalleryItems.push(manifestEntry)
  }

  for (const rawItem of reviewItems) {
    assertValidReviewItem(rawItem)

    const manifestEntry = {
      id: rawItem.id,
      stars: rawItem.stars,
      comment: rawItem.comment,
      createdAt: rawItem.createdAt || now,
      publishedAt: now,
      country: rawItem.country ?? null,
      countryCode: rawItem.countryCode ?? null,
      region: rawItem.region ?? null,
      regionCode: rawItem.regionCode ?? null,
      city: rawItem.city ?? null,
      neighborhood: rawItem.neighborhood ?? null,
      precision: rawItem.precision ?? 'unknown',
    }

    reviewsManifest = upsertReviewManifestEntry(reviewsManifest, manifestEntry)
    publishedReviewItems.push(manifestEntry)
  }

  if (galleryIdsToDelete.length) {
    const removal = removeGalleryManifestEntries(galleryManifest, galleryIdsToDelete)
    galleryManifest = removal.nextManifest
    deletedGalleryIds.push(...removal.deletedIds)
  }

  if (reviewIdsToDelete.length) {
    const removal = removeReviewManifestEntries(reviewsManifest, reviewIdsToDelete)
    reviewsManifest = removal.nextManifest
    deletedReviewIds.push(...removal.deletedIds)
  }

  if (galleryItems.length || deletedGalleryIds.length) {
    const galleryJsonSha = await createBlob(env, `${JSON.stringify(galleryManifest, null, 2)}\n`, 'utf-8')
    treeEntries.push({
      path: GALLERY_JSON_PATH,
      mode: '100644',
      type: 'blob',
      sha: galleryJsonSha,
    })
  }

  if (reviewItems.length || deletedReviewIds.length) {
    const reviewsJsonSha = await createBlob(env, `${JSON.stringify(reviewsManifest, null, 2)}\n`, 'utf-8')
    treeEntries.push({
      path: REVIEWS_JSON_PATH,
      mode: '100644',
      type: 'blob',
      sha: reviewsJsonSha,
    })
  }

  if (!treeEntries.length) {
    throw new Error('Nenhum item publicado do GitHub corresponde à operação solicitada.')
  }

  const nextTreeSha = await createTree(env, currentTreeSha, treeEntries)
  const commitSummary = []

  if (publishedGalleryItems.length) {
    commitSummary.push(`publish ${publishedGalleryItems.length} gallery item(s)`)
  }
  if (publishedReviewItems.length) {
    commitSummary.push(`publish ${publishedReviewItems.length} review(s)`)
  }
  if (deletedGalleryIds.length) {
    commitSummary.push(`delete ${deletedGalleryIds.length} gallery item(s)`)
  }
  if (deletedReviewIds.length) {
    commitSummary.push(`delete ${deletedReviewIds.length} review(s)`)
  }

  const nextCommitSha = await createCommit(
    env,
    nextTreeSha,
    currentCommitSha,
    `chore: ${commitSummary.join(' and ')} from admin`,
  )
  await updateRef(env, nextCommitSha)

  return {
    commitSha: nextCommitSha,
    publishedGalleryItems,
    publishedReviewItems,
    deletedGalleryIds,
    deletedReviewIds,
  }
}

async function dispatchGithubWorkflow(env) {
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${getGithubToken(env)}`,
        'Content-Type': 'application/json',
        'User-Agent': 'anderson-carpintaria-reformas-worker',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: env.GITHUB_BRANCH,
      }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`GitHub recusou o disparo do workflow: ${response.status} ${details}`)
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    if (request.method !== 'POST') {
      return json(
        {
          ok: false,
          message: 'Método não permitido.',
          timestamp: new Date().toISOString(),
        },
        405,
        corsHeaders,
      )
    }

    try {
      assertConfigured(env)
      assertAllowedOrigin(request, env)
      checkRateLimit(request)

      const payload = await request.json().catch(() => ({}))
      if (payload?.adminCredential !== env.ADMIN_PUBLISH_KEY) {
        return json(
          {
            ok: false,
            message: 'Credencial administrativa inválida.',
            timestamp: new Date().toISOString(),
          },
          401,
          corsHeaders,
        )
      }

      if (
        (Array.isArray(payload.galleryItems) && payload.galleryItems.length) ||
        (Array.isArray(payload.reviewItems) && payload.reviewItems.length) ||
        (Array.isArray(payload.galleryIdsToDelete) && payload.galleryIdsToDelete.length) ||
        (Array.isArray(payload.reviewIdsToDelete) && payload.reviewIdsToDelete.length)
      ) {
        const result = await syncPublishedContent(env, {
          galleryItems: Array.isArray(payload.galleryItems) ? payload.galleryItems : [],
          reviewItems: Array.isArray(payload.reviewItems) ? payload.reviewItems : [],
          galleryIdsToDelete: Array.isArray(payload.galleryIdsToDelete) ? payload.galleryIdsToDelete : [],
          reviewIdsToDelete: Array.isArray(payload.reviewIdsToDelete) ? payload.reviewIdsToDelete : [],
        })

        return json(
          {
            ok: true,
            message: 'Conteúdo marcado foi publicado no GitHub com sucesso.',
            timestamp: new Date().toISOString(),
            runStatus: 'committed',
            commitSha: result.commitSha,
            publishedGalleryCount: result.publishedGalleryItems.length,
            publishedGalleryIds: result.publishedGalleryItems.map((item) => item.id),
            publishedReviewCount: result.publishedReviewItems.length,
            publishedReviewIds: result.publishedReviewItems.map((item) => item.id),
            deletedGalleryCount: result.deletedGalleryIds.length,
            deletedGalleryIds: result.deletedGalleryIds,
            deletedReviewCount: result.deletedReviewIds.length,
            deletedReviewIds: result.deletedReviewIds,
          },
          200,
          corsHeaders,
        )
      }

      await dispatchGithubWorkflow(env)

      return json(
        {
          ok: true,
          message: 'Workflow do GitHub acionado com sucesso.',
          timestamp: new Date().toISOString(),
          runStatus: 'queued',
        },
        200,
        corsHeaders,
      )
    } catch (error) {
      return json(
        {
          ok: false,
          message: error instanceof Error ? error.message : 'Falha ao acionar publicação.',
          timestamp: new Date().toISOString(),
        },
        500,
        corsHeaders,
      )
    }
  },
}
