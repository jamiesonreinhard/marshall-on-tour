# Cron Job Setup

## Content Intelligence Job

The content intelligence job runs **3x daily** at:
- **8:00 AM UTC** (2 AM EST / 11 PM PST previous day)
- **2:00 PM UTC** (9 AM EST / 6 AM PST)
- **8:00 PM UTC** (3 PM EST / 12 PM PST)

## Configuration

### Vercel Cron (Production)
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/content-intelligence",
      "schedule": "0 8,14,20 * * *"
    }
  ]
}
```

Schedule format: `minute hour day month weekday`
- `0 8,14,20 * * *` = At minute 0 of hours 8, 14, and 20 (UTC)

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
