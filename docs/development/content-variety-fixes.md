# Content Variety Fixes - Preventing Repetitive Posts

## Problem Identified

**Three consecutive travel posts about Open Occitanie** - the system was generating repetitive content instead of diverse topics.

## Root Causes

### 1. **Variety Tracker Didn't Detect "Open Occitanie"**
- Only checked hardcoded tournament keywords (Australian Open, Wimbledon, etc.)
- "Open Occitanie" wasn't in the list → duplicates weren't detected

### 2. **Variety Penalties Were Too Weak**
- Same topic in 3 days: -10 points (too small)
- Same category in 4 days: -3 points (way too small)
- Tournament posts score 50+ points → -3 penalty = still 47 points (above threshold)

### 3. **Active Tournaments Created Multiple Opportunities**
- Every active tournament created 2 opportunities:
  - Tournament update (30 timeliness points)
  - Lifestyle guide (20 affiliate points)
- No check to prevent multiple posts about same tournament

### 4. **Missing Diverse Opportunity Sources**
- No blast-from-past (nostalgia) posts
- No general player profiles (only up-and-coming)
- No news/RSS opportunities
- System was too focused on active tournaments

## Fixes Applied

### Fix 1: Improved Tournament Detection ✅

**Updated `variety-tracker.ts`:**
- Added pattern matching to extract tournament names from titles
- Detects "Open Occitanie", "ATP 250 Montpellier", etc.
- Extracts city names from "Guide to [City]" patterns
- Now detects ANY tournament name, not just hardcoded keywords

### Fix 2: Stronger Variety Penalties ✅

**Updated `scoring.ts`:**
- Same topic in 3 days: **-15 points** (increased from -10)
- Same topic in 7 days: **-8 points** (increased from -5)
- Same tournament in 7 days: **-12 points** (NEW - heavy penalty)
- Travel category in 4 days: **-8 points** (increased from -3)
- Travel category in 7 days: **-5 points** (NEW - medium penalty)

**Result:** Tournament posts now get penalized heavily if we've posted about them recently.

### Fix 3: Block Multiple Posts About Same Tournament ✅

**Updated `content-intelligence.ts`:**
- Added check: If posted about tournament in last 7 days → skip ALL opportunities for that tournament
- Blocks both tournament updates AND lifestyle guides
- Changed `forEach` to `for...of` loop to handle async properly

### Fix 4: Added Diverse Opportunity Sources ✅

**New opportunities created:**
- **Blast-from-past**: 1-2 per month (nostalgia posts)
- **General player profiles**: Top players (Alcaraz, Sinner, Djokovic, etc.)
- **Better variety**: System now creates opportunities beyond just active tournaments

### Fix 5: Stronger Travel Category Blocking ✅

**Updated `content-intelligence.ts`:**
- Lifestyle guides only created if we haven't posted travel content in last 4 days
- Prevents multiple travel posts in short period

## Expected Behavior Now

### Before Fixes:
- Active tournament → 2 opportunities created every run
- Variety penalty: -3 points (too small)
- Result: 3 travel posts about same tournament

### After Fixes:
- Active tournament → Check if posted about it in last 7 days
  - If yes → Skip entirely
  - If no → Create opportunities (but with heavy penalties if travel posted recently)
- Variety penalties: -12 to -15 points (much stronger)
- Diverse opportunities: Blast-from-past, player profiles, etc.

## Testing

**To verify fixes work:**
1. Generate a post about Open Occitanie
2. Run content intelligence again
3. Should see: "⚠️ Skipping Open Occitanie opportunities - already posted about this tournament in last 7 days"
4. Should see diverse opportunities: blast-from-past, player profiles, etc.

## Next Steps

1. **Add more data sources:**
   - RSS news feeds (commented out as TODO)
   - Match results (when available)
   - Weather-based content

2. **Fine-tune penalties:**
   - Monitor if penalties are too strong/weak
   - Adjust based on actual content variety

3. **Add content calendar:**
   - Plan diverse content in advance
   - Ensure mix of topics
