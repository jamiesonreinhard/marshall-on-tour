-- Run this in Supabase Dashboard > SQL Editor if "db push --include-all" fails
-- with duplicate key on schema_migrations (20260202000000 already applied).
-- This applies the three missing migrations and records them.

-- 1. content_logs (20260205000000)
CREATE TABLE IF NOT EXISTS public.content_logs (
  id uuid default gen_random_uuid() primary key,
  job_id text not null,
  timestamp timestamp with time zone default now() not null,
  log_data jsonb not null,
  created_at timestamp with time zone default now() not null
);
CREATE INDEX IF NOT EXISTS content_logs_job_id_idx ON public.content_logs(job_id);
CREATE INDEX IF NOT EXISTS content_logs_timestamp_idx ON public.content_logs(timestamp desc);
CREATE INDEX IF NOT EXISTS content_logs_opportunity_type_idx ON public.content_logs((log_data->'selected_opportunity'->>'type'));
CREATE INDEX IF NOT EXISTS content_logs_success_idx ON public.content_logs((log_data->'generation_result'->>'success'));

-- 2. marshall_state current_tournament_id (20260207000000)
ALTER TABLE public.marshall_state
  ADD COLUMN IF NOT EXISTS current_tournament_id uuid REFERENCES public.atp_calendar(id);
COMMENT ON COLUMN public.marshall_state.current_tournament_id IS 'The one tournament Marshall is currently at; current_city/country derive from it.';

-- 3. posts needs_review + content_quality_notes (20260207000001)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS needs_review boolean default false not null,
  ADD COLUMN IF NOT EXISTS content_quality_notes text;
COMMENT ON COLUMN public.posts.needs_review IS 'Set when content quality checks fail (missing video, Marshall mention, or AFF for gear/travel)';
COMMENT ON COLUMN public.posts.content_quality_notes IS 'Reasons for needs_review (e.g. missing Marshall mention, missing AFF in first 400 words)';

-- 4. Record migrations as applied so "supabase db push" won't try to re-apply them.
DO $$
BEGIN
  INSERT INTO supabase_migrations.schema_migrations (version)
  VALUES (20260205000000), (20260207000000), (20260207000001)
  ON CONFLICT (version) DO NOTHING;
EXCEPTION WHEN undefined_table OR undefined_object THEN
  RAISE NOTICE 'Could not update schema_migrations (table may be in another schema). DDL above was still applied.';
END $$;
