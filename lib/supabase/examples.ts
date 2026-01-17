/**
 * Supabase Usage Examples
 * 
 * These are examples of how to use Supabase in different contexts.
 * Delete this file once you're familiar with the patterns.
 */

// ============================================================================
// CLIENT COMPONENT EXAMPLE
// ============================================================================
/*
'use client'

import { createClientSupabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function PostsList() {
  const [posts, setPosts] = useState([])
  const supabase = createClientSupabase()

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
*/

// ============================================================================
// SERVER COMPONENT EXAMPLE
// ============================================================================
/*
import { createServerSupabase } from '@/lib/supabase'

export default async function PostsPage() {
  const supabase = await createServerSupabase()
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading posts</div>
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
*/

// ============================================================================
// SERVER ACTION EXAMPLE
// ============================================================================
/*
'use server'

import { createServerSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createPost(title: string, content: string) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('posts')
    .insert({ title, content })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/blog')
  return { data }
}
*/

// ============================================================================
// ADMIN OPERATION EXAMPLE (Server Only)
// ============================================================================
/*
import { createAdminSupabase } from '@/lib/supabase'

// ⚠️ Only use this for admin operations that need to bypass RLS
export async function adminDeletePost(postId: string) {
  const supabase = createAdminSupabase()
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
*/

// ============================================================================
// AUTHENTICATION EXAMPLE
// ============================================================================
/*
'use client'

import { createClientSupabase } from '@/lib/supabase'

export function SignInButton() {
  const supabase = createClientSupabase()

  async function handleSignIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error signing in:', error)
    }
  }

  return <button onClick={handleSignIn}>Sign in with Google</button>
}
*/

// ============================================================================
// STORAGE EXAMPLE
// ============================================================================
/*
import { createServerSupabase } from '@/lib/supabase'

export async function uploadImage(file: File) {
  const supabase = await createServerSupabase()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  return { url: data.publicUrl }
}
*/
