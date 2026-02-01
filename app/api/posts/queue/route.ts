import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Get posts for queue (all posts, newest first)
 * GET /api/posts/queue
 */
export async function GET() {
  try {
    const supabase = createAdminSupabase();
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      posts: posts || [],
      count: posts?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching posts queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch posts',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
