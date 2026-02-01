-- Create Marshall's Current State table
-- Tracks Marshall's current gear, location, preferences for authentic content generation

create table public.marshall_state (
  id uuid default gen_random_uuid() primary key,
  
  -- Current Gear
  current_racket text,
  current_racket_affiliate_link text,
  current_shoes text,
  current_shoes_affiliate_link text,
  other_gear jsonb, -- { bag: "...", strings: "...", grip: "...", etc. }
  
  -- Current Location
  current_city text,
  current_country text,
  current_hotel text,
  current_hotel_affiliate_link text,
  current_coffee_shop text,
  arrived_at timestamp with time zone,
  leaving_at timestamp with time zone,
  
  -- Next Location
  next_city text,
  next_country text,
  next_tournament_id uuid references public.atp_calendar(id),
  traveling_to_at timestamp with time zone,
  
  -- Preferences & Interests
  favorite_players text[], -- ['Alcaraz', 'Sinner', 'Djokovic', ...]
  up_and_coming_player_watching text, -- Player he's keeping an eye on for content
  favorite_tournaments text[], -- ['Wimbledon', 'Indian Wells', 'Roland-Garros', ...]
  current_interests text[], -- ['clay court season', 'racket technology', 'next gen players', ...]
  
  -- Metadata
  updated_at timestamp with time zone default now() not null,
  updated_by text default 'system', -- 'system' (auto-updated) or 'manual' (admin updated)
  notes text -- Any additional context
);

-- Create index for quick lookups
create index marshall_state_updated_at_idx on public.marshall_state(updated_at desc);

-- Create function to auto-update updated_at
create or replace function update_marshall_state_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger marshall_state_updated_at
  before update on public.marshall_state
  for each row
  execute function update_marshall_state_updated_at();

-- Insert initial state (singleton - only one row should exist)
-- This will be updated, not inserted multiple times
insert into public.marshall_state (
  current_racket,
  current_city,
  current_country,
  favorite_players,
  favorite_tournaments,
  updated_by
) values (
  'Wilson Blade 98',
  'Melbourne',
  'Australia',
  ARRAY['Alcaraz', 'Sinner', 'Djokovic'],
  ARRAY['Wimbledon', 'Indian Wells', 'Roland-Garros'],
  'system'
);

-- Add comment
comment on table public.marshall_state is 'Tracks Marshall''s current state (gear, location, preferences) for authentic content generation and website display';
