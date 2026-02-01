-- Create ATP Calendar table (source of truth for tournaments)
create table public.atp_calendar (
  id uuid default gen_random_uuid() primary key,
  tournament_id text unique not null, -- Sportradar tournament ID
  name text not null,
  start_date date not null,
  end_date date not null,
  location jsonb not null, -- { city, country, venue_name, venue_address }
  category text, -- 'ATP 250', 'ATP 500', 'ATP 1000', 'Grand Slam'
  surface text, -- 'Hard', 'Clay', 'Grass'
  prize_money text,
  
  -- Metadata
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_synced_at timestamp with time zone, -- When we last synced from Sportradar
  
  constraint atp_calendar_tournament_id_key unique (tournament_id)
);

create index atp_calendar_dates_idx on public.atp_calendar(start_date, end_date);
-- Note: Partial index with current_date not possible (not immutable)
-- Use regular index and filter in queries instead
create index atp_calendar_start_date_idx on public.atp_calendar(start_date);

-- Create Content Calendar table (planning entries)
create table public.content_calendar (
  id uuid default gen_random_uuid() primary key,
  
  -- Date & Timing
  scheduled_date date not null,
  scheduled_time time, -- Optional: specific time (e.g., "14:00" for 2 PM)
  timezone text default 'America/New_York', -- Marshall's timezone
  
  -- Event Context
  atp_tournament_id uuid references public.atp_calendar(id),
  events text[], -- Array of events: ['australian open mens final', 'semifinals']
  
  -- Content Planning
  post_type text check (post_type in ('blog', 'instagram', 'x', 'all')), -- 'all' = blog + social
  content_brief text not null, -- Brief description: 'write a preview of the mens final that comes out before the match'
  focus_keyword text, -- SEO focus keyword
  category text check (category in ('Gear', 'Travel', 'Analysis', 'Lifestyle')),
  
  -- Multi-Channel Scheduling
  blog_schedule jsonb, -- { enabled: true, publish_time: "3 hours before match", type: "preview" }
  instagram_schedule jsonb, -- { enabled: true, publish_time: "1 hour before match", type: "text and image" }
  x_schedule jsonb, -- { enabled: true, publish_time: "10 minutes before match", type: "text" }
  
  -- Marshall's Voice/Attitude
  attitude text, -- 'stoked', 'analytical', 'snarky', 'reflective'
  tone_notes text, -- Additional notes for Marshall's voice
  
  -- Status
  status text default 'planned' check (status in ('planned', 'approved', 'in_progress', 'published', 'cancelled')),
  approved_at timestamp with time zone,
  approved_by text, -- Your user ID or 'auto'
  
  -- Generated Content (after post is created)
  generated_post_id uuid references public.posts(id), -- Link to actual blog post
  generated_at timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  notes text -- Your manual notes/adjustments
);

create index content_calendar_date_idx on public.content_calendar(scheduled_date);
create index content_calendar_status_idx on public.content_calendar(status);
-- Note: Partial index with current_date not possible (not immutable)
-- Use regular index and filter in queries instead
create index content_calendar_date_status_idx on public.content_calendar(scheduled_date, status);

-- Create function to automatically update updated_at timestamp
create or replace function update_atp_calendar_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_atp_calendar_updated_at
  before update on public.atp_calendar
  for each row
  execute function update_atp_calendar_updated_at();

create or replace function update_content_calendar_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_content_calendar_updated_at
  before update on public.content_calendar
  for each row
  execute function update_content_calendar_updated_at();

-- Enable Row Level Security (RLS)
alter table public.atp_calendar enable row level security;
alter table public.content_calendar enable row level security;

-- Create policy: ATP Calendar is viewable by everyone (public read)
create policy "ATP Calendar is publicly readable"
  on public.atp_calendar
  for select
  using (true);

-- Create policy: Content Calendar is viewable by everyone (public read)
create policy "Content Calendar is publicly readable"
  on public.content_calendar
  for select
  using (true);

-- Note: For admin write access, you'll need to add authenticated policies
-- or use service role key for admin operations