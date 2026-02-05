# Image Generation Strategy Update

## Summary

Cleaned up and simplified the image generation logic to follow a clear strategy:

- **Replicate (flux-pulid)**: ONLY for Marshall profile images (face-forward, looking at camera) - **RARE** (10-20% of images with Marshall)
- **Gemini (Nano Banana)**: Everything else (80-90% of images)
  - Images without Marshall
  - Candid images where Marshall's face is NOT visible (from behind, looking away, etc.)

## Key Changes

### 1. Simplified Provider Selection (`lib/ai/images.ts`)

**Before:** Complex logic checking multiple conditions to determine provider
**After:** Simple decision tree:
- No Marshall → Gemini
- Marshall + Profile (looking at camera) → Replicate
- Marshall + Candid (face not visible) → Gemini

### 2. Updated Prompt Building (`lib/ai/images.ts`)

**Profile Images (Replicate):**
- Face-forward, looking at camera
- Professional portrait style
- Uses face consistency

**Candid Images (Gemini):**
- Face NOT visible or looking away
- Emphasizes body language and environment
- No face consistency (avoids consistency issues)

### 3. Updated Image Strategy (`lib/ai/image-strategy.ts`)

**All Marshall scenes now specify:**
- Face not visible (from behind, side profile, head down)
- OR looking away from camera
- Focus on body language and environment

**Examples:**
- "Marshall sitting at cafe, looking out at street, face not visible"
- "Marshall walking, seen from behind, face not visible"
- "Marshall reading, head down, face not visible"

## Benefits

1. **Avoids Face Consistency Issues**: Gemini images don't show face clearly, so consistency isn't a problem
2. **Better Scene Composition**: Gemini is better at following complex scene instructions
3. **Cost Efficiency**: Most images use Gemini (cheaper/faster)
4. **Quality**: Replicate only used when face consistency is critical (rare)

## Image Distribution

- **80-90%**: No Marshall (tournament scenes, gear showcases, travel locations)
- **10-20%**: Marshall candid (face not visible) - Gemini
- **<5%**: Marshall profile (face visible) - Replicate

## Testing

When generating images:
1. Most images should NOT include Marshall
2. When Marshall is included, face should NOT be clearly visible
3. Only rare profile images should show face (using Replicate)
