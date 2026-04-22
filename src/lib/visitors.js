import { getSupabaseClient } from './supabase'

const VISITS_TABLE = 'site_visits'
const VISITS_ROW_ID = 1

function normalizeVisitCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

export async function incrementSiteVisits() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('increment_site_visits')

  if (error) {
    throw error
  }

  return normalizeVisitCount(data)
}
