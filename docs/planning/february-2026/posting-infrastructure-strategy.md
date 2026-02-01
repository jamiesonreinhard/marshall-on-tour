# Marshall's Posting Infrastructure Strategy

## 🎯 Goals

- **Frequency:** 1 blog post/day max, 3-4 social posts/day max (realistic, not robotic)
- **Content Mix:**
  - Tournament previews/recaps
  - Match results & analysis (timed to big matches!)
  - **Up-and-coming players** (unique insights, deep dives on rising stars)
  - **Blast from the past** (reminscing about legendary players, classic matches)
  - Gear reviews & quizzes (affiliate links)
  - Travel guides (affiliate links)
  - **Lifestyle posts** (hotels, coffee shops, city walks - all tennis-related)
  - ATP focus, occasional WTA
- **Social Strategy:** 
  - Blog posts get 2-3 social posts that link back
  - **Standalone social posts** (especially X/Twitter) for quick reactions, stream-of-consciousness
- **Match Timing:** Post BEFORE, DURING, and AFTER big matches (finals, semis, top player matchups)
- **API Efficiency:** Minimal API calls, smart caching

---

## 🤔 The Core Question

**Do we need a content calendar, or can we just have a smart job that decides what to post?**

### Answer: **Hybrid Approach** ✅

We need **both**, but with different roles:

1. **Strategic Calendar** (Lightweight) - For high-value, planned content
2. **Dynamic Content Engine** (Smart) - For timely, reactive content

---

## 📊 Proposed System Architecture

### 1. Strategic Content Calendar (20% of content)

**Purpose:** Plan high-value, non-time-sensitive content ahead of time

**What goes here:**
- Tournament previews (1-2 weeks before)
- Major gear reviews (seasonal)
- "Best of" lists (best rackets for clay, etc.)
- Travel guides (before tournament season)
- Quizzes ("What's my ideal racket?")

**How it works:**
- Manual or weekly planning job creates entries
- Job generates posts from calendar entries on scheduled dates
- Low overhead - only plan the important stuff

**Example:**
```
Content Calendar Entry:
- Date: 2026-03-01
- Type: Tournament Preview
- Tournament: Indian Wells
- Content: "Marshall's Guide to Indian Wells 2026"
- Affiliate: Hotels, gear for desert conditions
```

---

### 2. Dynamic Content Engine (80% of content)

**Purpose:** Automatically decide and generate the best post for right now

**How it works:**
1. **Content Intelligence Job** runs 2-3x/day
2. Evaluates current opportunities:
   - Active tournaments (what's happening today?)
   - Recent results (who won yesterday?)
   - News (any breaking tennis news?)
   - Weather (tournament location weather for travel posts)
   - Calendar check (what's already planned?)
3. **Scoring System** ranks opportunities:
   ```
   Score = (
     Timeliness (0-30 points) +
     Affiliate Potential (0-25 points) +
     SEO Value (0-20 points) +
     Content Variety (0-15 points) +
     Social Engagement Potential (0-10 points)
   )
   ```
4. **Decision Logic:**
   - If top score > threshold AND no recent similar post → Generate
   - If calendar entry exists for today → Use calendar (higher priority)
   - If too many posts recently → Skip (maintain realistic frequency)

**Example Decision Flow:**
```
Job runs at 8 AM:
- Active tournament: Indian Wells (Day 3)
- Recent result: Alcaraz won yesterday
- News: New racket release
- Calendar: Nothing scheduled

Scoring:
1. "Alcaraz wins at Indian Wells" - 65 points (timely, high engagement)
2. "New racket review" - 45 points (affiliate potential, but less timely)
3. "Indian Wells Day 3 preview" - 55 points (timely, but less unique)

Decision: Generate Alcaraz post (highest score)
```

---

## 🔄 Background Jobs

### Job 1: Match Monitor (Every 30 minutes during active tournaments)
**Schedule:** Runs continuously when tournaments are active

**What it does:**
1. Check active tournaments (from `atp_calendar` table)
2. For each active tournament:
   - Detect "big matches" (finals, semis, top 10 player matchups)
   - Check match schedule (when is the match?)
   - Check match status (upcoming, live, finished)
3. **Timing Logic:**
   - **3 hours before big match** → Generate preview blog post + social posts
   - **1 hour before big match** → X/Twitter standalone post (quick thoughts)
   - **During match** → X/Twitter standalone posts (live reactions, 1-2 posts)
   - **Immediately after match** → X/Twitter standalone post (quick reaction)
   - **2 hours after match** → Blog post analysis + social posts

**Big Match Detection:**
```typescript
function isBigMatch(match: Match): boolean {
  // Finals, semis always big
  if (match.round === 'F' || match.round === 'SF') return true;
  
  // Top 10 player matchups
  const top10Players = ['Alcaraz', 'Djokovic', 'Sinner', 'Medvedev', ...];
  const hasTop10 = match.players.some(p => top10Players.includes(p.name));
  if (hasTop10 && match.players.length === 2) return true;
  
  // Grand Slam matches (always important)
  if (match.tournament.category === 'Grand Slam') return true;
  
  return false;
}
```

**API Calls:**
- Match schedule: Only during active tournaments (cached 15 min)
- Match results: Only for big matches (cached 5 min during match)

### Job 2: Content Intelligence (2-3x/day)
**Schedule:** 8 AM, 2 PM, 8 PM (or adjust based on timezone)

**What it does:**
1. Check active tournaments (from `atp_calendar` table)
2. Check recent results (from matches table or API)
3. Check news feeds (RSS parsing)
4. Check weather (for travel posts)
5. Check content calendar (what's already planned?)
6. **Check tournament locations** (for lifestyle posts)
7. Score all opportunities
8. If top opportunity > threshold → Generate post
9. Schedule social posts to promote the blog post

**API Calls:**
- Weather API: Only for active tournaments (cached 6 hours)
- News RSS: Once per job run (cached 1 hour)
- Match results: Only during active tournaments (cached 30 min)
- Google Maps API: For lifestyle posts (cached 24 hours)

### Job 2: Calendar Post Generator (Daily)
**Schedule:** 6 AM (before content intelligence)

**What it does:**
1. Find calendar entries scheduled for today
2. Generate posts from calendar entries
3. Mark entries as "generated"

### Job 3: Social Post Scheduler (After blog post generation)
**Schedule:** Triggered after blog post creation

**What it does:**
1. When blog post is created → Create 2-3 social posts
2. Schedule social posts:
   - Instagram: Same day, different times
   - X/Twitter: Same day, different times
3. Social posts link back to blog post

---

## 📈 Content Variety System

**Problem:** Avoid posting about the same thing repeatedly

**Solution:** Track recent content topics

```typescript
interface ContentHistory {
  lastPostDate: Date;
  topics: string[]; // ['alcaraz', 'indian-wells', 'gear']
  categories: string[]; // ['analysis', 'gear', 'travel']
}

// Before generating, check:
- Hasn't posted about this player in 3 days
- Hasn't posted about this tournament in 2 days
- Hasn't posted gear content in 4 days
- Mix of categories (not all analysis)
```

---

## 🎯 Posting Frequency Logic

**Rules:**
- Max 1 blog post per day
- Max 3-4 social posts per day
- If blog post created → 2-3 social posts automatically
- If no blog post → 1-2 standalone social posts (quotes, quick tips)

**Implementation:**
```typescript
function shouldGeneratePost(): boolean {
  const today = new Date();
  const postsToday = getPostsCreatedToday();
  const socialPostsToday = getSocialPostsToday();
  
  // Already posted enough today
  if (postsToday.length >= 1) return false;
  if (socialPostsToday.length >= 4) return false;
  
  // Check if we've posted recently (avoid spam)
  const lastPost = getLastPostDate();
  const hoursSinceLastPost = (today - lastPost) / (1000 * 60 * 60);
  if (hoursSinceLastPost < 12) return false; // Min 12 hours between posts
  
  return true;
}
```

---

## 🔗 Social → Blog Strategy

### Blog Post Social Promotion
**Every blog post gets:**
1. **Instagram Post 1** (morning): Teaser image + "Read more" link
2. **Instagram Post 2** (evening): Quote or key insight from post
3. **X/Twitter Post 1** (morning): Hook + link
4. **X/Twitter Post 2** (afternoon): Key stat/fact + link

### Standalone Social Posts (No Blog Link)
**X/Twitter is perfect for:**
- **Match reactions** (during/after big matches)
  - "Alcaraz just hit an INSANE forehand. This match is 🔥"
  - "Djokovic's return game is unreal. How does he do it?"
- **Stream-of-consciousness** (quick thoughts)
  - "Walking around Melbourne before the final. The energy here is electric."
  - "Just tried the best coffee in Indian Wells. Perfect spot to watch the matches."
- **Live tournament updates**
  - "Semifinals starting in 30 minutes. Who you got?"
  - "This court is FAST. Gonna be a serve-fest."
- **Quick tips** (no blog needed)
  - "Pro tip: If you're going to a tournament, book hotels 2+ miles away. Way cheaper."
- **Gear recommendations** (with affiliate link, no blog)
  - "Just switched to this racket and my serve improved 10%. Link in bio."

**Instagram standalone posts:**
- Less frequent (maybe 1-2/week)
- Visual content (coffee shop photos, hotel views, city walks)
- Still tennis-related context

---

## 💡 Recommendation: **Hybrid System**

### Keep Content Calendar For:
- ✅ Tournament previews (plan 1-2 weeks ahead)
- ✅ Major gear reviews (seasonal planning)
- ✅ Travel guides (before tournament season)
- ✅ Quizzes and interactive content

### Use Dynamic Engine For:
- ✅ **Match-timed posts** (before/during/after big matches)
- ✅ Match results & analysis
- ✅ Breaking news reactions
- ✅ Daily tournament updates
- ✅ Weather-based travel tips
- ✅ **Up-and-coming player spotlights** (deep dives on rising stars, unique insights)
- ✅ **Blast from the past** (classic players, legendary matches, YouTube highlights)
- ✅ **Lifestyle posts** (hotels, coffee shops, city walks - tied to tournament locations)

### Why This Works:
1. **Less Planning Overhead** - Only plan the strategic stuff
2. **More Flexibility** - React to real-time events
3. **Better Variety** - Scoring system ensures diversity
4. **Higher Value** - Always posting the most relevant content
5. **Realistic Frequency** - Smart logic prevents over-posting

---

## 🚀 Implementation Priority

### Phase 1: Match Monitor (MVP - Highest Value)
1. **Match detection system** (detect big matches from tournament schedule)
2. **Timing logic** (3h before, 1h before, during, after, 2h after)
3. **Standalone X posts** for match reactions
4. **Blog post generation** for previews and analysis

### Phase 2: Dynamic Engine
1. Content Intelligence Job
2. Basic scoring system
3. Post generation from top opportunity
4. Simple variety tracking

### Phase 3: Social Automation
1. Auto-create social posts from blog posts
2. Social post scheduling
3. Link tracking
4. **Standalone social post types** (match reactions, lifestyle, quick tips)

### Phase 4: Lifestyle Content
1. **Tournament location detection** (where is Marshall "traveling"?)
2. **Google Maps integration** (find hotels, coffee shops near tournaments)
3. **Lifestyle post generation** (hotels, coffee, walks - all tennis-related)
4. **Travel affiliate link integration**

### Phase 5: Calendar Integration
1. Calendar entries take priority
2. Calendar + dynamic work together
3. Weekly planning job

### Phase 6: Advanced Features
1. A/B testing post topics
2. Performance tracking
3. Affiliate optimization
4. SEO optimization

---

## 📝 Example Daily Flow (Australian Open Final Day)

**6 AM - Calendar Job:**
- Checks calendar: Nothing scheduled
- No action

**8 AM - Match Monitor:**
- Detects: Alcaraz vs Djokovic final at 3 PM today
- **3 hours before match (12 PM):**
  - Generates preview blog post: "Alcaraz vs Djokovic: Australian Open Final Preview"
  - Creates social posts promoting blog

**1 PM - Match Monitor (1 hour before):**
- **1 hour before match:**
  - Creates standalone X post: "One hour until the final. The energy in Melbourne is INSANE. Who you got? 🎾"

**3 PM - Match Monitor (during match):**
- **During match (live):**
  - Creates standalone X post: "Alcaraz's forehand is on fire. This is why he's #1. 🔥"
  - Creates standalone X post: "Djokovic's return game is unreal. How does he read serves like that?"

**5 PM - Match Monitor (immediately after):**
- **Immediately after match:**
  - Creates standalone X post: "WHAT A MATCH. Alcaraz takes it in 5. That was tennis at its absolute best. 🏆"

**7 PM - Match Monitor (2 hours after):**
- **2 hours after match:**
  - Generates analysis blog post: "Alcaraz Wins Australian Open: 5 Key Moments That Decided the Final"
  - Creates social posts promoting blog

**8 AM - Content Intelligence:**
- Checks: Blog post already created (preview)
- Checks tournament location: Melbourne
- Scores lifestyle opportunity: 60 points
- Decision: Create lifestyle blog post: "Marshall's Guide to Melbourne: Best Coffee Shops Near the Australian Open"
- Includes hotel affiliate links, coffee shop recommendations

**Result:**
- 2 blog posts (preview + analysis + lifestyle)
- 6 social posts (4 from blogs, 2 standalone X posts during match)
- All feel natural, timely, and authentic

---

## 🌟 Up-and-Coming Player Content

### The Unique Value
Marshall should highlight players most people don't know about yet - this is his differentiator!

**Content Types:**
1. **Deep Dive Profiles**
   - "Meet [Player Name]: The 19-Year-Old Taking the ATP by Storm"
   - Include: Background, playing style, recent results, why they're special
   - Post timing: When they have a breakthrough result

2. **Tournament Breakthroughs**
   - "Who is [Player Name]? The Qualifier Who Just Beat a Top 10 Player"
   - Post timing: Immediately after big upset

3. **Rising Star Series**
   - "5 Players to Watch in 2026" (quarterly)
   - "The Next Generation: ATP Players Under 21"
   - Post timing: Between major tournaments

**How to Find Opportunities:**
- Monitor qualifiers who make deep runs
- Track players ranked 50-200 who beat top players
- Follow junior/college tennis for future stars
- Watch for players with unique playing styles

**Example:**
```
Player: 19-year-old qualifier beats #8 seed
→ Generate: "Meet [Name]: The Qualifier Who Just Shocked Indian Wells"
→ Include: Their background, playing style, why this matters
→ SEO: "[Player name] Indian Wells", "rising tennis star 2026"
```

---

## 🎬 Blast from the Past Series

### The Concept
Marshall reminisces about legendary players, classic matches, and tennis history.

**Content Types:**
1. **Player Tributes**
   - "Remembering [Legendary Player]: Why They Changed Tennis Forever"
   - Include: Career highlights, impact on the game, YouTube highlights
   - Post timing: Anniversaries, birthdays, or when relevant to current events

2. **Classic Match Recaps**
   - "The 2008 Wimbledon Final: Why It's Still the Greatest Match Ever"
   - Include: Match breakdown, key moments, YouTube highlights
   - Post timing: Anniversaries or when similar match happens

3. **Era Comparisons**
   - "Federer vs Alcaraz: How Tennis Has Changed in 20 Years"
   - Post timing: When current players break records

**YouTube Integration:**
```typescript
// Search YouTube for highlights
function findMatchHighlights(playerName: string, matchYear: number) {
  // Use YouTube Data API v3
  // Search: "[Player Name] [Year] highlights"
  // Filter: Official channels, high view count
  // Return: Top 3-5 video links
}
```

**Implementation:**
- YouTube Data API v3 (free tier: 10,000 units/day)
- Search for: "[Player] [Tournament] [Year] highlights"
- Filter by: Official channels, verified uploaders
- Include 2-3 video links in post

**Post Frequency:**
- 1-2 per month (special content, not too frequent)
- Great for SEO (evergreen content)
- High engagement (nostalgia factor)

**Example:**
```
Topic: "Remembering Roger Federer's 2009 French Open Win"
→ Search YouTube: "Federer 2009 French Open highlights"
→ Find: Official ATP/Wimbledon channel videos
→ Generate post with embedded videos
→ SEO: "Federer French Open 2009", "greatest tennis comebacks"
```

---

## 🎾 Lifestyle Content Strategy

### The Tennis Connection
Every lifestyle post must tie back to tennis:
- ✅ "Best Coffee Shops Near Indian Wells" (tournament location)
- ✅ "Where to Stay in Melbourne During the Australian Open" (tournament timing)
- ✅ "My Morning Walk in Paris Before Roland-Garros" (tournament context)
- ❌ "Random Coffee Shop in NYC" (no tennis connection)

### Content Types

**1. Hotel Guides (High Affiliate Value)**
- "Marshall's Hotel Picks for Indian Wells 2026"
- Include: Distance to venue, price range, amenities
- Affiliate links: Booking.com, Expedia
- Post timing: 1-2 weeks before tournament

**2. Coffee Shop Finds**
- "Best Coffee Near [Tournament Venue]"
- Include: Walking distance, vibe, Marshall's favorite order
- Affiliate links: None (authenticity)
- Post timing: During tournament (feels real-time)

**3. City Walks & Exploration**
- "Marshall's 2-Hour Walk Through [Tournament City]"
- Include: Route, landmarks, tennis-related stops
- Affiliate links: None (authenticity)
- Post timing: During tournament

**4. Restaurant Recommendations**
- "Where to Eat in [Tournament City] During [Tournament]"
- Include: Price range, cuisine, proximity to venue
- Affiliate links: OpenTable, Resy (if available)
- Post timing: During tournament

### Implementation
```typescript
// When tournament is active, generate lifestyle posts
function generateLifestylePost(tournament: Tournament) {
  const location = tournament.location;
  
  // Use Google Maps API to find:
  // - Hotels within 5 miles
  // - Coffee shops within 2 miles
  // - Walking routes from hotels to venue
  
  return {
    type: 'lifestyle',
    topic: `Marshall's Guide to ${location.city}`,
    content: {
      hotels: findHotels(location, { maxDistance: 5, affiliate: true }),
      coffee: findCoffeeShops(location, { maxDistance: 2 }),
      walks: generateWalkingRoute(location, tournament.venue),
    },
    affiliateLinks: extractAffiliateLinks(hotels),
  };
}
```

## 👤 Marshall's Current State

### The Concept
Track Marshall's "current state" to make content feel more authentic and personal.

**What We Track:**
- Current racket (which racket is he playing with now?)
- Current location (city, hotel, coffee shop)
- Next location (where is he traveling next?)
- Current favorites (gear, players, tournaments)
- Favorite players (who is he following closely?)
- Up-and-coming player he's watching (for content ideas)

**Use Cases:**
1. **Content Generation** - "I'm currently testing the [racket] and here's what I think..."
2. **Lifestyle Posts** - "Currently in Melbourne, staying at [hotel], found this amazing coffee shop..."
3. **Website Display** - Show Marshall's current state on the site (adds authenticity)
4. **Social Posts** - "Just landed in Indian Wells. This place is 🔥"

**Database Schema:**
```sql
create table public.marshall_state (
  id uuid default gen_random_uuid() primary key,
  
  -- Current Gear
  current_racket text,
  current_racket_affiliate_link text,
  current_shoes text,
  current_shoes_affiliate_link text,
  other_gear jsonb, -- { bag: "...", strings: "...", etc. }
  
  -- Current Location
  current_city text,
  current_country text,
  current_hotel text,
  current_hotel_affiliate_link text,
  current_coffee_shop text,
  arrived_at timestamp with time zone,
  leaving_at timestamp with time zone,
  
  -- Next Location
  next_city text,
  next_country text,
  next_tournament_id uuid references public.atp_calendar(id),
  traveling_to_at timestamp with time zone,
  
  -- Preferences
  favorite_players text[], -- ['Alcaraz', 'Sinner', ...]
  up_and_coming_player_watching text, -- Player he's keeping an eye on
  favorite_tournaments text[], -- ['Wimbledon', 'Indian Wells', ...]
  current_interests text[], -- ['clay court season', 'racket technology', ...]
  
  -- Metadata
  updated_at timestamp with time zone default now() not null,
  updated_by text default 'system' -- 'system' or 'manual'
);
```

**Auto-Update Logic:**
- When tournament starts → Update current location
- When tournament ends → Update next location (next tournament)
- When gear post created → Update current racket
- When up-and-coming player post created → Update watching player

**Manual Updates:**
- Admin can manually update Marshall's state
- Useful for testing new gear, planning content

**Website Display:**
```tsx
// Show on homepage or about page
<MarshallStatus>
  Currently in: Melbourne, Australia
  Playing with: Wilson Blade 98
  Watching: 19-year-old qualifier making waves
  Next stop: Indian Wells
</MarshallStatus>
```

---

## ✅ Final Answer

**You don't need to schedule everything ahead of time.**

Use the calendar for **strategic, high-value content** (20%), and let the **dynamic engine handle day-to-day content** (80%) based on what's happening right now.

**Key Behaviors to Mimic:**
1. ✅ **Match-timed posts** - Post before, during, and after big matches
2. ✅ **Standalone social posts** - X/Twitter for quick reactions, stream-of-consciousness
3. ✅ **Lifestyle content** - Hotels, coffee, walks - all tied to tournament locations
4. ✅ **Up-and-coming players** - Deep dives on rising stars (Marshall's differentiator!)
5. ✅ **Blast from the past** - Classic players, legendary matches, YouTube highlights
6. ✅ **Marshall's current state** - Track gear, location, favorites for authentic content

The key is having a **smart scoring system** that ensures you're always posting the highest-value content at the right time, while maintaining variety and realistic frequency.
