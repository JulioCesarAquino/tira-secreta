import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** null quando o projeto ainda não foi configurado (a página de revelação funciona mesmo assim). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}
