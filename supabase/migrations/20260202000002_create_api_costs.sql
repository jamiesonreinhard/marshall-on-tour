-- Create API costs tracking table
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'gemini', 'google-maps', 'youtube', etc.
  endpoint TEXT NOT NULL, -- 'generateContent', 'nearbysearch', etc.
  cost_usd NUMERIC(10, 6) NOT NULL, -- Cost in USD (supports micro-costs)
  input_tokens INTEGER, -- For Gemini
  output_tokens INTEGER, -- For Gemini
  request_count INTEGER DEFAULT 1, -- For APIs that charge per request
  metadata JSONB, -- Additional info (model used, location, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cost queries
CREATE INDEX IF NOT EXISTS idx_api_costs_service ON api_costs(service);
CREATE INDEX IF NOT EXISTS idx_api_costs_created_at ON api_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_costs_service_created_at ON api_costs(service, created_at);

-- Function to get weekly costs
CREATE OR REPLACE FUNCTION get_weekly_costs(week_start DATE DEFAULT CURRENT_DATE - INTERVAL '7 days')
RETURNS TABLE (
  service TEXT,
  total_cost NUMERIC,
  request_count BIGINT,
  avg_cost_per_request NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.service,
    SUM(ac.cost_usd)::NUMERIC(10, 6) as total_cost,
    COUNT(*)::BIGINT as request_count,
    AVG(ac.cost_usd)::NUMERIC(10, 6) as avg_cost_per_request
  FROM api_costs ac
  WHERE ac.created_at >= week_start
  GROUP BY ac.service
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily costs
CREATE OR REPLACE FUNCTION get_daily_costs(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  service TEXT,
  total_cost NUMERIC,
  request_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ac.created_at) as date,
    ac.service,
    SUM(ac.cost_usd)::NUMERIC(10, 6) as total_cost,
    COUNT(*)::BIGINT as request_count
  FROM api_costs ac
  WHERE ac.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY DATE(ac.created_at), ac.service
  ORDER BY date DESC, total_cost DESC;
END;
$$ LANGUAGE plpgsql;
