import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getPostsByCategory } from '@/lib/posts';

/**
 * Get all posts or posts by category
 * GET /api/posts?category=Gear
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as "Gear" | "Travel" | "Analysis" | "Lifestyle" | null;

    const posts = category
      ? await getPostsByCategory(category)
      : await getAllPosts();

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
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
