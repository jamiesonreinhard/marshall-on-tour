/**
 * Plan Week Job API
 *
 * POST /api/jobs/plan-week
 *
 * Suggests content_calendar entries from atp_calendar for the next N weeks.
 * Entries are inserted with status = 'planned' for review/approval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPlanWeekJob } from '@/lib/jobs/plan-week';

export async function POST(request: NextRequest) {
  const startTime = new Date();
  try {
    const body = await request.json().catch(() => ({}));
    const weeksAhead = typeof body.weeksAhead === 'number' ? body.weeksAhead : 2;

    const result = await runPlanWeekJob({ weeksAhead });

    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution(
      {
        job_name: 'plan-week',
        job_type: 'manual',
        status: result.success ? 'success' : 'error',
        result: {
          suggested: result.suggested,
          errors: result.errors,
        },
        error_message: result.errors?.length ? result.errors.join('; ') : undefined,
        metadata: { triggered_by: 'api', weeksAhead },
      },
      startTime
    );

    return NextResponse.json({
      success: result.success,
      suggested: result.suggested,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Plan week job error:', error);
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution(
      {
        job_name: 'plan-week',
        job_type: 'manual',
        status: 'error',
        error_message: error.message,
        metadata: { triggered_by: 'api' },
      },
      startTime
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run plan-week job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
