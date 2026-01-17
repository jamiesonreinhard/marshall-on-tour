# Supabase Setup Guide

This directory contains Supabase CLI configuration and database migrations.

## Initial Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Or using Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

### 2. Link to Your Project

```bash
supabase link --project-ref ejpmlzzoqgwqrsfnetee
```

You'll be prompted to enter your database password (found in your Supabase dashboard).

### 3. Pull Existing Schema (if any)

If you already have tables in your Supabase dashboard:

```bash
supabase db pull
```

This will create migration files from your existing database.

## Managing Database Schema

### Create a New Migration

```bash
supabase migration new <migration_name>
```

Example:
```bash
supabase migration new create_posts_table
```

This creates a new file in `supabase/migrations/` with a timestamp.

### Edit the Migration

Open the migration file and add your SQL:

```sql
-- Example: Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.posts enable row level security;

-- Create policy (example: allow public read)
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);
```

### Apply Migrations Locally

```bash
supabase db reset
```

This resets your local database and applies all migrations.

### Push Migrations to Production

```bash
supabase db push
```

This applies your migrations to your production Supabase project.

## Generate TypeScript Types

After creating your schema, generate TypeScript types:

```bash
supabase gen types typescript --project-id ejpmlzzoqgwqrsfnetee > lib/supabase/types.ts
```

Or if linked:
```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

## Common Commands

```bash
# Start local Supabase (for development)
supabase start

# Stop local Supabase
supabase stop

# View database in Supabase Studio
supabase studio

# Check migration status
supabase migration list

# Create a new migration
supabase migration new <name>

# Reset local database
supabase db reset

# Push migrations to production
supabase db push

# Pull schema from production
supabase db pull

# Generate TypeScript types
supabase gen types typescript --project-id ejpmlzzoqgwqrsfnetee > lib/supabase/types.ts
```

## Project Structure

```
supabase/
├── config.toml          # Supabase CLI configuration
├── migrations/           # Database migration files
│   └── YYYYMMDDHHMMSS_<name>.sql
└── README.md            # This file
```

## Using Supabase in Your Code

### Client Components

```typescript
'use client'

import { createClientSupabase } from '@/lib/supabase'

export function MyComponent() {
  const supabase = createClientSupabase()
  
  // Use supabase client
}
```

### Server Components

```typescript
import { createServerSupabase } from '@/lib/supabase'

export default async function MyPage() {
  const supabase = await createServerSupabase()
  
  // Use supabase client
}
```

### Admin Operations (Server Only)

```typescript
import { createAdminSupabase } from '@/lib/supabase'

export default async function AdminAction() {
  const supabase = createAdminSupabase()
  
  // Use admin client (bypasses RLS)
}
```

## Next Steps

1. **Create your first table**: Use `supabase migration new` to create a posts table
2. **Set up Row Level Security (RLS)**: Always enable RLS on your tables
3. **Generate types**: Run the type generation command after creating tables
4. **Test locally**: Use `supabase start` to test migrations locally before pushing

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
