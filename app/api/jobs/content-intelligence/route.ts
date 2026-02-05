/**
 * Content Intelligence Job API
 * 
 * POST /api/jobs/content-intelligence
 * 
 * Evaluates content opportunities and generates posts
 * Can be called manually or by a scheduled job
 */

import { NextRequest, NextResponse } from 'next/server';
import { runContentIntelligenceJob } from '@/lib/jobs/content-intelligence';

export async function POST(request: NextRequest) {
  const startTime = new Date();
  let result: any = null;
  
  try {
    result = await runContentIntelligenceJob();
    
    // Log successful execution
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'content-intelligence',
      job_type: 'manual',
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
        triggered_by: 'api',
        job_id: result.log?.job_id || result.log?.id, // Link to content log
      },
    }, startTime);
    
    return NextResponse.json({
      success: result.success,
      action: result.action,
      opportunity: result.opportunity,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Content intelligence job error:', error);
    
    // Log error
    const { logJobExecution } = await import('@/lib/jobs/logger');
    await logJobExecution({
      job_name: 'content-intelligence',
      job_type: 'manual',
      status: 'error',
      error_message: error.message,
      error_stack: error.stack,
      metadata: {
        triggered_by: 'api',
      },
    }, startTime);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run content intelligence job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/content-intelligence
 * 
 * Returns current opportunities without generating posts
 * Useful for debugging and manual review
 */
export async function GET() {
  try {
    const { evaluateOpportunities } = await import('@/lib/jobs/content-intelligence');
    const result = await evaluateOpportunities();
    
    return NextResponse.json({
      success: true,
      bestOpportunity: result.bestOpportunity,
      allOpportunities: result.allOpportunities.slice(0, 10), // Top 10
      postingStatus: result.postingStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error evaluating opportunities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to evaluate opportunities',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
