const GITHUB_DELETED_URL = `${import.meta.env.BASE_URL}published/deleted.json`

function buildGithubJsonUrl(baseUrl, cacheBuster) {
  const normalizedBase = String(baseUrl || '')
  if (!cacheBuster) {
    return normalizedBase
  }

  const separator = normalizedBase.includes('?') ? '&' : '?'
  return `${normalizedBase}${separator}t=${encodeURIComponent(cacheBuster)}`
}

export async function listGithubHiddenState({ cacheBuster } = {}) {
  const response = await fetch(buildGithubJsonUrl(GITHUB_DELETED_URL, cacheBuster), {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return {
      hiddenGalleryIds: [],
      hiddenReviewIds: [],
    }
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar as ocultações publicadas no GitHub.')
  }

  const payload = await response.json().catch(() => ({}))

  return {
    hiddenGalleryIds: Array.isArray(payload.hiddenGalleryIds) ? payload.hiddenGalleryIds : [],
    hiddenReviewIds: Array.isArray(payload.hiddenReviewIds) ? payload.hiddenReviewIds : [],
  }
}
