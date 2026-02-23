import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

const TABLE_NAME = 'community_members'
const COLUMNS_WITH_ORIGIN = 'id,name,area,origin,lat,lng,city,visible,created_at'
const COLUMNS_WITHOUT_ORIGIN = 'id,name,area,lat,lng,city,visible,created_at'

const isMissingOriginColumn = (error) =>
  (error?.code === '42703' && error?.message?.toLowerCase().includes('origin')) ||
  error?.message?.toLowerCase().includes('origin')

const missingConfigError = () =>
  new Error('Supabase environment variables are missing.')

export const fetchCommunityMembers = async () => {
  if (!supabase) {
    return { data: [], error: missingConfigError() }
  }

  let { data, error } = await supabase
    .from(TABLE_NAME)
    .select(COLUMNS_WITH_ORIGIN)
    .eq('visible', true)
    .order('created_at', { ascending: false })

  if (error && isMissingOriginColumn(error)) {
    const fallback = await supabase
      .from(TABLE_NAME)
      .select(COLUMNS_WITHOUT_ORIGIN)
      .eq('visible', true)
      .order('created_at', { ascending: false })

    data = (fallback.data ?? []).map((member) => ({ ...member, origin: '' }))
    error = fallback.error
  }

  return {
    data: data ?? [],
    error,
  }
}

export const insertCommunityMember = async (payload) => {
  if (!supabase) {
    return { data: null, error: missingConfigError() }
  }

  let { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select(COLUMNS_WITH_ORIGIN)
    .single()

  if (error && isMissingOriginColumn(error)) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.origin

    const fallback = await supabase
      .from(TABLE_NAME)
      .insert(fallbackPayload)
      .select(COLUMNS_WITHOUT_ORIGIN)
      .single()

    data = fallback.data ? { ...fallback.data, origin: '' } : null
    error = fallback.error
  }

  return { data, error }
}
