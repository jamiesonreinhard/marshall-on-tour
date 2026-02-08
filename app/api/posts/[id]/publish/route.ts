import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { postBlogToX } from '@/lib/social/x';

/**
 * Publish a post
 * POST /api/posts/[id]/publish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    
    // Get post to check if it exists and get slug, title, excerpt, image (for X cross-post)
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('slug, published, title, excerpt, featured_image')
      .eq('id', id)
      .single();
    
    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (post.published) {
      return NextResponse.json(
        { error: 'Post is already published' },
        { status: 400 }
      );
    }
    
    // Update post to published
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        published: true,
        published_at: new Date().toISOString(),
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

    // Post to X (hook + link, same image or no image)
    if (post.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://marshallontour.com';
      const blogUrl = `${baseUrl.replace(/\/$/, '')}/blog/${post.slug}`;
      const xResult = await postBlogToX({
        blogUrl,
        title: post.title ?? '',
        excerpt: post.excerpt ?? undefined,
        imageUrl: post.featured_image ?? null,
      });
      if (!xResult.success) {
        console.warn(`[Publish] X post skipped or failed: ${xResult.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Post published successfully',
    });
  } catch (error: any) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: 'Failed to publish post', details: error.message },
      { status: 500 }
    );
  }
}
