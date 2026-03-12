import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// supabase is null when env vars are not set → app runs in local-only mode
export const supabase = url && key ? createClient(url, key) : null
export const supabaseIsConfigured = Boolean(url && key)
