-- Create job execution logs table
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL, -- 'content-intelligence', 'atp-sync', etc.
  job_type TEXT NOT NULL, -- 'scheduled', 'manual', 'api'
  status TEXT NOT NULL, -- 'success', 'error', 'skipped'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Duration in milliseconds
  result JSONB, -- Job-specific result data
  error_message TEXT, -- Error message if failed
  error_stack TEXT, -- Error stack trace if failed
  metadata JSONB, -- Additional metadata (user, trigger, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_logs_job_name ON job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON job_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_started_at ON job_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_name_started_at ON job_logs(job_name, started_at DESC);

-- Function to get recent job logs
CREATE OR REPLACE FUNCTION get_recent_job_logs(
  job_name_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  job_name TEXT,
  job_type TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jl.id,
    jl.job_name,
    jl.job_type,
    jl.status,
    jl.started_at,
    jl.completed_at,
    jl.duration_ms,
    jl.result,
    jl.error_message,
    jl.metadata
  FROM job_logs jl
  WHERE (job_name_filter IS NULL OR jl.job_name = job_name_filter)
  ORDER BY jl.started_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
