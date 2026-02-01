import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Debug endpoint to check if tables exist
 * GET /api/debug/check-tables
 */
export async function GET() {
  try {
    const supabase = createAdminSupabase();
    
    // Try to query each table
    const tables = ['posts', 'atp_calendar', 'content_calendar'];
    const results: Record<string, { exists: boolean; error?: string; count?: number }> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results[table] = {
            exists: false,
            error: error.message,
          };
        } else {
          results[table] = {
            exists: true,
            count: count || 0,
          };
        }
      } catch (err: any) {
        results[table] = {
          exists: false,
          error: err.message,
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      tables: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check tables', details: error.message },
      { status: 500 }
    );
  }
}