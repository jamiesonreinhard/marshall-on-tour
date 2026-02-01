import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Update a content calendar entry
 * PATCH /api/calendar/entries/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabase();
    
    const { data, error } = await supabase
      .from('content_calendar')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      entry: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update calendar entry', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete a content calendar entry
 * DELETE /api/calendar/entries/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminSupabase();
    
    const { error } = await supabase
      .from('content_calendar')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete calendar entry', details: error.message },
      { status: 500 }
    );
  }
}