import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for on-demand ISR revalidation
 * 
 * Call this after publishing/updating a post to regenerate static pages
 * 
 * Usage:
 * POST /api/revalidate?path=/blog/[slug]
 * 
 * Or with secret token for security:
 * POST /api/revalidate?path=/blog/[slug]&secret=your-secret-token
 */

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');

  // Optional: Add secret token for security
  // if (secret !== process.env.REVALIDATE_SECRET) {
  //   return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  // }

  if (!path) {
    return NextResponse.json(
      { message: 'Path is required' },
      { status: 400 }
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}
