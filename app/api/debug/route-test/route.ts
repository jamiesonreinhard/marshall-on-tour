import { NextResponse } from 'next/server';
import { getPost } from '@/lib/posts';

/**
 * Test endpoint to debug route issues
 * 
 * GET /api/debug/route-test?slug=your-slug-here
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'the-marshall-standard-why-your-performance-tennis-gear-review-sucks';

  try {
    const post = await getPost(slug);
    
    return NextResponse.json({
      slug,
      found: !!post,
      post: post ? {
        title: post.title,
        slug: post.slug,
        published: true,
      } : null,
      message: post ? 'Post found!' : 'Post not found',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to test route',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
