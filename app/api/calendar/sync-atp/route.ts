import { NextRequest, NextResponse } from 'next/server';
import { syncATPCalendar } from '@/lib/calendar/atp-sync';
import { loadStaticATPCalendar } from '@/lib/calendar/load-static-calendar';

/**
 * Sync ATP Calendar from Sportradar API or load static calendar
 * POST /api/calendar/sync-atp?source=static|api
 * 
 * Default: static (loads from official 2026 calendar)
 * Use ?source=api to sync from Sportradar API
 */
export async function POST(request: NextRequest) {
  const startTime = new Date();
  let result: any = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'static';
    
    if (source === 'api') {
      // Sync from Sportradar API
      const apiResult = await syncATPCalendar(2026);
      result = {
        success: apiResult.errors === 0,
        synced: apiResult.synced,
        errors: apiResult.errors,
        total: apiResult.total,
      };
    } else {
      // Load static calendar from official PDF data
      result = await loadStaticATPCalendar();
    }
    
    // Log successful execution
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'atp-sync',
      job_type: 'manual',
      status: result.success ? 'success' : 'error',
      result: {
        source: source === 'api' ? 'sportradar-api' : 'static-calendar',
        tournaments_synced: result.tournaments?.length || result.synced || 0,
        errors: result.errors || 0,
      },
      error_message: result.success ? undefined : result.error,
      metadata: {
        triggered_by: 'api',
        source_type: source,
      },
    }, startTime);
    
    return NextResponse.json({
      source: source === 'api' ? 'sportradar-api' : 'static-calendar',
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing ATP calendar:', error);
    
    // Log error
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'atp-sync',
      job_type: 'manual',
      status: 'error',
      error_message: error.message,
      error_stack: error.stack,
      metadata: {
        triggered_by: 'api',
      },
    }, startTime);
    
    return NextResponse.json(
      { error: 'Failed to sync ATP calendar', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get ATP Calendar sync status
 * GET /api/calendar/sync-atp
 */
export async function GET() {
  try {
    const { createAdminSupabase } = await import('@/lib/supabase/server');
    const supabase = createAdminSupabase();
    
    // First, check if table exists by trying a simple query
    const { data, error, count } = await supabase
      .from('atp_calendar')
      .select('id, name, start_date, end_date, location, last_synced_at', { count: 'exact' })
      .order('start_date', { ascending: true });
      // Removed limit to get all tournaments
    
    if (error) {
      // If table doesn't exist, provide helpful error message
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return NextResponse.json(
          { 
            error: 'ATP Calendar table not found',
            details: error.message,
            suggestion: 'Make sure the migration has been applied. Run: supabase db push'
          },
          { status: 500 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      tournaments: data || [],
      count: count || data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching ATP calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ATP calendar', details: error.message },
      { status: 500 }
    );
  }
}