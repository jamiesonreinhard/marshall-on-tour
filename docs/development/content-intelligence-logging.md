# Content Intelligence Logging System

## Overview

Comprehensive logging system that tracks every step of the content generation process. This helps identify what data sources are being used, what's missing, and how to improve the system.

## What Gets Logged

### 1. Opportunities Found
- Total number of opportunities discovered
- All opportunities with full scoring breakdown:
  - Type (analysis, gear, travel, etc.)
  - Topic
  - Total score
  - Individual scores (timeliness, affiliate potential, SEO value, content variety, social engagement)
  - Metadata

### 2. Selected Opportunity
- Which opportunity was chosen
- Why it was selected (highest score, reason)
- Full scoring breakdown

### 3. Posting Status
- Can post blog? (yes/no)
- Can post social? (yes/no)
- Reason if blocked

### 4. Handler Data Gathering
- Handler type used (analysis, nostalgia, gear, travel, lifestyle)
- Data sources accessed (e.g., "Player profile: Alcaraz", "Weather: Paris", "YouTube: 3 match highlights")
- Data gathered:
  - Number of players
  - Number of matches
  - Number of news articles
  - Number of videos
  - Weather data (yes/no)
  - Number of hotels
  - Number of restaurants
  - Number of coffee shops
  - Historical player data
  - Gear items

### 5. Prompt Information
- Context type
- Topic
- What data is included:
  - Has tournament data?
  - Has player data?
  - Has news data?
  - Has weather data?
  - Has historical data?
  - Has gear data?
- Prompt length (characters)
- Estimated tokens

### 6. Missing Data
- What Gemini had to figure out without context:
  - Player stats?
  - Match results?
  - Weather data?
  - Historical context?
  - Gear specs?
  - Location info?

### 7. Generation Results
- Success/failure
- Post ID (if successful)
- Title
- Content length
- Fact-check issues found
- Editor changes made
- Errors (if any)

## How to View Logs

### Console Output
Every job run prints a comprehensive summary to the console:

```
================================================================================
📊 CONTENT GENERATION LOG SUMMARY
================================================================================
Job ID: ci-1234567890-abc123
Timestamp: 2026-02-05T14:00:00.000Z

Opportunities Found: 5

Top Opportunities:
  1. [tournament] Rotterdam Open Preview (Score: 68)
     Timeliness: 20, Affiliate: 15, SEO: 15, Variety: 10, Social: 8
  2. [analysis] Alcaraz vs Sinner Analysis (Score: 62)
     ...

✅ Selected: [tournament] Rotterdam Open Preview
   Score: 68
   Reason: Highest scoring opportunity (68 points)

Posting Status: Blog=true, Social=true

Handler: travel
Data Sources: Tournament: Rotterdam Open, Weather: Rotterdam, Hotels: 10 found, Coffee: 5 found

Prompt Info:
  Type: travel
  Length: 15,234 chars (~3,809 tokens)
  Has Tournament: true
  Has Players: false
  Has News: false
  Has Weather: true
  Has Historical Data: false
  Has Gear Data: false

⚠️  Missing Data (Gemini had to figure out):
  - player stats

Generation Result:
  Success: true
  Post ID: abc-123-def
  Title: Rotterdam Open Preview: Complete Travel Guide
  Content Length: 8,234 chars
  Fact-Check Issues: 0
  Editor Made Changes: No
================================================================================
```

### Database
Logs are saved to `content_logs` table in Supabase:
- Query by `job_id` to get a specific run
- Query by `timestamp` to see recent runs
- Query by opportunity type or success status

### API Response
The cron job returns the full log in the response:
```json
{
  "success": true,
  "action": "generated",
  "opportunity": {...},
  "log": {
    "job_id": "ci-1234567890-abc123",
    "opportunities_found": 5,
    "selected_opportunity": {...},
    "data_sources": [...],
    "prompt_info": {...},
    "generation_result": {...}
  }
}
```

## Using Logs to Improve

### Identify Missing Data Sources
Look for patterns in `missing_data`:
- If `player_stats` is often missing → Need better player data integration
- If `weather_data` is often missing → Check weather API
- If `historical_context` is missing → Expand historical players JSON

### Optimize Prompt Size
Check `prompt_info.prompt_length_chars`:
- If consistently > 20,000 chars → Consider trimming context
- If consistently < 5,000 chars → Might need more data

### Improve Opportunity Scoring
Review `opportunities` array:
- Are good opportunities being scored too low?
- Are bad opportunities being scored too high?
- Adjust scoring weights in `scoring.ts`

### Track Handler Performance
Compare `data_sources` across handler types:
- Which handlers gather the most data?
- Which handlers are missing critical data?
- Which handlers need new integrations?

## Database Schema

```sql
create table content_logs (
  id uuid primary key,
  job_id text not null,
  timestamp timestamp with time zone,
  log_data jsonb not null
);
```

## Example Queries

```sql
-- Get last 10 job runs
SELECT * FROM content_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Get all successful generations
SELECT * FROM content_logs 
WHERE log_data->'generation_result'->>'success' = 'true';

-- Get opportunities that were selected
SELECT 
  log_data->'selected_opportunity'->>'type' as type,
  log_data->'selected_opportunity'->>'topic' as topic,
  log_data->'selected_opportunity'->>'score' as score
FROM content_logs
WHERE log_data->'selected_opportunity' IS NOT NULL;

-- Find posts missing player data
SELECT * FROM content_logs
WHERE log_data->'missing_data'->>'player_stats' = 'true';
```
