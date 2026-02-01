-- Create ATP Calendar table if it doesn't exist (original migration failed due to index issue)
create table if not exists public.atp_calendar (
  id uuid default gen_random_uuid() primary key,
  tournament_id text unique not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  location jsonb not null,
  category text,
  surface text,
  prize_money text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_synced_at timestamp with time zone,
  constraint atp_calendar_tournament_id_key unique (tournament_id)
);

-- Create Content Calendar table if it doesn't exist
create table if not exists public.content_calendar (
  id uuid default gen_random_uuid() primary key,
  scheduled_date date not null,
  scheduled_time time,
  timezone text default 'America/New_York',
  atp_tournament_id uuid references public.atp_calendar(id),
  events text[],
  post_type text check (post_type in ('blog', 'instagram', 'x', 'all')),
  content_brief text not null,
  focus_keyword text,
  category text check (category in ('Gear', 'Travel', 'Analysis', 'Lifestyle')),
  blog_schedule jsonb,
  instagram_schedule jsonb,
  x_schedule jsonb,
  attitude text,
  tone_notes text,
  status text default 'planned' check (status in ('planned', 'approved', 'in_progress', 'published', 'cancelled')),
  approved_at timestamp with time zone,
  approved_by text,
  generated_post_id uuid references public.posts(id),
  generated_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  notes text
);

-- Create indexes
create index if not exists atp_calendar_dates_idx on public.atp_calendar(start_date, end_date);
create index if not exists atp_calendar_start_date_idx on public.atp_calendar(start_date);
create index if not exists content_calendar_date_idx on public.content_calendar(scheduled_date);
create index if not exists content_calendar_status_idx on public.content_calendar(status);
create index if not exists content_calendar_date_status_idx on public.content_calendar(scheduled_date, status);

-- Create triggers for updated_at
create or replace function update_atp_calendar_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_atp_calendar_updated_at on public.atp_calendar;
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

drop trigger if exists update_content_calendar_updated_at on public.content_calendar;
create trigger update_content_calendar_updated_at
  before update on public.content_calendar
  for each row
  execute function update_content_calendar_updated_at();

-- Enable RLS
alter table public.atp_calendar enable row level security;
alter table public.content_calendar enable row level security;

-- Create policies
drop policy if exists "ATP Calendar is publicly readable" on public.atp_calendar;
create policy "ATP Calendar is publicly readable"
  on public.atp_calendar
  for select
  using (true);

drop policy if exists "Content Calendar is publicly readable" on public.content_calendar;
create policy "Content Calendar is publicly readable"
  on public.content_calendar
  for select
  using (true);