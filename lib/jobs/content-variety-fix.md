# Content Variety Problem Analysis

## The Problem

**Three consecutive travel posts about Open Occitanie** - the system is generating repetitive content instead of diverse topics.

## Root Causes

### 1. **Active Tournaments Create Multiple Opportunities Every Run**

For each active tournament, the system creates:
- Tournament update opportunity (30 timeliness points)
- Lifestyle guide opportunity (20 affiliate points)

**Total: 50 points** - Even with variety penalty, still scores high.

### 2. **Variety Penalties Are Too Weak**

Current penalties:
- Same topic in 3 days: -10 points
- Same category in 4 days: -3 points

**Problem:** 
- Tournament update: 30 + 15 + 10 + 7 = 62 points → -3 = **59 points** ✅ (above 50 threshold)
- Lifestyle guide: 10 + 20 + 10 + 4 = 44 points → -3 = **41 points** ❌ (below threshold, but still gets through if it's the only option)

### 3. **Variety Tracker Doesn't Detect "Open Occitanie"**

The variety tracker only checks for common tournament keywords:
- 'australian open', 'french open', 'wimbledon', etc.
- **"Open Occitanie" is NOT in the list** - so it doesn't detect duplicates!

### 4. **Missing Diverse Opportunity Sources**

The system only creates opportunities from:
- ✅ Active tournaments (creates 2 per tournament)
- ✅ Upcoming tournaments (previews)
- ✅ Recently ended tournaments (recaps)
- ✅ Content calendar
- ✅ Marshall's state (gear, up-and-coming players) - but only if conditions are met

**Missing:**
- ❌ Blast-from-past (nostalgia posts)
- ❌ General player profiles (not just up-and-coming)
- ❌ News/RSS opportunities (commented out as TODO)
- ❌ General analysis opportunities
- ❌ Match analysis (when we have match data)

### 5. **No Tournament-Specific Blocking**

The system checks `hasPostedAboutTournament(tournament.name, 2)` but:
- Only checks last 2 days (too short)
- Doesn't check if we've posted about the SAME tournament multiple times
- Doesn't block lifestyle guides for tournaments we've already covered

## Solutions

### Fix 1: Stronger Variety Penalties

**For same tournament:**
- If posted about tournament in last 7 days: -15 points (heavy penalty)
- If posted in same category in last 4 days: -5 points (increased from -3)

**For same topic:**
- If posted about exact topic in last 3 days: -15 points (increased from -10)

### Fix 2: Add Tournament Name Detection

Update variety tracker to:
- Extract tournament names from post titles (not just keywords)
- Check if title contains tournament name
- Block if we've posted about same tournament in last 7 days

### Fix 3: Add Diverse Opportunity Sources

Add:
- Blast-from-past (1-2 per month)
- General player profiles (top 10 players)
- News opportunities (from RSS feeds)
- General analysis opportunities

### Fix 4: Block Multiple Posts About Same Tournament

Add explicit check:
- If we've posted about this tournament in last 7 days → don't create new opportunities
- Apply to BOTH tournament updates AND lifestyle guides

### Fix 5: Increase Category Penalty for Travel

Travel/lifestyle posts should have stronger penalties:
- If posted travel in last 4 days: -8 points (instead of -3)
- If posted travel in last 7 days: -5 points
