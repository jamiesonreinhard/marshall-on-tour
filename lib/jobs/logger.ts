/**
 * Job Execution Logger
 * 
 * Tracks all background job executions for monitoring and debugging
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export type JobStatus = 'success' | 'error' | 'skipped';
export type JobType = 'scheduled' | 'manual' | 'api';

export interface JobLogEntry {
  job_name: string;
  job_type: JobType;
  status: JobStatus;
  result?: any;
  error_message?: string;
  error_stack?: string;
  metadata?: Record<string, any>;
}

export interface JobLog {
  id: string;
  job_name: string;
  job_type: JobType;
  status: JobStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  result: any;
  error_message: string | null;
  metadata: any;
}

/**
 * Log a job execution
 */
export async function logJobExecution(
  entry: JobLogEntry,
  startTime: Date
): Promise<string | null> {
  try {
    const supabase = createAdminSupabase();
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    const { data, error } = await supabase
      .from('job_logs')
      .insert({
        job_name: entry.job_name,
        job_type: entry.job_type,
        status: entry.status,
        completed_at: endTime.toISOString(),
        duration_ms: durationMs,
        result: entry.result || null,
        error_message: entry.error_message || null,
        error_stack: entry.error_stack || null,
        metadata: entry.metadata || null,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to log job execution:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error logging job execution:', error);
    return null;
  }
}

/**
 * Get recent job logs
 */
export async function getRecentJobLogs(
  jobName?: string,
  limit: number = 50
): Promise<JobLog[]> {
  try {
    const supabase = createAdminSupabase();
    
    let query = supabase
      .from('job_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (jobName) {
      query = query.eq('job_name', jobName);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching job logs:', error);
      return [];
    }
    
    return (data || []).map((log: any) => ({
      id: log.id,
      job_name: log.job_name,
      job_type: log.job_type,
      status: log.status,
      started_at: log.started_at,
      completed_at: log.completed_at,
      duration_ms: log.duration_ms,
      result: log.result,
      error_message: log.error_message,
      metadata: log.metadata,
    }));
  } catch (error) {
    console.error('Error fetching job logs:', error);
    return [];
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(jobName?: string, days: number = 7): Promise<{
  total_runs: number;
  success_count: number;
  error_count: number;
  skipped_count: number;
  avg_duration_ms: number;
  last_run: string | null;
}> {
  try {
    const supabase = createAdminSupabase();
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    let query = supabase
      .from('job_logs')
      .select('status, duration_ms, started_at')
      .gte('started_at', since.toISOString());
    
    if (jobName) {
      query = query.eq('job_name', jobName);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      return {
        total_runs: 0,
        success_count: 0,
        error_count: 0,
        skipped_count: 0,
        avg_duration_ms: 0,
        last_run: null,
      };
    }
    
    const totalRuns = data.length;
    const successCount = data.filter((log: any) => log.status === 'success').length;
    const errorCount = data.filter((log: any) => log.status === 'error').length;
    const skippedCount = data.filter((log: any) => log.status === 'skipped').length;
    
    const durations = data
      .filter((log: any) => log.duration_ms !== null)
      .map((log: any) => log.duration_ms);
    const avgDuration = durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : 0;
    
    const lastRun = data.length > 0
      ? data.sort((a: any, b: any) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )[0].started_at
      : null;
    
    return {
      total_runs: totalRuns,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      avg_duration_ms: Math.round(avgDuration),
      last_run: lastRun,
    };
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return {
      total_runs: 0,
      success_count: 0,
      error_count: 0,
      skipped_count: 0,
      avg_duration_ms: 0,
      last_run: null,
    };
  }
}
