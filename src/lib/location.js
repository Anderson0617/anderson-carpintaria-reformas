const LOCATION_CACHE_KEY = 'anderson-carpintaria-location-cache'
const LOCATION_SESSION_ID_KEY = 'anderson-carpintaria-session-id'

function normalizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function formatApproxRegion(location) {
  if (!location) {
    return 'Região não identificada'
  }

  const parts = [
    normalizeString(location.regionCode) || normalizeString(location.region),
    normalizeString(location.city),
  ].filter(Boolean)

  if (location.precision === 'neighborhood' && normalizeString(location.neighborhood)) {
    parts.push(location.neighborhood.trim())
  }

  if (!parts.length) {
    return 'Região não identificada'
  }

  return parts.join(' — ')
}

export function getOrCreateVisitorSessionId() {
  if (typeof window === 'undefined') {
    return 'server'
  }

  const cached = window.sessionStorage.getItem(LOCATION_SESSION_ID_KEY)
  if (cached) {
    return cached
  }

  const nextId = crypto.randomUUID()
  window.sessionStorage.setItem(LOCATION_SESSION_ID_KEY, nextId)
  return nextId
}

export async function getApproxLocation() {
  if (typeof window === 'undefined') {
    return null
  }

  const cached = window.sessionStorage.getItem(LOCATION_CACHE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (_error) {
      window.sessionStorage.removeItem(LOCATION_CACHE_KEY)
    }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 4500)

  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao obter região aproximada: ${response.status}`)
    }

    const data = await response.json()
    const location = {
      country: normalizeString(data.country_name),
      countryCode: normalizeString(data.country_code),
      region: normalizeString(data.region),
      regionCode: normalizeString(data.region_code),
      city: normalizeString(data.city),
      neighborhood: null,
      precision: normalizeString(data.city) ? 'city' : normalizeString(data.region) ? 'state' : 'unknown',
    }

    window.sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location))
    return location
  } catch (error) {
    console.error('Erro ao obter localização aproximada por IP', error)
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}
