-- Create content_logs table for comprehensive logging
-- Stores full breakdown of content generation process

create table public.content_logs (
  id uuid default gen_random_uuid() primary key,
  job_id text not null,
  timestamp timestamp with time zone default now() not null,
  log_data jsonb not null,
  
  -- Indexes for quick queries
  created_at timestamp with time zone default now() not null
);

-- Index for job_id lookups
create index content_logs_job_id_idx on public.content_logs(job_id);

-- Index for timestamp queries
create index content_logs_timestamp_idx on public.content_logs(timestamp desc);

-- Index for querying by opportunity type
create index content_logs_opportunity_type_idx on public.content_logs((log_data->'selected_opportunity'->>'type'));

-- Index for querying by success status
create index content_logs_success_idx on public.content_logs((log_data->'generation_result'->>'success'));
