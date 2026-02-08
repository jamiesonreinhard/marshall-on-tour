-- Run in Supabase Dashboard > SQL Editor to apply 20260202000002 (api_costs) and get in sync.
-- Then "supabase migration list" will show 20260202000002 on both Local and Remote.

-- 1. Migration: api_costs table + functions
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  request_count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_costs_service ON api_costs(service);
CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_costs_service_created_at ON api_costs(service, created_at);

CREATE OR REPLACE FUNCTION get_weekly_costs(week_start DATE DEFAULT CURRENT_DATE - INTERVAL '7 days')
RETURNS TABLE (service TEXT, total_cost NUMERIC, request_count BIGINT, avg_cost_per_request NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT ac.service, SUM(ac.cost_usd)::NUMERIC(10, 6), COUNT(*)::BIGINT, AVG(ac.cost_usd)::NUMERIC(10, 6)
  FROM api_costs ac WHERE ac.created_at >= week_start
  GROUP BY ac.service ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_daily_costs(days_back INTEGER DEFAULT 7)
RETURNS TABLE (date DATE, service TEXT, total_cost NUMERIC, request_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(ac.created_at), ac.service, SUM(ac.cost_usd)::NUMERIC(10, 6), COUNT(*)::BIGINT
  FROM api_costs ac WHERE ac.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY DATE(ac.created_at), ac.service ORDER BY date DESC, total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Record so CLI sees it as applied
INSERT INTO supabase_migrations.schema_migrations (version) VALUES (20260202000002) ON CONFLICT (version) DO NOTHING;
