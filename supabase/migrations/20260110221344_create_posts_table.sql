-- Create posts table for blog
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null check (category in ('Gear', 'Travel', 'Analysis', 'Lifestyle')),
  featured_image text not null,
  
  -- SEO fields
  meta_title text,
  meta_description text,
  focus_keyword text,
  keywords text[], -- array of keywords
  
  -- Author info
  author_name text default 'Marshall' not null,
  author_image text,
  
  -- Metadata
  reading_time integer, -- in minutes
  tags text[], -- array of tags
  
  -- Dates
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone,
  
  -- Status
  published boolean default false not null,
  
  -- Affiliate links (stored as JSON)
  affiliate_links jsonb default '[]'::jsonb
);

-- Create index on slug for fast lookups
create index posts_slug_idx on public.posts(slug);

-- Create index on published_at for sorting
create index posts_published_at_idx on public.posts(published_at desc) where published = true;

-- Create index on category for filtering
create index posts_category_idx on public.posts(category);

-- Create index on tags for search (GIN index for array searches)
create index posts_tags_idx on public.posts using gin(tags);

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to update updated_at on row update
create trigger update_posts_updated_at
  before update on public.posts
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;

-- Create policy: Posts are viewable by everyone (public read)
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (published = true);

-- Create policy: Only authenticated users can insert (for admin/CMS later)
-- For now, we'll allow inserts but you can restrict this later
create policy "Anyone can insert posts"
  on public.posts for insert
  with check (true);

-- Create policy: Only authenticated users can update (for admin/CMS later)
create policy "Anyone can update posts"
  on public.posts for update
  using (true);

-- Create policy: Only authenticated users can delete (for admin/CMS later)
create policy "Anyone can delete posts"
  on public.posts for delete
  using (true);

-- Add comment to table
comment on table public.posts is 'Blog posts for Marshall tennis influencer site';
