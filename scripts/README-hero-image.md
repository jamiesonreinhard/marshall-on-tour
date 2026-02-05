# Generate Hero Landscape Image

This script generates a landscape (16:9) hero image for the homepage banner.

## Requirements

- Environment variables set in `.env.local`:
  - `REPLICATE_API_TOKEN` or `FAL_API_KEY` (for image generation)
  - `MARSHALL_LORA_URL` (optional, for better face consistency)
  - `MARSHALL_FACE_REFERENCE_URL` (optional, defaults to `/assets/base_identity.png`)

## Usage

```bash
npm run generate:hero
```

Or directly:

```bash
tsx scripts/generate-hero-image.ts
```

## Output

The generated image will be saved to:
```
public/assets/hero_landscape.png
```

## Image Details

- **Aspect Ratio**: 16:9 (landscape)
- **Content**: Marshall on a plane with champagne, same clothes as base_identity.png
- **Style**: Wide-angle, cinematic, professional photography
- **Use Case**: Homepage hero banner in variant 4B

## Notes

- The image uses the same face consistency settings as other Marshall images
- If LoRA is configured, it will be used for better face consistency
- The prompt is optimized for a landscape, wide-angle view suitable for a hero banner
