import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Get content calendar entries
 * GET /api/calendar/entries?startDate=2026-02-01&endDate=2026-02-28
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    
    const supabase = createAdminSupabase();
    let query = supabase
      .from('content_calendar')
      .select(`
        *,
        atp_calendar (
          id,
          name,
          start_date,
          end_date,
          location
        )
      `)
      .order('scheduled_date', { ascending: true });
    
    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      entries: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar entries', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Create a new content calendar entry
 * POST /api/calendar/entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabase();
    
    const { data, error } = await supabase
      .from('content_calendar')
      .insert({
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time || null,
        atp_tournament_id: body.atp_tournament_id || null,
        events: body.events || [],
        post_type: body.post_type || 'all',
        content_brief: body.content_brief,
        focus_keyword: body.focus_keyword || null,
        category: body.category || null,
        blog_schedule: body.blog_schedule || null,
        instagram_schedule: body.instagram_schedule || null,
        x_schedule: body.x_schedule || null,
        attitude: body.attitude || null,
        tone_notes: body.tone_notes || null,
        status: body.status || 'planned',
        notes: body.notes || null,
      })
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
      { error: 'Failed to create calendar entry', details: error.message },
      { status: 500 }
    );
  }
}