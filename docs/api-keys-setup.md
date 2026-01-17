# API Keys Setup Guide

## What You Need Now vs Later

### ✅ **RSS Feeds: No API Keys Needed**
- RSS feeds are public and don't require authentication
- I can build the RSS aggregator right now
- Just need the feed URLs (which I'll include)

### ⏳ **Sportradar API: Get Key Later (Optional for Now)**
- **30-day free trial** available
- Can build structure with mock data first
- You can get the key when you're ready to test real data
- Or get it now if you want to test immediately

---

## RSS Feeds (No Setup Required)

**These are public feeds - no API keys needed:**

- ESPN Tennis: `https://www.espn.com/espn/rss/tennis/news`
- BBC Sport Tennis: `https://feeds.bbci.co.uk/sport/tennis/rss.xml`
- Tennis.com: `https://www.tennis.com/news/rss`
- ATP Tour: Check their website for RSS feed URL

**I'll build the RSS aggregator now** - it will work immediately.

---

## Sportradar API (Optional - Get When Ready)

### How to Get API Key:

1. **Sign up:** https://developer.sportradar.com/
2. **Create account** on Sportradar Developer Portal
3. **Apply for free trial** (30 days)
4. **Generate API key** in your dashboard
5. **Add to `.env.local`:**
   ```
   SPORTRADAR_API_KEY=your_key_here
   ```

### What You Get:
- Tournament schedules
- Match results
- Player rankings
- Live scores
- Historical data

### Cost:
- **Free Trial:** 30 days
- **After Trial:** Contact for pricing (usually $50-200/month depending on usage)

### Recommendation:
- **Option 1:** Get key now if you want to test real data immediately
- **Option 2:** Build with mock data first, get key later when ready to test
- **Either way works** - I'll structure the code to work with both

---

## Recommendation

**Start building now with:**
1. ✅ RSS feeds (no keys needed)
2. ⏳ Mock Sportradar data (get real key later)

**Then when you're ready:**
- Get Sportradar API key
- Add to `.env.local`
- Real data will work immediately

This way you can:
- See the system working right away
- Test with real data when you're ready
- No blocking on API signup

---

## Environment Variables Needed

Add these to `.env.local` when you get the keys:

```bash
# Sportradar API (optional - get when ready)
SPORTRADAR_API_KEY=your_key_here

# RSS Feeds (no keys needed, but URLs can be customized)
RSS_ESPN_TENNIS=https://www.espn.com/espn/rss/tennis/news
RSS_BBC_TENNIS=https://feeds.bbci.co.uk/sport/tennis/rss.xml
RSS_TENNIS_COM=https://www.tennis.com/news/rss
```
