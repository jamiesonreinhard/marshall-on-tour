import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Get a single post by ID
 * GET /api/posts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch post',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update a post
 * PATCH /api/posts/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminSupabase();
    
    // Update slug if title changed
    let updateData: any = {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      focus_keyword: body.focus_keyword,
      keywords: body.keywords || [],
      tags: body.tags || [],
    };
    
    // Generate new slug from title if title changed
    if (body.title) {
      updateData.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);
    }
    
    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update post',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Delete a post
 * DELETE /api/posts/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete post',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
