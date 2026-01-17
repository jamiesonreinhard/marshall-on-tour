# Quick Test Guide - Post Generation MVP

## Setup (One Time)

### 1. Get API Keys

**Gemini API Key:**
- Go to: https://makersuite.google.com/app/apikey
- Create API key
- Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

**Replicate API Token (Optional - for custom images):**
- Go to: https://replicate.com/account/api-tokens
- Create token
- Add to `.env.local`: `REPLICATE_API_TOKEN=your_token_here`
- *Note: Without this, system uses fallback images (still works)*

### 2. Install Dependencies

```bash
cd marshall-web
npm install
```

### 3. Start Dev Server

```bash
npm run dev
```

## Testing with curl

### Test 1: View Available Opportunities

```bash
curl http://localhost:3000/api/posts/generate
```

This shows what the system thinks you should write about.

### Test 2: Auto-Generate Post (Draft)

```bash
curl -X POST http://localhost:3000/api/posts/generate
```

- Uses highest priority opportunity
- Saves as **draft** (not published)
- View in `/admin/posts`

### Test 3: Generate Specific Post

```bash
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gear",
    "topic": "Best Tennis Bag for Travel",
    "publish": false
  }'
```

### Test 4: Generate and Publish Immediately

```bash
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "travel",
    "topic": "Where to Stay in Melbourne for Australian Open",
    "publish": true
  }'
```

### Test 5: Generate Without Marshall in Image

```bash
curl -X POST http://localhost:3000/api/posts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gear",
    "topic": "Wilson Blade Racket Review",
    "includeMarshall": false,
    "publish": false
  }'
```

## Expected Response

```json
{
  "success": true,
  "post": {
    "id": "uuid-here",
    "slug": "best-tennis-bag-for-travel",
    "title": "Best Tennis Bag for Travel",
    "published": false,
    "url": null
  },
  "message": "Post saved as draft"
}
```

## View Generated Posts

1. **Admin Panel:** http://localhost:3000/admin/posts
2. **Blog:** http://localhost:3000/blog (only published posts)
3. **Individual Post:** http://localhost:3000/blog/[slug]

## How Reference System Works

**No static reference file needed!** The system uses:

1. **Automatic Analysis:**
   - Recent posts (prevents repetition)
   - Upcoming tournaments (from Sportradar)
   - Current tournaments
   - Recent news (from RSS)
   - Content gaps (what we haven't covered)

2. **Context Building:**
   - Analyzes what to write about
   - Provides context to Gemini
   - Generates appropriate images

3. **Manual Override:**
   - You can specify type/topic in API call
   - Overrides automatic selection

## Troubleshooting

**"GEMINI_API_KEY not set"**
- Add key to `.env.local`
- Restart dev server: `npm run dev`

**"No content opportunities found"**
- Check Sportradar API key is set
- System will still work with manual topic

**Post not visible on blog**
- Check `published` field (might be draft)
- Visit `/admin/posts` to see all posts
- Set `publish: true` to publish immediately

**Image generation fails**
- System uses fallback images (still works)
- Add `REPLICATE_API_TOKEN` for custom images

## Next Steps After Testing

1. Review generated posts in admin
2. Edit content if needed
3. Publish manually or set `publish: true`
4. Set up cron job for automation (later)
