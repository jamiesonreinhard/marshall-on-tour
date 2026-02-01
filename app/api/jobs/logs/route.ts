/**
 * Job Logs API
 * 
 * GET /api/jobs/logs - Get job execution logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentJobLogs, getJobStats } from '@/lib/jobs/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobName = searchParams.get('job_name') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeStats = searchParams.get('stats') === 'true';
    
    const logs = await getRecentJobLogs(jobName, limit);
    
    const response: any = {
      logs,
      count: logs.length,
    };
    
    if (includeStats) {
      const stats = await getJobStats(jobName, 7);
      response.stats = stats;
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching job logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job logs', details: error.message },
      { status: 500 }
    );
  }
}
