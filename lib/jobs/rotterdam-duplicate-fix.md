# Rotterdam Duplicate Post Fix

## Problem

Two consecutive posts about ABN AMRO Open (Rotterdam) were created on the same day:
1. "Rotterdam's ABN AMRO Open: An Insider's Guide to Dutch Tennis & Design"
2. "ABN AMRO Open Rotterdam: Your Cultured Guide to Indoor Tennis Bliss"

## Root Causes

### 1. **Tournament Name Extraction Fails for "ABN AMRO Open"**

The pattern matching doesn't properly extract "ABN AMRO Open":
- Pattern 1: `/(?:^|\s)([a-z]+(?:\s+[a-z]+)*)\s+(?:preview|recap|guide|travel|2026|day update)/i`
  - Matches "Rotterdam's ABN AMRO Open..." but might extract "rotterdam's" instead of "abn amro open"
- Pattern 2: `/(?:^|\s)(open\s+[a-z]+)/i`
  - Matches "Open Occitanie" but NOT "ABN AMRO Open" (because "open" is at the end, not beginning)
- Pattern 3: City extraction
  - Extracts "Rotterdam" but doesn't link it to "ABN AMRO Open"

**Result:** `hasPostedAboutTournament("ABN AMRO Open", 7)` returns false because the tournament name wasn't extracted from previous posts.

### 2. **Two Opportunities Created in Same Run**

For each active tournament, the system creates:
- Tournament update opportunity
- Lifestyle guide opportunity

Both are added to the opportunities array, both get scored, and if they both score high, both could be generated.

### 3. **No Check for Same Tournament in Same Run**

The system doesn't check if it's already created an opportunity for this tournament in the CURRENT run - it only checks the database.

### 4. **Race Condition (Possible)**

If the job runs twice quickly (before first post is saved), both runs see "no posts" and both create opportunities.

## Fixes Needed

### Fix 1: Better Tournament Name Extraction
- Extract "ABN AMRO Open" from titles like "Rotterdam's ABN AMRO Open..."
- Extract "ABN AMRO Open" from titles like "ABN AMRO Open Rotterdam..."
- Link city names to tournament names when found together

### Fix 2: Check for Duplicate Opportunities in Same Run
- Track which tournaments we've already created opportunities for in the current run
- Only create ONE opportunity per tournament per run (either update OR lifestyle, not both)

### Fix 3: Check Both Tournament Name AND City
- If tournament is in Rotterdam, check for both "ABN AMRO Open" AND "Rotterdam" in recent posts
- This catches posts that mention the city but not the full tournament name
