/**
 * Content Logs API
 * 
 * GET /api/jobs/content-logs - Get detailed content generation logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const postId = searchParams.get('post_id');
    
    const supabase = createAdminSupabase();
    let query = supabase
      .from('content_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    
    if (postId) {
      query = query.contains('log_data', { 'generation_result': { 'post_id': postId } });
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      logs: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching content logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content logs', details: error.message },
      { status: 500 }
    );
  }
}
