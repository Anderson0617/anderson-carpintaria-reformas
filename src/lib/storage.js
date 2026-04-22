const STORAGE_KEY = 'anderson-carpintaria-admin'
const LEGACY_REVIEWS_SUFFIX = ' No site público aparecem apenas avaliações aprovadas manualmente.'
const LEGACY_ASSET_MARKERS = {
  presentationPhoto: ['eu-apresentacao.jpeg'],
  introVideo: ['VIDEO-PORTAS.mp4', 'assets/video/VIDEO-PORTAS.mp4'],
  carpentryTop: ['CAPA-TOPO-73.jpeg'],
  carpentryBottom: ['CAPA-RODAPE.jpe', 'CAPA-RODAPE.jpeg'],
  masonryTop: ['fundo-3.jpeg'],
  masonryBottom: ['fundo-4-fim-rodape.jpeg', 'fundo-4 fim-rodape.jpeg'],
}

function sanitizeReviewIntro(content) {
  if (!content?.reviewsIntro?.text) {
    return content
  }

  const nextText = content.reviewsIntro.text.replace(LEGACY_REVIEWS_SUFFIX, '').trim()

  if (nextText === content.reviewsIntro.text) {
    return content
  }

  return {
    ...content,
    reviewsIntro: {
      ...content.reviewsIntro,
      text: nextText,
    },
  }
}

function shouldReplaceLegacyAsset(value, markers) {
  return (
    typeof value === 'string' &&
    !value.startsWith('data:') &&
    markers.some((marker) => value.includes(marker))
  )
}

function sanitizeMediaContent(content, fallback) {
  if (!content) {
    return fallback
  }

  const nextContent = structuredClone(content)

  if (shouldReplaceLegacyAsset(nextContent.media?.presentationPhoto, LEGACY_ASSET_MARKERS.presentationPhoto)) {
    nextContent.media.presentationPhoto = fallback.media.presentationPhoto
  }

  if (shouldReplaceLegacyAsset(nextContent.introVideo?.media, LEGACY_ASSET_MARKERS.introVideo)) {
    nextContent.introVideo.media = fallback.introVideo.media
  }

  if (shouldReplaceLegacyAsset(nextContent.media?.carpentryTop, LEGACY_ASSET_MARKERS.carpentryTop)) {
    nextContent.media.carpentryTop = fallback.media.carpentryTop
  }

  if (shouldReplaceLegacyAsset(nextContent.media?.carpentryBottom, LEGACY_ASSET_MARKERS.carpentryBottom)) {
    nextContent.media.carpentryBottom = fallback.media.carpentryBottom
  }

  if (shouldReplaceLegacyAsset(nextContent.media?.masonryTop, LEGACY_ASSET_MARKERS.masonryTop)) {
    nextContent.media.masonryTop = fallback.media.masonryTop
  }

  if (shouldReplaceLegacyAsset(nextContent.media?.masonryBottom, LEGACY_ASSET_MARKERS.masonryBottom)) {
    nextContent.media.masonryBottom = fallback.media.masonryBottom
  }

  return nextContent
}

export function loadState(fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw)

    return {
      ...fallback,
      draftContent: sanitizeReviewIntro(
        sanitizeMediaContent(parsed.draftContent ?? fallback.draftContent, fallback.draftContent),
      ),
      publishedContent: sanitizeReviewIntro(
        sanitizeMediaContent(parsed.publishedContent ?? fallback.publishedContent, fallback.publishedContent),
      ),
    }
  } catch (error) {
    console.error('Erro ao carregar estado salvo', error)
    return fallback
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Erro ao salvar estado local', error)
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
