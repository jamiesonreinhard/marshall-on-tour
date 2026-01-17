# Post Generation Guide

## Overview

The post generation system automatically creates blog posts using:
1. **Content Opportunities** - Analyzes what to write about
2. **Gemini AI** - Writes the post content
3. **Image Generation** - Creates images (Flux/Replicate)
4. **Supabase** - Saves the post

## Setup

### 1. Get API Keys

**Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

**Replicate API Key (for images):**
1. Go to https://replicate.com/account/api-tokens
2. Create a new token
3. Add to `.env.local`: `REPLICATE_API_TOKEN=your_token_here`

### 2. Install Dependencies

```bash
npm install
```

## How It Works

### Content Opportunities System

The system automatically finds what to write about by analyzing:

1. **Recent Posts** - What have we written about recently?
2. **Upcoming Tournaments** - What tournaments are coming up?
3. **Current Tournaments** - What's happening now?
4. **Recent News** - What's in the tennis news?
5. **Content Gaps** - What categories haven't we covered?

**Location:** `lib/data/processor.ts`

### Reference System

The system uses **context** to decide what to write:

**Automatic (Recommended):**
- System finds opportunities automatically
- Uses highest priority opportunity
- No manual input needed

**Manual:**
- You can specify type, topic, tournament, etc.
- Overrides automatic selection

## API Endpoint

### Generate Post

**Endpoint:** `POST /api/posts/generate`

**Options:**

1. **Auto-generate (no body):**
   ```bash
   curl -X POST http://localhost:3000/api/posts/generate
   ```
   - Uses highest priority content opportunity
   - Saves as draft by default

2. **Specify topic:**
   ```bash
   curl -X POST http://localhost:3000/api/posts/generate \
     -H "Content-Type: application/json" \
     -d '{
       "type": "gear",
       "topic": "Best Tennis Racket for 2026",
       "publish": false
     }'
   ```

3. **Publish immediately:**
   ```bash
   curl -X POST http://localhost:3000/api/posts/generate \
     -H "Content-Type: application/json" \
     -d '{
       "type": "travel",
       "topic": "Where to Stay in Melbourne for Australian Open",
       "publish": true
     }'
   ```

4. **Without Marshall in image:**
   ```bash
   curl -X POST http://localhost:3000/api/posts/generate \
     -H "Content-Type: application/json" \
     -d '{
       "type": "gear",
       "topic": "Wilson Blade Review",
       "includeMarshall": false
     }'
   ```

### View Opportunities

**Endpoint:** `GET /api/posts/generate`

```bash
curl http://localhost:3000/api/posts/generate
```

Returns top 10 content opportunities.

## Request Body Options

```typescript
{
  type?: "gear" | "travel" | "analysis" | "lifestyle",  // Post category
  topic?: string,                                         // Specific topic
  tournamentId?: string,                                  // Link to tournament
  newsItemId?: string,                                    // Link to news item
  publish?: boolean,                                      // Publish immediately (default: false)
  includeMarshall?: boolean                              // Include Marshall in image (default: true)
}
```

## Image Generation

Images are generated based on:

- **Post Type:**
  - `gear` → Equipment/product shots
  - `travel` → Hotel/airport/tournament locations
  - `analysis` → Courtside/tournament scenes
  - `lifestyle` → Casual luxury settings

- **Context:**
  - Tournament location (if provided)
  - Custom scene description (if provided)
  - Whether to include Marshall

**Fallback:** If image generation fails, uses existing Marshall images from `/consistency_test/`

## Workflow

1. **System analyzes** what to write about
2. **Selects highest priority** opportunity
3. **Generates content** using Gemini (with Marshall's voice)
4. **Generates image** using Flux/Replicate
5. **Saves to Supabase** (draft or published)
6. **Revalidates pages** (if published)

## Testing

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Test Auto-Generation

```bash
curl -X POST http://localhost:3000/api/posts/generate
```

### 3. Test with Specific Topic

```bash
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gear",
    "topic": "Best Tennis Bag for Travel",
    "publish": false
  }'
```

### 4. Check Response

```json
{
  "success": true,
  "post": {
    "id": "uuid",
    "slug": "best-tennis-bag-for-travel",
    "title": "Best Tennis Bag for Travel",
    "published": false,
    "url": null
  },
  "message": "Post saved as draft"
}
```

### 5. View in Admin

Visit: http://localhost:3000/admin/posts

## Reference File System

The system uses **intelligent context** rather than a static reference file:

### Automatic Context Sources:

1. **Recent Posts** (`analyzeRecentPosts`)
   - What we've written about
   - Prevents repetition

2. **Tournament Data** (`getUpcomingTournaments`, `getCurrentTournaments`)
   - From Sportradar API
   - Tournament names, locations, dates

3. **News Items** (`getRecentNews`)
   - From RSS feeds
   - Headlines, descriptions, sources

4. **Content Gaps** (`findContentGaps`)
   - Categories we haven't covered
   - Affiliate opportunities

### Manual Override:

You can provide specific context in the API request:

```json
{
  "type": "travel",
  "topic": "Where to Stay in Melbourne",
  "tournament": {
    "name": "Australian Open",
    "location": "Melbourne, Australia",
    "startDate": "2026-01-19"
  }
}
```

## Image Context

Images are generated with context from:

- **Post type** → Determines scene type
- **Tournament** → Location-specific images
- **Topic** → Relevant to content
- **includeMarshall** → Whether to include Marshall

**Example prompts:**
- Gear post → "Marshall reviewing tennis equipment"
- Travel post → "Marshall in Melbourne for Australian Open"
- Analysis post → "Marshall courtside at tournament"

## Next Steps

1. **Get API keys** (Gemini + Replicate)
2. **Add to `.env.local`**
3. **Test with curl** (see examples above)
4. **Check admin panel** to see generated posts
5. **Review and edit** posts before publishing

## Troubleshooting

**Error: "GEMINI_API_KEY not set"**
- Add `GEMINI_API_KEY` to `.env.local`
- Restart dev server

**Error: "REPLICATE_API_TOKEN not set"**
- Image generation will use fallback images
- Add token for custom images

**Error: "No content opportunities found"**
- Make sure Sportradar API is working
- Check RSS feeds are accessible
- System will still work with manual topic

**Post saved but not visible:**
- Check `published` field (might be draft)
- Visit `/admin/posts` to see all posts
- Publish manually or set `publish: true`
