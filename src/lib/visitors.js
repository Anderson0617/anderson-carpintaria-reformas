import { getSupabaseClient } from './supabase'

const VISITS_TABLE = 'site_visits'
const VISITS_ROW_ID = 1

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
