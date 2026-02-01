# Free Tennis Data Strategy

## 🎯 The Problem

Sportradar trial expires 03/02/2026 and paid plans are expensive. We need free alternatives for:
- **Match schedules** (upcoming matches)
- **Match results** (scores, winners)
- **Player profiles** (rankings, stats, head-to-head)
- **Tournament draws** (who plays who)

---

## ✅ What We Already Have (Free)

1. **Tournament Calendar** ✅
   - Static 2026 ATP calendar loaded
   - Knows when/where tournaments happen
   - Enough for preview/recap posts!

2. **RSS Feeds** ✅
   - ESPN, BBC, Tennis.com
   - Breaking news, match results in headlines
   - Free, reliable

3. **YouTube API** ✅
   - Find match highlights
   - Free tier: 10,000 units/day

---

## 🆓 Free Data Sources

### Option 1: ATP Website Scraping (Best for Match Data)

**ATP Official Site: `atptour.com`**

**What we can get:**
- Match schedules (draws, order of play)
- Live scores during tournaments
- Player profiles (rankings, stats)
- Tournament results

**Implementation:**
```typescript
// Scrape only during active tournaments
// Use calendar to know when tournaments are happening
// Cache results in database
```

**Pros:**
- Free
- Official source (most accurate)
- Real-time during tournaments
- Player rankings updated weekly

**Cons:**
- Requires scraping (fragile)
- Rate limiting
- Legal considerations (check ToS)

**Specific Pages to Scrape:**
- `https://www.atptour.com/en/scores/current/{tournament-id}/draws` - Draws
- `https://www.atptour.com/en/scores/current/{tournament-id}/live-scores` - Live scores
- `https://www.atptour.com/en/rankings/singles` - Rankings (weekly)
- `https://www.atptour.com/en/players/{player-name}` - Player profiles

---

### Option 2: FlashScore (Best for Live Scores)

**FlashScore: `flashscore.com`**

**What we can get:**
- Live scores
- Match schedules
- Results
- Head-to-head records

**Why it's good:**
- Has API-like JSON endpoints (easier to scrape)
- Updates in real-time
- Covers all tournaments
- Mobile-friendly structure

**Example endpoint structure:**
```
https://www.flashscore.com/tennis/atp-singles/{tournament}/results/
```

**Pros:**
- Free
- Real-time updates
- API-like structure
- Comprehensive coverage

**Cons:**
- Still requires scraping
- May have rate limits
- Check ToS

---

### Option 3: ESPN Tennis (Best for Results)

**ESPN Tennis: `espn.com/tennis`**

**What we can get:**
- Match results
- Player stats
- Tournament summaries
- News with match context

**RSS Feed:**
- `https://www.espn.com/tennis/rss.xml` (already integrated!)

**Pros:**
- Free RSS feed
- Reliable
- Good for recaps

**Cons:**
- Limited detail in RSS
- May need to parse headlines

---

### Option 4: Manual Entry (Most Reliable)

**For Key Matches Only**

**What to track manually:**
- Grand Slam finals/semis
- ATP 1000 finals
- Top 10 player matches
- Upsets

**Database table:**
```sql
create table public.matches (
  id uuid primary key,
  tournament_id uuid references atp_calendar(id),
  player1_name text,
  player2_name text,
  scheduled_time timestamp,
  status text,
  score jsonb,
  winner text,
  round text,
  source text default 'manual'
);
```

**Pros:**
- 100% reliable
- No API costs
- Full control
- No legal issues

**Cons:**
- Time-consuming
- Not scalable for all matches

**Best for:**
- 4 Grand Slams/year
- 9 ATP 1000 Masters/year
- Focus on matches that matter for content

---

### Option 5: ATP Rankings (Static Scraping)

**ATP Rankings Page: `atptour.com/en/rankings/singles`**

**What we can get:**
- Top 100 rankings (updated weekly)
- Player names, countries
- Points

**Implementation:**
- Scrape once per week (Monday after tournaments)
- Store in `players` table
- Use for player profiles

**Pros:**
- Free
- Official source
- Only need to scrape weekly
- Stable page structure

---

## 🚀 Recommended Hybrid Strategy

### Phase 1: Start Without Match Data (Now)

**You already have enough to start!**

1. ✅ **Tournament Calendar** - Know when/where tournaments happen
2. ✅ **Preview Posts** - Write before tournaments start
3. ✅ **Recap Posts** - Write after tournaments end (use RSS for results)
4. ✅ **Travel Content** - Based on tournament locations
5. ✅ **Lifestyle Posts** - Hotels, coffee, walks (Google Maps)

**Content you can create:**
- "Indian Wells 2026 Preview: What to Watch"
- "Marshall's Guide to Miami Open"
- "5 Reasons to Watch the French Open"
- "Best Hotels Near Wimbledon"
- "Indian Wells 2026 Recap: What We Learned"

**You don't need match-by-match data for this!**

---

### Phase 2: Add Selective Match Tracking (When Revenue Justifies)

**Option A: Manual Entry (Recommended First)**
- Enter key matches manually (finals, semis, top player matches)
- Use for match-timed posts
- Start with Grand Slams only

**Option B: Simple Scraping**
- Scrape ATP website during active tournaments only
- Store in `matches` table
- Use for real-time content

**Option C: RSS + Parsing**
- Parse ESPN/BBC RSS for match results
- Extract player names, scores from headlines
- Store in database

---

### Phase 3: Full Automation (If Revenue Justifies Paid API)

- Consider Sportradar paid plan
- Or build robust scraper with error handling
- Monitor and maintain

---

## 📊 Implementation Priority

### High Priority (Do Now)
1. ✅ Tournament calendar (done)
2. ✅ RSS feeds (done)
3. ✅ Weather, Maps, YouTube (done)
4. ⏳ Manual match entry UI (for key matches)

### Medium Priority (Do Later)
1. ATP rankings scraper (weekly)
2. RSS result parsing (extract scores from headlines)
3. Simple ATP draw scraper (during tournaments only)

### Low Priority (Do When Revenue Justifies)
1. Full match scraping automation
2. Paid Sportradar subscription
3. Real-time score tracking

---

## 💡 Content Strategy Without Match Data

**You can create great content with just the calendar:**

### 1. Tournament Previews (Before Start)
- "What to expect at Indian Wells 2026"
- "Marshall's guide to Miami Open"
- "5 reasons to watch the French Open"
- "Players to watch at Wimbledon"

### 2. Travel Guides (During Tournament)
- "Best hotels near Indian Wells"
- "Where to eat in Miami during the Open"
- "Marshall's Paris travel guide"
- "Coffee shops near Wimbledon"

### 3. Tournament Recaps (After End)
- "Indian Wells 2026: What we learned"
- "Miami Open highlights"
- "French Open wrap-up"
- Use RSS feeds for match results in recaps

### 4. Gear Reviews (Anytime)
- "Best rackets for clay season"
- "Shoes for hard courts"
- "Marshall's gear picks"

### 5. Lifestyle Content (Anytime)
- "Walking tour of Melbourne during Australian Open"
- "Best coffee in Indian Wells"
- "Hotels with tennis courts"

---

## 🎯 Next Steps

1. **Start creating content** with what you have (calendar + RSS + weather + maps)
2. **Add manual match entry** for key matches (finals, semis)
3. **Build ATP rankings scraper** (weekly, low maintenance)
4. **Consider scraping** only when revenue justifies the maintenance

**Bottom line:** You have enough data to start. Match data is nice-to-have, not essential for MVP. Focus on creating great content with the calendar, and add match tracking later when you have revenue to justify it.

---

## 🔧 Technical Implementation

### ATP Rankings Scraper (Weekly)

```typescript
// lib/data/integrations/atp-scraper.ts
export async function scrapeATPRankings(): Promise<Player[]> {
  // Scrape atptour.com/en/rankings/singles
  // Parse HTML, extract top 100
  // Store in database
  // Run weekly via cron
}
```

### RSS Result Parser

```typescript
// lib/data/integrations/rss-parser.ts
export function parseMatchResultFromRSS(newsItem: NewsItem): Match | null {
  // Parse headlines like "Alcaraz defeats Djokovic 6-4, 7-6"
  // Extract player names, scores
  // Return Match object
}
```

### Manual Match Entry UI

```typescript
// app/admin/matches/page.tsx
// Simple form to enter:
// - Tournament
// - Player 1, Player 2
// - Scheduled time
// - Round
// - Score (after match)
```

---

## 📚 Resources

- **ATP Official:** https://www.atptour.com
- **FlashScore:** https://www.flashscore.com/tennis/
- **ESPN Tennis RSS:** https://www.espn.com/tennis/rss.xml
- **BBC Sport Tennis RSS:** https://feeds.bbci.co.uk/sport/tennis/rss.xml

---

## ⚠️ Legal Considerations

- **Check Terms of Service** before scraping
- **Respect rate limits** (don't hammer servers)
- **Cache aggressively** (don't re-scrape unnecessarily)
- **Use RSS feeds** when available (more reliable)
- **Consider manual entry** for key matches (no legal issues)
