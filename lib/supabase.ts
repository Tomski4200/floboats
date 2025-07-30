import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// TODO: Add proper TypeScript types for database schema
// TODO: Implement error handling for missing environment variables
// TODO: Add connection pooling configuration for production

// Browser client for client-side operations
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client for server-side operations (API routes, Server Components)
export const createServerSupabaseClient = () => {
  // Import cookies dynamically only when needed
  const { cookies } = require('next/headers')
  const cookieStore = cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle case where we're in a Server Component and can't set cookies
          console.warn('Unable to set cookie in Server Component:', name)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          console.warn('Unable to remove cookie in Server Component:', name)
        }
      },
    },
  })
}

// Legacy client for simpler use cases (will be deprecated)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (uses service role key)
export const createAdminSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types (will be generated from schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          first_name: string | null
          last_name: string | null
          bio: string | null
          location: string | null
          phone: string | null
          website: string | null
          avatar_url: string | null
          is_dealer: boolean
          reputation_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          avatar_url?: string | null
          is_dealer?: boolean
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          avatar_url?: string | null
          is_dealer?: boolean
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      boats: {
        Row: {
          id: string
          owner_id: string
          make: string
          model: string
          year: number | null
          length_feet: number | null
          boat_type: string | null
          engine_type: string | null
          engine_hours: number | null
          condition_rating: number | null
          hull_id: string | null
          home_port: string | null
          description: string | null
          specs: any | null
          is_for_sale: boolean
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          make: string
          model: string
          year?: number | null
          length_feet?: number | null
          boat_type?: string | null
          engine_type?: string | null
          engine_hours?: number | null
          condition_rating?: number | null
          hull_id?: string | null
          home_port?: string | null
          description?: string | null
          specs?: any | null
          is_for_sale?: boolean
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          make?: string
          model?: string
          year?: number | null
          length_feet?: number | null
          boat_type?: string | null
          engine_type?: string | null
          engine_hours?: number | null
          condition_rating?: number | null
          hull_id?: string | null
          home_port?: string | null
          description?: string | null
          specs?: any | null
          is_for_sale?: boolean
          visibility?: string
          created_at?: string
          updated_at?: string
        }
      }
      // TODO: Add types for other tables (listings, businesses, etc.)
    }
  }
}