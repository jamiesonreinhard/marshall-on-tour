# Supabase Local Setup Troubleshooting

## Issue: Connection Refused Error

```
failed to connect to postgres: failed to connect to `host=127.0.0.1 user=postgres database=postgres`: 
dial error (dial tcp 127.0.0.1:54322: connect: connection refused)
```

**Cause:** Supabase local instance isn't running (or Docker isn't running)

---

## Solution Steps

### 1. Start Docker
**macOS:**
- Open Docker Desktop application
- Wait for it to fully start (whale icon in menu bar should be steady)

**Check if Docker is running:**
```bash
docker ps
```
Should return container list (or empty list), not an error.

### 2. Start Supabase Local Instance

```bash
cd marshall-web
supabase start
```

This will:
- Pull Docker images (first time only, takes a few minutes)
- Start all Supabase services (Postgres, API, Auth, Storage, etc.)
- Show connection details

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Set Environment Variables

Create `.env.local` file (if doesn't exist):

```bash
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
```

**Or use the values from `supabase start` output.**

### 4. Verify Connection

```bash
# Check Supabase status
supabase status

# Should show all services running
```

---

## Common Issues

### Issue 1: Docker Not Running
**Error:** `Cannot connect to the Docker daemon`

**Fix:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Try `supabase start` again

### Issue 2: Port Already in Use
**Error:** `port 54322 is already in use`

**Fix:**
```bash
# Stop Supabase
supabase stop

# Or stop specific service
supabase stop --no-backup
```

### Issue 3: Migration Fails
**Error:** Migration errors when running `supabase db push`

**Fix:**
```bash
# Reset local database
supabase db reset

# Then push migrations again
supabase db push
```

### Issue 4: Can't Connect After Start
**Error:** Connection refused even after `supabase start`

**Fix:**
1. Check Docker is running: `docker ps`
2. Check Supabase status: `supabase status`
3. Restart Supabase: `supabase stop && supabase start`

---

## Quick Reference Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Check status
supabase status

# View logs
supabase logs

# Reset database (WARNING: deletes all data)
supabase db reset

# Push migrations
supabase db push

# Pull remote schema
supabase db pull

# Open Studio (web UI)
supabase studio
```

---

## Alternative: Use Remote Supabase

If local development is too complex, you can use your remote Supabase project:

1. Get your project URL and keys from: https://supabase.com/dashboard
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

**Note:** For migrations, you can still use:
```bash
supabase db push --linked  # Push to remote project
```

---

## Next Steps

Once Supabase is running:

1. **Run migrations:**
   ```bash
   supabase db push
   ```

2. **Verify tables exist:**
   ```bash
   supabase studio
   # Opens web UI at http://localhost:54323
   ```

3. **Test connection:**
   ```bash
   npm run dev
   # Your app should connect to local Supabase
   ```

---

**Remember:** Docker must be running for Supabase local development to work!