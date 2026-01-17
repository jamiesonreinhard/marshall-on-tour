import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client
 * Use this in Server Components and Server Actions
 * 
 * Note: For full cookie-based auth support, install @supabase/ssr:
 * npm install @supabase/ssr
 * 
 * Then update this file to use createServerClient from @supabase/ssr
 */
export async function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // For now, using standard client. Upgrade to @supabase/ssr for full auth support
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Server-side doesn't persist sessions
    },
  })
}

/**
 * Admin Supabase client (uses service role key)
 * Use this ONLY in Server Components/Actions for admin operations
 * 
 * ⚠️ NEVER expose this client to the client-side
 * ⚠️ This bypasses Row Level Security (RLS)
 */
export function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
