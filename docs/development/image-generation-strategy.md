# Image Generation Strategy Guide

## Overview

This document outlines the strategy for generating blog post images that are engaging, relevant, and consistent with Marshall's brand.

## Core Principles

1. **Not every post needs Marshall's face** - Tournament recaps, previews, and player profiles should focus on the content, not Marshall
2. **Face consistency when Marshall IS included** - Use face ID technology to maintain 95%+ consistency
3. **Post-type appropriate imagery** - Each post type has a specific visual strategy
4. **Cohesive aesthetic** - All images should feel like they're from the same brand/voice

## Image Types by Post Type

### Tournament Recaps
- **Include Marshall:** ❌ NO
- **Image Type:** Tournament scene, action shots, trophy moments
- **Focus:** The event, the players, the atmosphere
- **Example:** "Australian Open 2026: Tournament Recap" → Stadium action shot, trophy ceremony, or player celebration

### Tournament Previews
- **Include Marshall:** ❌ NO
- **Image Type:** Travel location, destination photography
- **Focus:** The city/location, tournament venue, travel appeal
- **Example:** "Indian Wells Preview" → Beautiful Palm Springs/Indian Wells landscape with tennis venue

### Gear Reviews
- **Include Marshall:** ✅ YES
- **Image Type:** Product showcase with Marshall
- **Focus:** The gear is hero, Marshall is secondary but present
- **Example:** "Testing Head Speed Pro" → Marshall holding/reviewing the racket, gear prominently displayed

### Player Profiles
- **Include Marshall:** ❌ NO
- **Image Type:** Player action shots
- **Focus:** The player in action, match photography
- **Example:** "Rising Star: Carlos Alcaraz" → Alcaraz hitting a forehand, dynamic action shot

### Match Analysis
- **Include Marshall:** ⚠️ DEPENDS
  - If specific match: NO (show the match/players)
  - If general analysis: YES (Marshall courtside observing)
- **Image Type:** Match action or Marshall as observer
- **Example:** "Djokovic vs Alcaraz: Tactical Breakdown" → Match action shot
- **Example:** "The Evolution of Serve and Volley" → Marshall courtside with notebook

### Lifestyle Posts
- **Include Marshall:** ✅ YES
- **Image Type:** Lifestyle moments
- **Focus:** Authentic moments, coffee shops, hotels, city walks
- **Example:** "Melbourne's Best Coffee Shops" → Marshall in a coffee shop, candid moment

## Face Consistency Strategy

### When Marshall IS Included

1. **Use Face ID Model:** `zsxkib/flux-pulid` (supports face consistency)
2. **Reference Image:** Always use the same base identity image (`/assets/base_identity.png`)
3. **Consistent Description:** Use the same physical description in every prompt:
   - "Marshall, a handsome 33-year-old tennis tour insider with ambiguous European appearance, olive skin, dark brown hair with light stubble, signature messy textured hair, expressive eyes, athletic build, 5'10" height"

4. **Model Parameters:**
   - `main_face_image`: Reference to base identity
   - `id_weight`: 1.0 (maximum consistency)
   - `start_step`: 0 (apply from beginning)
   - `guidance_scale`: 4

### Face Consistency Checklist

- ✅ Same reference image every time
- ✅ Same physical description in prompt
- ✅ Use face ID model (flux-pulid) when Marshall is included
- ✅ Maximum ID weight (1.0) for consistency
- ✅ Consistent style guide across all images

## Style Guide

### Overall Aesthetic
- **Photorealistic** - Not illustration, not cartoon
- **Authentic** - iPhone-style, unpolished, candid
- **Quiet Luxury** - Refined but not flashy
- **Natural Lighting** - No harsh studio lighting
- **16:9 Aspect Ratio** - Blog post hero images

### Color Palette
- Warm, natural tones
- Avoid overly saturated colors
- Professional but approachable

### Composition
- Rule of thirds
- Natural framing
- Authentic moments, not posed

## Implementation

The strategy is implemented in:
- `lib/ai/image-strategy.ts` - Determines image type and strategy
- `lib/ai/images.ts` - Generates images using the strategy
- `lib/jobs/post-generator.ts` - Calls image generation with context

## Examples

### Good Examples

✅ **Tournament Recap:** Stadium action shot, players celebrating, trophy moment
✅ **Gear Review:** Marshall holding racket, product clearly visible
✅ **Player Profile:** Player in dynamic action, match photography
✅ **Lifestyle:** Marshall in coffee shop, authentic moment

### Bad Examples

❌ **Tournament Recap:** Just Marshall's face (should be tournament-focused)
❌ **Player Profile:** Marshall's face (should be player-focused)
❌ **Gear Review:** No Marshall (should include him with product)
❌ **Inconsistent Face:** Different appearance each time (should use face ID)

## Future Improvements

1. **Face Consistency Testing:** Regular tests to ensure 95%+ consistency
2. **Style Variations:** Subtle style variations while maintaining consistency
3. **A/B Testing:** Test different image types for engagement
4. **Custom Models:** Train a custom model on Marshall's face for even better consistency
