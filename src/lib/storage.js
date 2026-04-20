const STORAGE_KEY = 'anderson-carpintaria-admin'
const LEGACY_REVIEWS_SUFFIX = ' No site público aparecem apenas avaliações aprovadas manualmente.'

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

export function loadState(fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = { ...fallback, ...JSON.parse(raw) }

    return {
      ...parsed,
      draftContent: sanitizeReviewIntro(parsed.draftContent),
      publishedContent: sanitizeReviewIntro(parsed.publishedContent),
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
