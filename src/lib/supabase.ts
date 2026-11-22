import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Valores públicos por design (vão no JavaScript do site de qualquer forma);
// quem protege os dados são as políticas RLS do banco.
// Podem ser sobrescritos por VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const DEFAULT_URL = 'https://rqjmhkxdbsvhjqylgwrj.supabase.co'
const DEFAULT_KEY = 'sb_publishable_2LWkf_Z1b01urJsU8qWqlw_Ct3MmgC8'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}
