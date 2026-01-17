import { createClient } from '@supabase/supabase-js'

/**
 * Client-side Supabase client
 * Use this in Client Components ('use client')
 * 
 * This client uses the anon key and is safe to use in the browser
 * 
 * Note: For full SSR support, install @supabase/ssr:
 * npm install @supabase/ssr
 * 
 * Then update this to use createBrowserClient from @supabase/ssr
 */
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Alternative: Standard Supabase client for client-side use
 * Use this if you prefer the standard client over SSR client
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
