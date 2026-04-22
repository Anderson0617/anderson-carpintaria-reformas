import { getSupabaseClient } from './supabase'

const REVIEWS_TABLE = 'reviews'

function normalizeReview(row) {
  return {
    id: row.id,
    stars: row.stars,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    country: row.country,
    countryCode: row.country_code,
    region: row.region,
    regionCode: row.region_code,
    city: row.city,
    neighborhood: row.neighborhood,
    precision: row.precision,
  }
}

function normalizeReviewList(rows) {
  return (rows ?? []).map(normalizeReview)
}

export async function listPublicReviews() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select('id, stars, comment, status, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return normalizeReviewList(data)
}

export async function listAdminReviews(adminPassword) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('admin_list_reviews', {
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }

  return normalizeReviewList(data)
}

export async function createReview(review) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from(REVIEWS_TABLE).insert({
    stars: review.stars,
    comment: review.comment,
    status: review.status,
    country: review.country ?? null,
    country_code: review.countryCode ?? null,
    region: review.region ?? null,
    region_code: review.regionCode ?? null,
    city: review.city ?? null,
    neighborhood: review.neighborhood ?? null,
    precision: review.precision ?? 'unknown',
  })

  if (error) {
    throw error
  }
}

export async function updateReviewStatus(reviewId, nextStatus, adminPassword) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_update_review_status', {
    review_id: reviewId,
    next_status: nextStatus,
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }
}

export async function deleteReview(reviewId, adminPassword) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.rpc('admin_delete_review', {
    review_id: reviewId,
    admin_password: adminPassword,
  })

  if (error) {
    throw error
  }
}
