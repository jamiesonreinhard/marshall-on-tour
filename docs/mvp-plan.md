# Marshall Web: MVP Scope & Build Plan

## MVP Definition: "The First Dollar Test"

**Goal:** Launch a blog that can earn the first $1 from affiliate revenue within 4-6 weeks of going live.

**Success Criteria:**
- ✅ Blog is live and indexed by Google
- ✅ At least 3-5 blog posts published (mix of gear reviews, travel guides, match analysis)
- ✅ Affiliate links are functional and trackable
- ✅ Basic SEO optimization (meta tags, structured data)
- ✅ Social proof (Instagram/Twitter accounts created, even if minimal content)

---

## Phase 1: MVP (Weeks 1-4) - "The Foundation"

### Must-Haves (Ship Blockers)

#### 1. Website Core
- [ ] **Homepage**
  - Hero section with Marshall intro/backstory
  - Latest 3-5 blog posts preview
  - Simple navigation (Home, Blog, About)
  - Footer with social links (Instagram, Twitter, TikTok - even if empty)
  
- [ ] **Blog Listing Page** (`/blog`)
  - Grid/list of all posts
  - Basic filtering (by category: Gear, Travel, Match Analysis)
  - Pagination (if >10 posts)
  
- [ ] **Individual Blog Post Page** (`/blog/[slug]`)
  - Post title, date, category
  - Featured image (Marshall AI-generated)
  - Post content (markdown/rich text)
  - Affiliate link handling (manual for MVP)
  - Related posts section
  - Social share buttons
  
- [ ] **About Page** (`/about`)
  - Marshall's backstory (cultured expat, tour insider)
  - AI disclosure ("Marshall is a synthetic persona")
  - Photo gallery (3-5 images from casting folder)

#### 2. Content (AI-Assisted from Day 1)
- [ ] **AI Content Generation System**
  - Marshall voice prompt/system instructions (for ChatGPT/Claude)
  - Template library (gear review, travel guide, match analysis)
  - Affiliate link insertion workflow
  
- [ ] **15-20 Initial Blog Posts** (AI writes, you edit/approve)
  - 5-7 Gear reviews (e.g., "The Best Tennis Bag for the Tour" - Wilson/Babolat affiliate)
  - 5-7 Travel guides (e.g., "Where to Stay in Melbourne for the Australian Open" - Booking.com affiliate)
  - 3-5 Match analysis (e.g., "Why Alcaraz's Drop Shot Won Indian Wells" - no affiliate, pure SEO)
  - 2-3 Lifestyle posts (e.g., "What I Pack for a 3-Week Tour" - mixed affiliates)
  
- [ ] **Content Guidelines Document**
  - Marshall's voice/style guide (for AI prompts)
  - Affiliate link placement rules
  - Image requirements (Marshall consistency)
  - Quality checklist (fact-check, personality, links)

#### 3. Affiliate Setup
- [ ] **Affiliate Accounts Created** (don't need approval for MVP, just accounts)
  - Amazon Associates (gear)
  - Booking.com Affiliate (travel)
  - Skyscanner (flights)
  - Wilson/Babolat direct (if available)
  
- [ ] **Link Tracking System**
  - Simple manual link replacement (e.g., `[AFF:Wilson Blade]` → full affiliate URL)
  - Or: Basic component `<AffiliateLink brand="Wilson" product="Blade" />`

#### 4. SEO Basics
- [ ] **Meta Tags** (title, description, OG tags)
- [ ] **Sitemap.xml** (auto-generated)
- [ ] **robots.txt**
- [ ] **Structured Data** (Article schema for blog posts)

#### 5. Design & Branding
- [ ] **Visual Identity Applied**
  - Use existing Marshall images from `/public/casting/`
  - "Quiet Luxury" color palette (navy, cream, charcoal)
  - Typography (serif for headings? sans-serif for body?)
  - Mobile responsive

#### 6. Deployment
- [ ] **Vercel Deployment**
  - Custom domain (marshallontour.com or similar)
  - SSL certificate
  - Analytics (Vercel Analytics or Google Analytics)

---

## Phase 2: Content & Growth (Weeks 5-8) - "The Engine"

### Must-Haves (Post-MVP, Pre-Scale)

- [ ] **10-15 Total Blog Posts**
  - Mix of gear, travel, match analysis
  - Following ATP calendar (post about tournaments as they happen)
  
- [ ] **Social Media Presence**
  - Instagram: 10-15 posts (Marshall images + captions)
  - Twitter/X: Account active, cross-posting blog links
  - TikTok: Optional (time-consuming, maybe skip for MVP)
  
- [ ] **Email List** (optional but recommended)
  - Simple signup form
  - Newsletter template (weekly roundup of posts)

### Nice-to-Haves (Can Defer)

- [ ] "Marshall's Suitcase" dynamic sidebar (Phase 3)
- [ ] Fan voting component (Phase 3)
- [ ] Automated content generation (Phase 3)
- [ ] Social media automation (Phase 3)

---

## Phase 3: Full Automation (Months 3-6) - "The Machine"

**Note:** You're already using AI for content, so "automation" here means **hands-off scheduling** and **API integrations**

- [ ] **Automated Content Scheduling**
  - Tennis API integration (Sportradar) - auto-generate match analysis posts
  - Automated post scheduling (publish on schedule)
  - Auto-generate tournament previews based on ATP calendar
  
- [ ] **Image Generation Pipeline**
  - Flux/Midjourney API integration
  - Consistency system (LoRA/IP-Adapter)
  - Auto-generate images for each post (currently manual)
  
- [ ] **Social Media Automation**
  - Auto-post to Instagram/Twitter (currently manual)
  - Auto-react to player tweets
  - Auto-generate social captions from blog posts
  
- [ ] **Advanced Features**
  - "Marshall's Suitcase" dynamic inventory
  - Fan voting component
  - Real-time tournament tracking
  - Email newsletter automation

---

## Technical Stack (MVP)

### Core
- **Framework:** Next.js 16 (already set up)
- **Styling:** Tailwind CSS (already set up)
- **Content:** Markdown files in `/content/posts/` (simple, no CMS needed for MVP)
- **Deployment:** Vercel (free tier is fine)

### Optional (Add if needed)
- **Markdown Parser:** `remark` + `remark-html` or `MDX`
- **Image Optimization:** Next.js Image component (already available)
- **Analytics:** Vercel Analytics (free) or Google Analytics

### Defer (Phase 3)
- Database (Supabase/Postgres) - only if we need dynamic content
- CMS (Sanity/Contentful) - only if manual content becomes too tedious
- AI APIs (OpenAI/Anthropic) - only after MVP validation

---

## Content Strategy (MVP)

### Post Types (Priority Order)

1. **Gear Reviews** (Highest affiliate potential)
   - "The 5 Best Tennis Bags for Frequent Travelers"
   - "Wilson Blade vs. Babolat Pure Drive: Which Racket Should You Buy?"
   - "The Only Tennis Shoes Worth Packing for a 3-Week Tour"

2. **Travel Guides** (High affiliate potential + SEO)
   - "Where to Stay in Melbourne for the Australian Open (2026 Guide)"
   - "The Best Hotels Near Roland Garros (That Won't Break the Bank)"
   - "How to Get to Indian Wells: Flights, Hotels, and Rental Cars"

3. **Match Analysis** (SEO + engagement, low affiliate)
   - "Why Alcaraz's Drop Shot Strategy Won Indian Wells"
   - "The Moment That Changed the Australian Open Final"
   - "Breaking Down Sinner's Serve: Why It's Unstoppable"

4. **Lifestyle** (Engagement, medium affiliate)
   - "What I Pack for a 3-Week Tennis Tour (The Complete List)"
   - "The Best Coffee Shops Near Every Major Tournament"
   - "How to Watch Tennis Like a Pro (Even If You're Courtside)"

### Content Volume (AI-Assisted MVP)
- **Week 1:** AI writes 15-20 posts, you edit/approve (4-5 hours total)
- **Week 2:** AI writes 10-15 more posts, you edit/approve (3-4 hours total)
- **Ongoing:** AI writes 3-5 posts/week, you edit/approve (1-2 hours/week)
- **Total MVP:** 25-35 posts in first 2 weeks, then 3-5/week ongoing
- **By Month 3:** 50-75 posts (enough for serious SEO)

---

## Affiliate Strategy (MVP)

### Priority Affiliates (Set up first)

1. **Amazon Associates** (Easiest, broadest)
   - Gear: Rackets, bags, shoes, strings
   - Tech: Headphones, fitness trackers
   - Travel: Luggage, travel accessories

2. **Booking.com** (High commission, travel)
   - Hotel bookings for tournament cities

3. **Skyscanner** (Travel)
   - Flight bookings

4. **Direct Brands** (If available, higher commission)
   - Wilson, Babolat, Nike, Lacoste
   - May require outreach/application

### Link Placement Rules
- **Gear Reviews:** 3-5 affiliate links per post (natural placement)
- **Travel Guides:** 2-3 hotel links, 1-2 flight links
- **Match Analysis:** 0-1 links (keep it editorial)
- **Disclosure:** "This post contains affiliate links" at top or bottom

---

## Success Metrics (MVP)

### Week 1-2 (AI-Accelerated Launch)
- [ ] Site live and indexed
- [ ] 20-30 posts published (AI-assisted)
- [ ] Social accounts active (10-15 posts)
- [ ] First 500-1,000 page views (from sharing/promotion)

### Week 3-4 (Early Growth)
- [ ] 30-40 total posts
- [ ] 2,000-5,000 monthly page views (organic + social)
- [ ] First affiliate click
- [ ] First $1 earned (the goal!)

### Month 2-3 (Momentum)
- [ ] 50-75 total posts
- [ ] 5,000-10,000 monthly page views
- [ ] $50-200/month revenue
- [ ] Decision point: Scale content or optimize existing?

### Month 3+ (Your Goal: $400/month)
- [ ] 75-100 total posts
- [ ] 10,000-15,000 monthly page views
- [ ] **$100/week = $400/month revenue** ✅
- [ ] Decision point: Full automation or manual scaling?

---

## Risks & Mitigations

### Risk: Scope Creep
**Mitigation:** This document. Stick to Phase 1 only. No automation until first $1.

### Risk: Content Takes Too Long
**Mitigation:** Start with 3 posts only. Publish early, iterate. Quality > quantity for MVP.

### Risk: No Traffic
**Mitigation:** Share on Reddit (r/tennis), Twitter, personal networks. SEO takes time, but social can drive initial traffic.

### Risk: Affiliate Approval Delays
**Mitigation:** Start with Amazon (fastest approval). Booking.com can take 1-2 weeks, but that's fine for MVP timeline.

### Risk: Burnout (Your Known Issue)
**Mitigation:** 
- Set timer: 2 hours max per session
- Ship after 3 posts, don't perfect
- Celebrate first $1 as major win
- Take breaks between phases

---

## Timeline Estimate

### Phase 1 (MVP): 4 weeks @ 6-8 hours/week = 24-32 hours
- **Week 1:** Website structure (homepage, blog pages, about) - 8 hours
- **Week 2:** Write 3-5 posts + affiliate setup - 8 hours
- **Week 3:** Design polish, SEO, deployment - 6 hours
- **Week 4:** Launch, share, iterate - 6 hours

### Phase 2 (Content): 4 weeks @ 4-6 hours/week = 16-24 hours
- **Week 5-8:** Write 1-2 posts/week, social media, email list - 4-6 hours/week

### Phase 3 (Automation): TBD (only if MVP succeeds)
- Estimate: 40-60 hours (but don't start until first $1 earned)

---

## AI-Accelerated Timeline (With Cursor + AI Content)

**Reality Check:** You're using Cursor for code + AI for content = 5-10x faster than manual work.

### Content Creation Speed (AI-Assisted)
- **Manual writing:** 2-3 hours per post
- **AI-assisted (ChatGPT/Claude):** AI writes in 5-10 min, you edit/approve in 15-30 min = **30-45 min per post**
- **Speed multiplier:** 4-6x faster

### Code Development Speed (Cursor-Assisted)
- **Manual coding:** 8-12 hours for full site
- **Cursor-assisted:** AI suggests code, you review/edit = **3-5 hours for full site**
- **Speed multiplier:** 2-3x faster

### Revised Timeline: 1-2 Weeks @ 10-12 hours/week = 10-24 hours

**Week 1 (Aggressive):** 12 hours
- **Day 1-2:** Website structure with Cursor (3-4 hours)
  - Homepage, blog pages, about page
  - Cursor generates components, you review/edit
- **Day 3-4:** AI writes 10-15 blog posts, you edit/approve (4-5 hours)
  - Use ChatGPT/Claude with Marshall voice prompt
  - Edit for accuracy, add affiliate links, approve
- **Day 5:** Affiliate setup + SEO + deployment (2-3 hours)
- **Day 6-7:** Design polish, social media setup, launch (2-3 hours)

**Week 2 (Polish & Scale):** 8-12 hours
- **Content:** AI writes 10-15 more posts, you edit/approve (4-6 hours)
- **Social:** Create 10-15 Instagram posts (AI generates captions, you add images) (2-3 hours)
- **SEO:** Optimize existing posts, add internal links (2-3 hours)

**Result:** 20-30 posts live, site indexed, social accounts active, ready to scale

**Feasibility:** ✅ **Absolutely doable** with AI assistance

**Key Workflow:**
1. **AI writes blog post** (ChatGPT/Claude with Marshall prompt)
2. **You review/edit** (15-30 min: fact-check, add personality, insert affiliate links)
3. **Approve & publish** (5 min)
4. **Repeat** (can do 5-10 posts in a 4-hour session)

**This changes everything:**
- ✅ Launch with 20-30 posts (not 3-5)
- ✅ Hit 10,000+ monthly visitors faster (more content = more SEO)
- ✅ Revenue goals more achievable (more content = more affiliate opportunities)

---

## Revenue Projections & Realistic Ceilings

### Your Goals
- **Month 3:** $100/week = **$400/month**
- **Month 6:** **$2,000/month**
- **Long-term ceiling:** TBD

### Revenue Math (How to Hit $400/month)

**Option 1: Travel Affiliates (Highest ROI)**
- Booking.com: 25-40% commission on hotel bookings
- Average booking: $150-300/night × 2-3 nights = $300-900 total
- Commission: $75-360 per booking
- **Need:** 1-5 bookings/month = $400/month ✅ **Very achievable**

**Option 2: Gear Affiliates (Volume Play)**
- Amazon: 1-10% commission (avg 4-6% for sports gear)
- High-ticket items: Wilson rackets ($200-300) = $8-30 commission
- Mid-ticket: Bags, shoes ($50-150) = $2-9 commission
- **Need:** 20-50 sales/month = $400/month ✅ **Achievable with traffic**

**Option 3: Mixed (Recommended)**
- 2-3 hotel bookings/month ($150-300) = $200-400
- 20-30 gear sales/month ($100-200) = $200-400
- **Total:** $400-800/month ✅ **Most realistic path**

### Traffic Requirements (To Hit $400/month)

**Travel Conversion:** 1-2% (high intent)
- Need 2-3 bookings = 150-300 visitors to travel posts/month
- **Total site traffic:** 5,000-10,000 monthly visitors

**Gear Conversion:** 5-10% (lower intent, but higher volume)
- Need 20-30 sales = 200-600 visitors to gear posts/month
- **Total site traffic:** 5,000-10,000 monthly visitors

**By Month 3, 5,000-10,000 monthly visitors is:**
- ✅ **Ambitious but achievable** with:
  - 10-15 quality posts
  - Good SEO (targeting long-tail keywords)
  - Social media presence (Instagram/Twitter)
  - Reddit/Twitter promotion (r/tennis, tennis Twitter)
  - The "AI influencer" hook (viral potential)

### Revenue Projections (Realistic)

| Month | Traffic | Revenue | Notes |
|-------|---------|---------|-------|
| **Month 1** | 500-1,000 | $0-10 | Launch, first clicks |
| **Month 2** | 1,000-3,000 | $10-50 | SEO starting to work |
| **Month 3** | 3,000-8,000 | **$100-400** | **Your goal: $400** ✅ |
| **Month 4** | 5,000-12,000 | $200-600 | Momentum building |
| **Month 5** | 8,000-15,000 | $400-1,000 | Automation kicks in |
| **Month 6** | 12,000-25,000 | **$800-2,500** | **Your goal: $2k** ✅ |

**Verdict on Your Goals:**
- **$400/month by Month 3:** ✅ **Ambitious but achievable** (top 20% of new blogs)
- **$2k/month by Month 6:** ✅ **Very ambitious but possible** (top 5% of new blogs)
- **Key factors:** Content quality, SEO execution, social media growth, AI influencer hook

### Realistic Ceiling (12-24 Months)

**Conservative Estimate:** $2,000-5,000/month
- 20,000-50,000 monthly visitors
- 50-100 blog posts
- Established SEO authority
- Active social media (10k+ followers)

**Optimistic Estimate:** $5,000-15,000/month
- 50,000-150,000 monthly visitors
- 100-200 blog posts
- Viral moments (AI influencer hook)
- Direct brand partnerships (Wilson, Babolat)
- Email list (10k+ subscribers)

**Top 1% Ceiling:** $15,000-50,000/month
- 150,000+ monthly visitors
- 200+ blog posts
- Major brand deals
- Sponsored content
- Digital products (courses, guides)

**Factors That Increase Ceiling:**
1. **AI Influencer Hook:** The "is he real?" debate = viral potential = faster growth
2. **High-Ticket Affiliates:** Travel commissions are 10x higher than Amazon
3. **Direct Brand Deals:** Wilson/Babolat partnerships = $500-2,000 per post
4. **SEO Authority:** Ranking #1 for "best tennis gear" = 10,000+ monthly visitors
5. **Email List:** 10k subscribers = $1,000-3,000/month from promotions

**Factors That Limit Ceiling:**
1. **Niche Size:** Tennis is smaller than general travel/fitness
2. **Seasonality:** Tournaments are seasonal (peak during majors)
3. **Competition:** Established tennis blogs (Tennis.com, ATP Tour)
4. **Content Saturation:** Need unique angle (AI influencer = differentiator)

### Scalability to Other Niches

**Yes, the model is repeatable, but:**

**What Reuses:**
- ✅ Technical stack (Next.js, automation system)
- ✅ Content generation pipeline (LLM prompts, image generation)
- ✅ Affiliate infrastructure (accounts, tracking)
- ✅ Social media automation tools

**What's New Per Niche:**
- ❌ Content strategy (golf ≠ tennis)
- ❌ Visual identity (new persona)
- ❌ SEO keywords (different search terms)
- ❌ Affiliate programs (golf brands ≠ tennis brands)
- ❌ Audience building (new social accounts)

**Time Investment Per New Niche:**
- **Setup:** 20-30 hours (website, persona, initial content)
- **Growth:** 3-6 months to reach $1k/month (same as tennis)
- **Total:** ~6 months per niche to $2k/month

**Multi-Niche Potential:**
- **3 niches @ $2k/month each = $6k/month**
- **5 niches @ $2k/month each = $10k/month**
- **10 niches @ $1k/month each = $10k/month** (faster, lower per-niche)

**Recommended Approach:**
1. **Master tennis first** (get to $2k/month, prove the model)
2. **Then replicate** (golf, F1, soccer - each takes 3-6 months)
3. **Build a portfolio** (5-10 niches = $5k-10k/month total)

---

## Revised Success Metrics (AI-Accelerated Timeline)

### Week 1-2 (Launch)
- [ ] Site live and indexed
- [ ] 20-30 posts published (AI-assisted)
- [ ] Social accounts active (10-15 posts)
- [ ] First 500-1,000 page views (from sharing/promotion)

### Month 1 (Early Growth)
- [ ] 30-40 total posts
- [ ] 2,000-5,000 monthly page views
- [ ] First affiliate click
- [ ] First $1 earned (the goal!)

### Month 2 (Momentum)
- [ ] 50-60 total posts
- [ ] 5,000-8,000 monthly page views
- [ ] $50-150/month revenue
- [ ] SEO starting to rank

### Month 3 (Your Goal)
- [ ] 75-100 total posts
- [ ] 10,000-15,000 monthly page views
- [ ] **$100/week = $400/month revenue** ✅
- [ ] Decision point: Scale content or optimize?

### Month 6 (Your Goal)
- [ ] 150-200 total posts
- [ ] 20,000-30,000 monthly page views
- [ ] **$2,000/month revenue** ✅
- [ ] Full automation operational (optional, but helpful)
- [ ] Decision point: Replicate to new niche?

**Key Difference:** With AI-assisted content, you can publish 3-5 posts/week with just 1-2 hours of work (AI writes, you edit). This means you'll hit 100+ posts by Month 3, which dramatically improves SEO and revenue potential.

---

## Decision Points

### After MVP (Week 4)
- **If first $1 earned:** Proceed to Phase 2, consider Phase 3
- **If no traction:** Pivot content strategy or reconsider project

### After Phase 2 (Week 8)
- **If $10-50/month:** Invest in automation (Phase 3)
- **If <$10/month:** Reassess or pivot
- **If $0:** Pivot or abandon (per your "first dollar" goal)

---

## What We're NOT Building (MVP)

❌ **Fully automated** content generation (you're using AI manually, which is fine)  
❌ **Fully automated** social media posting (manual posting is fine for MVP)  
❌ Database/CMS (markdown files are fine for 100+ posts)  
❌ Fan voting component  
❌ "Marshall's Suitcase" dynamic sidebar  
❌ Real-time tournament tracking  
❌ Email automation (beyond basic signup)  
❌ TikTok content (too time-consuming)  
❌ Mobile app  
❌ Paid advertising (organic only for MVP)  

**Note:** With AI-assisted content, you don't need full automation for MVP. Manual AI workflow (AI writes → you edit → publish) is fast enough to hit your goals.

---

## AI Workflow Setup (Critical for Speed)

### Marshall Voice Prompt (For ChatGPT/Claude)

Create a system prompt that you reuse for every blog post:

```
You are Marshall, a 33-year-old tennis tour insider and travel blogger. 

PERSONALITY:
- "Lovable Asshole" archetype (Archer x Roy Kent x American Optimism)
- Snarky about bad line calls, ugly kits, slow courts
- Deeply passionate about tennis - defends players, tears up at legends retiring
- Shamelessly snobby about "the right way" to travel, drink coffee, hit backhands
- American-born but lived in Europe for a decade - cultured expat, not tourist
- Never "Americans" the experience (e.g., "This pizza is almost as good as New York" = BAD)

VOICE:
- Witty, insightful, respectful
- Explains complex tennis strategy simply
- Uses correct terminology (Roland Garros, not "French Open")
- Casual but authoritative
- Tagline: "Serve First. Travel Always."

WRITING STYLE:
- Conversational, like talking to a friend at a bar
- Short paragraphs, punchy sentences
- Technical when needed (explain court speed, spin rates)
- Personal anecdotes (even if fictional - "I saw this at Indian Wells...")
- Natural affiliate link placement (don't force it)

TASK:
Write a [POST TYPE: gear review/travel guide/match analysis] about [TOPIC].

Requirements:
- 1,500-2,500 words
- Include 3-5 natural affiliate link opportunities (mark as [AFF:Brand Product])
- SEO-optimized (include target keyword naturally)
- Marshall's voice throughout
- Actionable insights (not just fluff)
```

### Content Creation Workflow

**Step 1: AI Generates Draft (5-10 min)**
- Paste Marshall prompt + topic into ChatGPT/Claude
- AI writes full post
- Copy to your editor

**Step 2: You Edit/Approve (15-30 min)**
- Fact-check tennis details (AI can be wrong)
- Add personality touches (make it more "Marshall")
- Replace `[AFF:Brand Product]` with actual affiliate links
- Add Marshall images (from your casting folder)
- Optimize for SEO (meta description, headings)

**Step 3: Publish (5 min)**
- Add to markdown file
- Deploy to Vercel
- Share on social

**Total Time: 30-45 min per post** (vs 2-3 hours manual)

### Batch Processing (Recommended)

**Weekly Workflow:**
- **Sunday morning (2-3 hours):** AI writes 5-7 posts, you edit/approve all
- **Monday:** Publish 1-2 posts
- **Wednesday:** Publish 1-2 posts
- **Friday:** Publish 1-2 posts
- **Result:** 3-5 posts/week with minimal daily time

### Cursor Workflow (For Code)

**When building website:**
- Ask Cursor: "Create a blog post page component with Next.js"
- Review generated code
- Edit for your specific needs
- Repeat for each component

**Speed:** 3-5 hours for full site (vs 8-12 hours manual)

---

## Next Steps

1. **Create Marshall Voice Prompt** - Set up your AI system prompt
2. **Test Content Workflow** - Write 2-3 test posts to refine the process
3. **Lock the scope** - Review this plan, adjust if needed
4. **Start Week 1** - Build website structure with Cursor, then start content pipeline
