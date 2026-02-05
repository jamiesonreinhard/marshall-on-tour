# Post Generation V2 System

## Overview

The new post generation system uses **type-specific handlers** that gather comprehensive data before generating posts. This ensures every post has rich, accurate information from multiple sources.

## Architecture

### Process Flow

1. **Job runs** → Reviews recent posts, calendar, RSS feeds
2. **Scores opportunities** → Picks the best one
3. **Handler selected** → Type-specific handler gathers data
4. **Data gathered** → Players, weather, videos, news, etc.
5. **Gemini generates** → Rich prompt with all data
6. **Fact checker** → Validates claims
7. **Editor refines** → Maintains Marshall's voice
8. **Image generated** → Based on post type
9. **Post saved** → Draft or published

### Type-Specific Handlers

Each handler knows exactly what data it needs:

#### Analysis Handler (`analysis-handler.ts`)
- **Handles:** Match analysis, player profiles, tournament recaps, news
- **Gathers:**
  - Player stats and profiles
  - Head-to-head records
  - Match data and results
  - Recent news (filtered by relevance)
  - Weather data (for tournament context)
  - Player rankings (top 20)

#### Nostalgia Handler (`nostalgia-handler.ts`)
- **Handles:** Historical player profiles, classic matches
- **Gathers:**
  - Historical player data (from JSON file)
  - YouTube videos (match highlights, classic matches)
  - Player achievements and career highlights
  - Era and playing style information

#### Gear Handler (`gear-handler.ts`)
- **Handles:** Gear guides, product reviews
- **Gathers:**
  - Product data from database
  - Specifications and features
  - Affiliate links
  - Price ranges

#### Travel Handler (`travel-handler.ts`)
- **Handles:** Tournament previews, travel guides
- **Gathers:**
  - Tournament data
  - Weather forecasts
  - Hotels (nearby, with ratings)
  - Coffee shops
  - Restaurants
  - Walking routes (future)

#### Lifestyle Handler (`lifestyle-handler.ts`)
- **Handles:** Lifestyle guides, day updates
- **Gathers:**
  - Marshall's current state (location, gear)
  - Tournament context
  - Recent tennis news

## Manual Post Generation

### UI: `/admin/posts/generate`

A new form allows manual post generation with:
- **Post type selection** (analysis, gear, travel, etc.)
- **Topic/Title** input
- **Additional instructions** (for specific guidance)
- **Tournament ID** (optional, for richer data)
- **Publish immediately** toggle
- **Include Marshall in image** option

### API: `/api/posts/generate`

Supports:
- `type`: Post type
- `topic`: Post topic/title
- `manualInstructions`: Additional AI guidance
- `tournamentId`: Optional tournament ID
- `publish`: Publish immediately (default: false)
- `includeMarshall`: Include Marshall in image (default: auto)
- `useV2`: Use V2 generator (default: true)

## Historical Player Data

### JSON File: `lib/data/historical-players.json`

Contains structured data for historical players:
- Name, full name, era
- Country, active years
- Grand Slam titles, ATP titles
- Playing style
- Notable achievements
- Career highlights
- Rivalries
- Retirement year

### Integration: `lib/data/integrations/historical-players.ts`

Loads data from JSON file and provides:
- `getHistoricalPlayerData(playerName)` - Get player data by name

## Data Sources

Each handler uses multiple data sources:

- **Player Data:** `lib/data/integrations/player-data.ts`
- **YouTube:** `lib/data/integrations/youtube.ts`
- **Weather:** `lib/data/integrations/weather.ts`
- **Google Maps:** `lib/data/integrations/google-maps.ts`
- **RSS/News:** `lib/data/integrations/rss.ts`
- **Sportradar:** `lib/data/integrations/sportradar-matches.ts`
- **Gear:** `lib/data/integrations/gear.ts`
- **Historical Players:** `lib/data/integrations/historical-players.ts`

## Usage

### Automatic (Content Intelligence Job)

The job automatically uses V2 generator:

```typescript
import { runContentIntelligenceJob } from '@/lib/jobs/content-intelligence';

const result = await runContentIntelligenceJob();
```

### Manual (API)

```bash
POST /api/posts/generate
{
  "type": "analysis",
  "topic": "Alcaraz vs Sinner: French Open Semifinal Analysis",
  "manualInstructions": "Focus on tactical battle and weather impact",
  "tournamentId": "uuid-here",
  "publish": false
}
```

### Direct (Code)

```typescript
import { generatePostFromOpportunityV2 } from '@/lib/jobs/post-generator-v2';
import { ContentOpportunity } from '@/lib/jobs/scoring';

const opportunity: ContentOpportunity = {
  id: 'manual-123',
  type: 'analysis',
  topic: 'Player Analysis',
  // ...
};

const result = await generatePostFromOpportunityV2(opportunity, {
  publish: false,
  manualInstructions: 'Focus on playing style',
});
```

## Benefits

1. **Rich Data:** Every post has comprehensive, accurate data
2. **Type-Specific:** Each handler knows exactly what it needs
3. **Reliable Sources:** Multiple data sources ensure accuracy
4. **Manual Override:** Can generate posts manually when job fails
5. **Better Prompts:** Gemini gets rich context, not just topic
6. **Fact-Checked:** All posts go through fact-checking and editing

## Migration

- **V1 Generator:** Still available (`post-generator.ts`)
- **V2 Generator:** New default (`post-generator-v2.ts`)
- **Content Intelligence:** Uses V2 by default
- **API:** Uses V2 by default (can disable with `useV2: false`)

## Future Enhancements

- [ ] Wikipedia integration for historical players
- [ ] Grokpedia integration for richer data
- [ ] More data sources per handler
- [ ] Caching for expensive API calls
- [ ] Better error handling and retries
