-- Run this in Supabase Dashboard > SQL Editor to record the three migrations
-- you already applied by hand. Then "supabase migration list" / "db push" will be in sync.

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES (20260205000000), (20260207000000), (20260207000001)
ON CONFLICT (version) DO NOTHING;
