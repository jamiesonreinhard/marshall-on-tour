# Image Generation Providers

The image generation system supports multiple providers and can be easily toggled via environment variables.

## Supported Providers

1. **Fal.ai** (recommended for LoRA) - Flux.1 with LoRA support for lifestyle scenes with face consistency
2. **Replicate** (default) - Uses Flux models with face consistency via flux-pulid or LoRA
3. **Google Imagen** - Uses Vertex AI Imagen API (Nano Banana)

## Configuration

### Toggle Provider

Set the `IMAGE_GENERATION_PROVIDER` environment variable:

```bash
# Use Fal.ai (recommended for LoRA)
IMAGE_GENERATION_PROVIDER=fal

# Use Replicate (default)
IMAGE_GENERATION_PROVIDER=replicate

# Use Google Imagen
IMAGE_GENERATION_PROVIDER=imagen
```

### Replicate Setup

```bash
REPLICATE_API_TOKEN=your_replicate_token
MARSHALL_FACE_REFERENCE_URL=https://your-face-reference-url.png
```

### Fal.ai Setup (Flux.1 with LoRA - Recommended)

```bash
IMAGE_GENERATION_PROVIDER=fal
FAL_API_KEY=your_fal_api_key
MARSHALL_LORA_URL=https://your-lora-weights-url.safetensors
MARSHALL_LORA_TRIGGER_WORD=MARSHALL_UNIQ  # Optional, defaults to MARSHALL_UNIQ
```

**Note:** Fal.ai provides fast inference for Flux.1 with LoRA support:
- Best for lifestyle scenes with consistent face matching
- Works for both candid AND portrait shots
- Requires a trained LoRA model (see LoRA Training section below)

### LoRA Training Setup (Recommended for Best Results)

LoRA (Low-Rank Adaptation) training allows you to create a custom model that maintains Marshall's face consistency across all types of scenes - from candid lifestyle shots to portraits.

#### Step 1: Gather Training Images

You need **10-20 high-quality images** of Marshall:
- Various angles (front, side, three-quarter)
- Different lighting conditions
- Different settings/backgrounds
- Different clothing/styles
- **Minimum resolution: 1024×1024** (higher is better)
- Supported formats: WebP, JPG, PNG
- Images can have different aspect ratios

#### Step 2: Prepare Training Images

1. Create a zip file containing all training images
2. Upload to a publicly accessible URL (e.g., S3, Cloudflare R2, or Replicate's storage)

#### Step 3: Train LoRA via Replicate API

Use the training utility in `lib/ai/lora-training.ts`:

```typescript
import { trainLoRA } from '@/lib/ai/lora-training';

const result = await trainLoRA(process.env.REPLICATE_API_TOKEN!, {
  modelName: 'marshall-lora',
  trainingImagesUrl: 'https://your-storage.com/marshall-training-images.zip',
  triggerWord: 'MARSHALL_UNIQ',
  steps: 1000, // Optional, default 1000
});

console.log('LoRA weights URL:', result.loraWeightsUrl);
console.log('Model version:', result.modelVersion);
```

**Training Details:**
- Training takes **under 2 minutes**
- Costs **under $2** per training run
- Returns both a runnable model and downloadable LoRA weights URL
- Use the LoRA weights URL in `MARSHALL_LORA_URL`

#### Step 4: Configure LoRA in Environment

After training, set the LoRA URL:

```bash
MARSHALL_LORA_URL=https://replicate.delivery/.../lora-weights.safetensors
MARSHALL_LORA_TRIGGER_WORD=MARSHALL_UNIQ
```

The trigger word is automatically inserted into prompts when generating images with Marshall.

### Google Nano Banana Setup (Gemini Image Generation)

```bash
IMAGE_GENERATION_PROVIDER=imagen
GEMINI_API_KEY=your_gemini_api_key
USE_GEMINI_PRO_IMAGE=true  # Optional: use Pro model for higher quality (default: Flash)
```

**Note:** For Nano Banana (Gemini Image Generation):
- Uses Gemini API directly - **NO project ID needed!**
- `GEMINI_API_KEY` - Your Google API key (same one used for Gemini text generation)
- `USE_GEMINI_PRO_IMAGE` - Optional: set to `true` to use `gemini-3-pro-image-preview` (higher quality, up to 4K) instead of `gemini-2.5-flash-image` (faster, 1024px)
- Models: `gemini-2.5-flash-image` (default, fast) or `gemini-3-pro-image-preview` (high quality)

## Smart Provider Routing

The system automatically selects the best provider based on the image requirements:

**Priority Order (when Marshall is included):**

1. **LoRA-enabled providers (Fal.ai or Replicate with LoRA)** - BEST for all Marshall images
   - Works for both candid AND portrait shots
   - Maintains face consistency while allowing natural lifestyle scenes
   - Used when `MARSHALL_LORA_URL` is configured
   - Fal.ai is preferred if `IMAGE_GENERATION_PROVIDER=fal` and `FAL_API_KEY` is set

2. **Replicate (flux-pulid)** - Fallback for profile images
   - Used when LoRA is NOT configured AND it's a portrait/looking at camera
   - Strong face consistency for face-forward shots

3. **Gemini (Nano Banana)** - Fallback for candid shots or non-Marshall images
   - Used when Marshall is NOT included (no face needed)
   - Used when LoRA/Replicate unavailable and Marshall is candid (face not visible)
   - Better instruction following for candid scenes

**When Marshall is NOT included:**
- Always uses Gemini (Nano Banana) for best scene composition

This routing ensures:
- **LoRA provides the best of both worlds**: face consistency + natural lifestyle scenes
- Replicate's face consistency for portraits (if no LoRA)
- Gemini's better candid instruction following (if no LoRA)

## Provider Comparison

### Fal.ai (Flux.1 + LoRA) ⭐ Recommended
- ✅ **Best for lifestyle scenes with face consistency**
- ✅ Works for both candid AND portrait shots
- ✅ Maintains consistent face across all scene types
- ✅ Fast inference
- ✅ Negative prompts supported
- ⚠️ Requires trained LoRA model (one-time setup)
- ⚠️ Costs per generation

### Replicate (Flux + LoRA or flux-pulid)
- ✅ Excellent face consistency (via LoRA or flux-pulid)
- ✅ LoRA support for lifestyle scenes
- ✅ Negative prompts supported
- ✅ Fine-tuned control over face weight (flux-pulid)
- ✅ Fast generation
- ❌ flux-pulid struggles with candid/not-looking-at-camera instructions
- ❌ Costs per generation

### Google Imagen (Nano Banana)
- ✅ Better at following candid instructions
- ✅ Produces more natural/candid images
- ✅ No project ID needed (uses Gemini API directly)
- ⚠️ Face consistency may not be as strong as LoRA
- ⚠️ Face reference passed in prompt (may work differently)

## Testing

To test a different provider:

1. Set the environment variable in your `.env.local`:
   ```bash
   IMAGE_GENERATION_PROVIDER=imagen
   GOOGLE_API_KEY=your_key
   GOOGLE_CLOUD_PROJECT_ID=your-project
   ```

2. Restart your dev server

3. Generate a post and check the logs - you'll see which provider is being used:
   ```
   [Image Provider] Using provider: imagen
   [Imagen Provider] Generating image via Vertex AI
   ```

## Adding New Providers

To add a new provider:

1. Create a class implementing `ImageProviderInterface` in `lib/ai/image-providers.ts`
2. Add it to the `getImageProvider()` function
3. Update the `ImageProvider` type to include the new provider
