import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Get social posts for queue
 * GET /api/social-posts/queue
 */
export async function GET() {
  try {
    const supabase = createAdminSupabase();
    
    // Check if social_posts table exists, if not return empty array
    const { data: socialPosts, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If table doesn't exist, return empty array (graceful degradation)
    // PGRST205 = table not found, 42P01 = relation does not exist
    if (error && (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist'))) {
      return NextResponse.json({
        success: true,
        socialPosts: [],
        count: 0,
      });
    }
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      socialPosts: socialPosts || [],
      count: socialPosts?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching social posts queue:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch social posts',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
