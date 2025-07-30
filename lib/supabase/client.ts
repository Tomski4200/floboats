import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Alias for backward compatibility
export const createBrowserSupabaseClient = createBrowserClient