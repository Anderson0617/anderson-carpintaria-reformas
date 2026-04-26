import { getSupabaseClient } from './supabase'

const VISITS_TABLE = 'site_visits'
const VISITS_ROW_ID = 1
const GOOGLE_VISITS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzFyTtQAAtwNfvpECJxGU52I9HkdmxXFAul0K8ODrMTundBFwH0sjtU_wiTywOYOQ/exec'
const GOOGLE_VISITS_CACHE_KEY = 'anderson-carpintaria-google-visits'

function normalizeVisitCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeVisit(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    country: row.country,
    countryCode: row.country_code,
    region: row.region,
    regionCode: row.region_code,
    city: row.city,
    neighborhood: row.neighborhood,
    precision: row.precision,
    sessionId: row.session_id,
  }
}

function normalizeVisitList(rows) {
  return (rows ?? []).map(normalizeVisit)
}

function normalizeGoogleVisitCount(payload) {
  if (typeof payload === 'number') {
    return normalizeVisitCount(payload)
  }

  if (typeof payload === 'string') {
    return normalizeVisitCount(payload)
  }

  if (payload && typeof payload === 'object') {
    return normalizeVisitCount(
      payload.total ?? payload.count ?? payload.visitas ?? payload.value ?? payload.result,
    )
  }

  return 0
}

function setCachedGoogleVisitCount(value) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GOOGLE_VISITS_CACHE_KEY, String(normalizeVisitCount(value)))
}

export function getCachedGoogleVisitCount() {
  if (typeof window === 'undefined') {
    return 0
  }

  return normalizeVisitCount(window.localStorage.getItem(GOOGLE_VISITS_CACHE_KEY))
}

function requestJsonp(url) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('JSONP indisponível fora do navegador.'))
      return
    }

    const callbackName = `googleVisitsCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete window[callbackName]
      script.remove()
    }

    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('Tempo esgotado ao consultar contador do Google.'))
    }, 12000)

    window[callbackName] = (payload) => {
      window.clearTimeout(timeoutId)
      cleanup()
      resolve(payload)
    }

    script.onerror = () => {
      window.clearTimeout(timeoutId)
      cleanup()
      reject(new Error('Falha ao carregar contador do Google.'))
    }

    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}`
    document.body.appendChild(script)
  })
}

export async function countGoogleSiteVisits() {
  const url = `${GOOGLE_VISITS_WEB_APP_URL}?action=count`

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Resposta inválida do contador do Google.')
    }

    const payload = await response.json().catch(() => null)
    const count = normalizeGoogleVisitCount(payload)
    setCachedGoogleVisitCount(count)
    return count
  } catch (error) {
    const payload = await requestJsonp(url)
    const count = normalizeGoogleVisitCount(payload)
    setCachedGoogleVisitCount(count)
    return count
  }
}

export async function getSiteVisits() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(VISITS_TABLE)
    .select('total_visits')
    .eq('id', VISITS_ROW_ID)
    .single()

  if (error) {
    throw error
  }

  return normalizeVisitCount(data?.total_visits)
}

export async function incrementSiteVisits({ location = null, sessionId = null } = {}) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('increment_site_visits', {
    visitor_country: location?.country ?? null,
    visitor_country_code: location?.countryCode ?? null,
    visitor_region: location?.region ?? null,
    visitor_region_code: location?.regionCode ?? null,
    visitor_city: location?.city ?? null,
    visitor_neighborhood: location?.neighborhood ?? null,
    visitor_precision: location?.precision ?? 'unknown',
    visitor_session_id: sessionId ?? null,
  })

  if (error) {
    throw error
  }

  return normalizeVisitCount(data)
}

export async function listRecentVisits(adminPassword) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_recent_visits', {
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }

  return normalizeVisitList(data)
}
