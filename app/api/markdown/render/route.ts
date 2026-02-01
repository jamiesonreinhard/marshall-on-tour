import { NextRequest, NextResponse } from 'next/server';
import { markdownToHtml } from '@/lib/markdown';

/**
 * Render markdown to HTML
 * POST /api/markdown/render
 */
export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json();
    
    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }
    
    const html = await markdownToHtml(markdown);
    
    return NextResponse.json({
      success: true,
      html,
    });
  } catch (error: any) {
    console.error('Error rendering markdown:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to render markdown',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
