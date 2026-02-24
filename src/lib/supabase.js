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
const INSERT_RPC_NAME = 'insert_community_member'
const UPDATE_RPC_NAME = 'update_community_member'
const DELETE_RPC_NAME = 'delete_community_member'

const isMissingOriginColumn = (error) =>
  (error?.code === '42703' && error?.message?.toLowerCase().includes('origin')) ||
  error?.message?.toLowerCase().includes('origin')

const missingConfigError = () =>
  new Error('Supabase environment variables are missing.')

const normalizeRpcRow = (data) => {
  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  return data ?? null
}

const parseRpcBoolean = (data, fallbackKey) => {
  if (typeof data === 'boolean') return data

  if (Array.isArray(data)) {
    const first = data[0]
    if (typeof first === 'boolean') return first
    if (first && typeof first[fallbackKey] === 'boolean') return first[fallbackKey]
  }

  if (data && typeof data[fallbackKey] === 'boolean') {
    return data[fallbackKey]
  }

  return false
}

export const createOwnerToken = () => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    }
  }

  return `owner-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const isMissingManagementFunction = (error) => {
  const message = error?.message?.toLowerCase() ?? ''
  if (error?.code === 'PGRST202') return true

  return (
    message.includes(INSERT_RPC_NAME) ||
    message.includes(UPDATE_RPC_NAME) ||
    message.includes(DELETE_RPC_NAME)
  )
}

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

  const { data, error } = await supabase.rpc(INSERT_RPC_NAME, {
    p_name: payload.name,
    p_area: payload.area ?? null,
    p_origin: payload.origin ?? null,
    p_lat: payload.lat,
    p_lng: payload.lng,
    p_city: payload.city,
    p_visible: payload.visible,
    p_owner_token: payload.ownerToken,
  })

  const row = normalizeRpcRow(data)
  return {
    data: row ? { ...row, origin: row.origin ?? '' } : null,
    error,
  }
}

export const updateCommunityMember = async ({ memberId, ownerToken, payload }) => {
  if (!supabase) {
    return { data: null, error: missingConfigError() }
  }

  const { data, error } = await supabase.rpc(UPDATE_RPC_NAME, {
    p_member_id: memberId,
    p_owner_token: ownerToken,
    p_name: payload.name,
    p_area: payload.area ?? null,
    p_origin: payload.origin ?? null,
    p_lat: payload.lat,
    p_lng: payload.lng,
  })

  const row = normalizeRpcRow(data)
  return {
    data: row ? { ...row, origin: row.origin ?? '' } : null,
    error,
  }
}

export const deleteCommunityMember = async ({ memberId, ownerToken }) => {
  if (!supabase) {
    return { data: null, error: missingConfigError() }
  }

  const { data, error } = await supabase.rpc(DELETE_RPC_NAME, {
    p_member_id: memberId,
    p_owner_token: ownerToken,
  })

  return {
    data: {
      deleted: parseRpcBoolean(data, DELETE_RPC_NAME),
    },
    error,
  }
}
