-- Create gear_items table for storing product data
CREATE TABLE IF NOT EXISTS gear_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('racket', 'apparel', 'bag', 'strings', 'grip', 'shoes')),
  category TEXT, -- e.g., 'racket-control', 'racket-power', 'shorts', 'shoes', etc.
  specifications JSONB, -- flexible specs storage (head_size, weight, string_pattern, etc.)
  price_range TEXT, -- '$200-250' or '$$$'
  amazon_affiliate_link TEXT,
  description TEXT,
  pros TEXT[],
  cons TEXT[],
  best_for TEXT, -- 'control players', 'power players', 'beginners', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gear_items_type ON gear_items(type);
CREATE INDEX IF NOT EXISTS idx_gear_items_category ON gear_items(category);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_gear_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gear_items_updated_at
  BEFORE UPDATE ON gear_items
  FOR EACH ROW
  EXECUTE FUNCTION update_gear_items_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for content generation)
CREATE POLICY "Allow public read access to gear_items"
  ON gear_items
  FOR SELECT
  USING (true);

-- Allow admin write access (for managing gear data)
CREATE POLICY "Allow admin write access to gear_items"
  ON gear_items
  FOR ALL
  USING (true); -- In production, add proper auth check
