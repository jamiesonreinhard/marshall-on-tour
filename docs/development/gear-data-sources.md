# Gear Data Sources Strategy

## Overview

Marshall's gear content should be **infrequent** and focus on **comparison guides** rather than single product reviews. This document outlines where to source gear data from.

## Content Strategy

### Frequency Guidelines
- **Racket guides:** Very infrequent (every 60+ days max)
- **Clothing guides:** Infrequent (every 30+ days max)
- **Accessory guides:** Infrequent (every 30+ days max)
- **Single product reviews:** Avoid entirely (feels spammy)

### Content Types
1. **Comparison Guides** (Primary)
   - "Best Tennis Rackets for 2026: A Complete Guide"
   - "Best Tennis Apparel: Shorts, Shirts, and More"
   - "Essential Tennis Accessories: Bags, Grips, and More"
   - Compare 3-5 products, honest pros/cons, who each suits

2. **Quizzes** (Future - once traffic grows)
   - "What's Your Ideal Racket?"
   - "Which Tournament Should You Attend?"
   - Lead to affiliate links based on results

## Data Sources

### 1. Amazon Associates ⭐ PRIMARY RECOMMENDATION

**Why Amazon:**
- **4-8% commission** on sports equipment
- **Huge selection** - all major brands (Head, Wilson, Babolat, Yonex)
- **Easy to join** - free, quick approval
- **Reliable tracking** - 24-hour cookie window
- **High conversion** - people trust Amazon
- **One program** - covers everything

**How to Use:**
1. Sign up at `affiliate-program.amazon.com`
2. Use Amazon Product Advertising API (PA-API) or manual product links
3. Create comparison guides linking to multiple products
4. Use `[AFF:Product Name]` format in posts → converts to Amazon affiliate links

**Product Data:**
- **PA-API 5.0** (if approved) - programmatic access to product data
- **Manual research** - browse Amazon, get product specs, create links
- **Amazon Associates SiteStripe** - browser extension for easy link creation

**Limitations:**
- PA-API requires approval (usually need some traffic first)
- Manual research is time-consuming but works for infrequent posts

---

### 2. Tennis Warehouse / Tennis Express

**Why Consider:**
- **5-7% commission** (slightly higher than Amazon)
- **Tennis-specific** - better selection for niche gear
- **Expert reviews** - detailed racket specs and comparisons
- **Higher ticket items** - premium rackets, stringing machines

**How to Use:**
- Contact affiliate team directly
- Usually requires traffic/engagement proof
- May have minimum sales requirements

**Best For:**
- Deep technical comparisons
- High-end equipment guides
- Once Marshall has established traffic

---

### 3. Web Scraping (Free, but use carefully)

**Potential Sources:**
- **Tennis Warehouse** - product listings, specs, prices
- **Tennis Express** - product data
- **Brand websites** - Head, Wilson, Babolat official sites
- **Review sites** - Tennis.com, Tennis Warehouse reviews

**Legal Considerations:**
- Check robots.txt and terms of service
- Don't scrape pricing (changes frequently)
- Focus on public product specs
- Use for research, not direct data integration

**Implementation:**
- Use for one-time research when creating guides
- Not recommended for automated/real-time data
- Better to manually curate for infrequent posts

---

### 4. Manual Database (Recommended for MVP)

**Strategy:**
- Create a simple database table or JSON file with gear data
- Manually curate 20-30 top products across categories
- Update quarterly (gear doesn't change that often)
- Include: name, brand, type, key specs, Amazon affiliate link

**Database Schema:**
```sql
CREATE TABLE gear_items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL, -- 'racket', 'clothing', 'accessory'
  category TEXT, -- 'racket-control', 'racket-power', 'shorts', 'shoes', etc.
  specifications JSONB, -- flexible specs storage
  price_range TEXT, -- '$200-250' or '$$$'
  amazon_affiliate_link TEXT,
  description TEXT,
  pros TEXT[],
  cons TEXT[],
  best_for TEXT, -- 'control players', 'power players', 'beginners', etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Benefits:**
- Full control over data quality
- Can include Marshall's personal notes/opinions
- Easy to update when needed
- No API dependencies
- Perfect for infrequent, curated guides

---

## Implementation Plan

### Phase 1: Manual Database (Now)
1. Create `gear_items` table in Supabase
2. Manually add 20-30 top products:
   - 10-12 rackets (mix of control, power, all-around)
   - 5-6 clothing items (shorts, shirts, shoes)
   - 5-6 accessories (bags, grips, strings)
3. Include Amazon affiliate links
4. Add Marshall's personal notes/opinions

### Phase 2: Content Intelligence Integration
1. Update `content-intelligence.ts` to check for gear opportunities
2. Enforce 45-day minimum between gear posts
3. Rotate guide types (rackets → clothing → accessories)
4. Generate comparison guides using database data

### Phase 3: Amazon PA-API (Future)
1. Apply for PA-API access (need traffic first)
2. Integrate for real-time product data
3. Still maintain manual database for curation

---

## Gear Guide Content Structure

### Example: "Best Tennis Rackets for 2026"

**Introduction:**
- Why this guide matters
- What to look for in a racket
- Who this guide is for

**Comparison Table:**
- 5-6 rackets side-by-side
- Key specs (weight, head size, string pattern)
- Price range
- Best for: [player type]

**Detailed Reviews:**
- Each racket gets 2-3 paragraphs
- Pros and cons
- Who it suits
- Marshall's honest take

**Recommendations:**
- Best for control players
- Best for power players
- Best value
- Best for beginners

**Affiliate Links:**
- Each racket linked to Amazon
- "Check Price on Amazon" buttons
- Natural, not pushy

---

## Key Takeaways

1. **Infrequent is better** - Don't spam gear content
2. **Comparison guides > single reviews** - More valuable, less spammy
3. **Start with manual database** - Curate quality over quantity
4. **Amazon Associates is primary** - Easy, covers all brands
5. **Quizzes are future opportunity** - Once traffic grows
6. **Be authentic** - Marshall's honest opinions matter more than affiliate links

---

## Next Steps

1. ✅ Update content intelligence to enforce 45-day gear post minimum
2. ✅ Change gear opportunities from "review" to "comparison guide"
3. ⏳ Create `gear_items` database table
4. ⏳ Manually curate initial 20-30 products
5. ⏳ Sign up for Amazon Associates
6. ⏳ Test first gear guide generation
