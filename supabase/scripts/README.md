# One-off SQL scripts (not migrations)

Run these in **Supabase Dashboard → SQL Editor** when needed. They are not applied by `supabase db push`.

- **apply_missing_remote.sql** – Apply content_logs, marshall_state column, posts columns + record versions (use if db push --include-all fails with duplicate key).
- **record_migrations_applied.sql** – Only record migration versions in schema_migrations (use after applying DDL by hand).
- **apply_api_costs_remote.sql** – Apply api_costs migration + record version (use when 20260202000002 is pending and db push says "inserted before last migration").
