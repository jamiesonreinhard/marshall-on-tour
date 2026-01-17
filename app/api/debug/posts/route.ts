import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Debug endpoint to check posts in database
 * 
 * GET /api/debug/posts
 */

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Get all posts (published and unpublished)
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('id, slug, title, published, published_at, created_at')
      .order('created_at', { ascending: false });

    // Get only published posts
    const { data: publishedPosts, error: publishedError } = await supabase
      .from('posts')
      .select('id, slug, title, published, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    return NextResponse.json({
      total: allPosts?.length || 0,
      published: publishedPosts?.length || 0,
      allPosts: allPosts || [],
      publishedPosts: publishedPosts || [],
      errors: {
        all: allError?.message,
        published: publishedError?.message,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch posts',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
