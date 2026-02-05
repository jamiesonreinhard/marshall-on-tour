import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Unpublish a post
 * POST /api/posts/[id]/unpublish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    
    // Get post to check if it exists and get slug
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('slug, published')
      .eq('id', id)
      .single();
    
    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (!post.published) {
      return NextResponse.json(
        { error: 'Post is not published' },
        { status: 400 }
      );
    }
    
    // Update post to unpublished
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        published: false,
        published_at: null,
      })
      .eq('id', id);
    
    if (updateError) {
      throw updateError;
    }
    
    // Revalidate blog pages and homepage
    revalidatePath('/blog');
    revalidatePath('/');
    if (post.slug) {
      revalidatePath(`/blog/${post.slug}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post unpublished successfully',
    });
  } catch (error: any) {
    console.error('Error unpublishing post:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish post', details: error.message },
      { status: 500 }
    );
  }
}
