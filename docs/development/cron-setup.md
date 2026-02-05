# Cron Job Setup

## Content Intelligence Job

The content intelligence job runs **once daily** at:
- **12:00 PM UTC** (6 AM Central Time / 7 AM Eastern Time)

## Configuration

### Vercel Cron (Production)
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/content-intelligence",
      "schedule": "0 12 * * *"
    }
  ]
}
```

Schedule format: `minute hour day month weekday`
- `0 12 * * *` = At minute 0 of hour 12 (noon UTC = 6 AM Central Time)

### Environment Variables
Set `CRON_SECRET` in Vercel environment variables for security.

### Manual Trigger
You can also trigger manually:
- **API**: `POST /api/jobs/content-intelligence`
- **Admin UI**: `/admin/jobs` page

## Monitoring

### Console Logs
Each run logs comprehensive details to console:
- Opportunities found
- Selected opportunity
- Data sources used
- Prompt information
- Generation results

### Database Logs
All runs are logged to `content_logs` table with full JSON breakdown.

### Vercel Dashboard
Check Vercel dashboard → Cron Jobs to see execution history.

## Testing Locally

To test the cron job locally:
```bash
# Trigger manually
curl -X GET http://localhost:3000/api/cron/content-intelligence \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or use the admin UI at `/admin/jobs`.
