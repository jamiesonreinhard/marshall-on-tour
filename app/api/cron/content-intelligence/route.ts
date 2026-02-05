/**
 * Cron Job: Content Intelligence
 * 
 * Runs 3x daily (8 AM, 2 PM, 8 PM UTC)
 * Configured in vercel.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { runContentIntelligenceJob } from '@/lib/jobs/content-intelligence';

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const startTime = new Date();
  let result: any = null;
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[CRON] Content Intelligence Job Started at ${startTime.toISOString()}`);
    console.log('='.repeat(80));
    
    result = await runContentIntelligenceJob();
    
    // Log successful execution
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'content-intelligence',
      job_type: 'scheduled',
      status: result.success ? (result.action === 'generated' ? 'success' : 'skipped') : 'error',
      result: {
        action: result.action,
        opportunity: result.opportunity ? {
          type: result.opportunity.type,
          topic: result.opportunity.topic,
          score: result.opportunity.totalScore,
        } : null,
        postId: result.postId,
        reason: result.reason,
      },
      error_message: result.success ? undefined : result.reason,
      metadata: {
        triggered_by: 'cron',
      },
    }, startTime);
    
    const duration = Date.now() - startTime.getTime();
    console.log(`[CRON] Content Intelligence Job Completed in ${duration}ms`);
    console.log(`[CRON] Result: ${result.action} - ${result.reason || 'OK'}`);
    console.log('='.repeat(80) + '\n');
    
    return NextResponse.json({
      success: result.success,
      action: result.action,
      opportunity: result.opportunity,
      reason: result.reason,
      postId: result.postId,
      log: result.log,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    });
  } catch (error: any) {
    console.error('[CRON] Content Intelligence Job Error:', error);
    
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'content-intelligence',
      job_type: 'scheduled',
      status: 'error',
      error_message: error.message,
      metadata: {
        triggered_by: 'cron',
      },
    }, startTime);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
