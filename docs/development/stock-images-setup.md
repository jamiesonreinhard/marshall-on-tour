# Stock Image Integration Setup

## Overview

We use **Unsplash API** for free stock images to reduce AI generation costs and provide authentic photography for non-Marshall posts.

## When Stock Images Are Used

- ✅ **Recap posts** (tournament finals, match results)
- ✅ **Preview posts** (tournament previews, location guides)
- ✅ **Gear guides** (product comparison posts)
- ✅ **Player profiles** (up-and-coming players, player analysis)
- ✅ **Match analysis** (when Marshall is not featured)

## When AI Images Are Used

- ✅ **Lifestyle posts** (Marshall in coffee shops, hotels, city walks)
- ✅ **Analysis posts** (Marshall courtside observing)
- ✅ **Gear reviews** (Marshall with specific products)
- ✅ **Any post where Marshall's face needs to appear**

## Setup Instructions

### 1. Get Unsplash API Key

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create an account or log in
3. Create a new application
4. Copy your **Access Key**

### 2. Add to Environment Variables

Add to `.env.local`:

```bash
UNSPLASH_ACCESS_KEY=your_access_key_here
```

### 3. API Limits

- **Free tier**: 50 requests per hour
- **Rate limit**: 50 requests/hour per application
- **No credit card required**

## Implementation

The system automatically:
1. Checks if Marshall should be included (based on post type)
2. If **no Marshall**: Tries stock images first
3. If **Marshall needed**: Uses AI generation with face consistency
4. Falls back to AI if stock image search fails

## Cost Savings

- **Stock images**: Free (Unsplash API)
- **AI generation**: ~$0.01-0.05 per image (Replicate/Flux)
- **Savings**: ~80-90% cost reduction for recap/preview posts

## Marshall Scene Variety

When AI generation is used for Marshall posts, the system randomly selects from varied scenes:

**Lifestyle Scenes:**
- Marshall drinking coffee in a park
- Marshall having a picnic near a landmark
- Marshall walking through a city
- Marshall taking a photo with friends
- Marshall at a luxury hotel
- Marshall at a coffee shop working
- Marshall exploring a new city
- Marshall at a rooftop bar

**Analysis Scenes:**
- Marshall courtside observing
- Marshall drinking coffee while watching match
- Marshall walking through tournament grounds
- Marshall at press conference
- Marshall analyzing match data

This ensures visual variety while maintaining Marshall's consistent appearance.
