# LoRA Training Guide for Marshall Face Consistency

This guide explains how to train a LoRA (Low-Rank Adaptation) model for Marshall's face to enable consistent face matching across all types of lifestyle scenes.

## Why LoRA?

LoRA training solves the problem of maintaining face consistency while generating natural lifestyle scenes:

- **Before LoRA**: Had to choose between face consistency (Replicate flux-pulid) OR natural scenes (Gemini Nano Banana)
- **After LoRA**: Get both! Consistent face matching AND natural lifestyle scenes

## Prerequisites

1. **Replicate API Token** - For training the LoRA
2. **10-20 high-quality images** of Marshall
3. **Public storage** for training images (S3, Cloudflare R2, or Replicate storage)

## Step-by-Step Training

### Step 1: Gather Training Images

Collect **10-20 high-quality images** of Marshall with:

- ✅ **Various angles**: Front, side, three-quarter views
- ✅ **Different lighting**: Indoor, outdoor, natural light, studio
- ✅ **Different settings**: Cities, cafes, events, casual settings
- ✅ **Different clothing**: Various outfits and styles
- ✅ **High resolution**: Minimum 1024×1024 (higher is better)
- ✅ **Supported formats**: WebP, JPG, PNG
- ✅ **Different aspect ratios**: OK (will be handled automatically)

**Tips:**
- More variety = better results
- Include images where Marshall looks natural and authentic
- Avoid heavily edited or filtered images
- Include both close-ups and full-body shots

### Step 2: Prepare Training Images

1. **Create a zip file** containing all training images
   ```bash
   zip marshall-training-images.zip *.jpg *.png *.webp
   ```

2. **Upload to publicly accessible storage**:
   - AWS S3 (make bucket public or use signed URL)
   - Cloudflare R2
   - Replicate storage
   - Any CDN or file hosting service

3. **Get the public URL** to the zip file

### Step 3: Train the LoRA

Use the training utility in `lib/ai/lora-training.ts`:

```typescript
import { trainLoRA } from '@/lib/ai/lora-training';

const result = await trainLoRA(process.env.REPLICATE_API_TOKEN!, {
  modelName: 'marshall-lora',
  trainingImagesUrl: 'https://your-storage.com/marshall-training-images.zip',
  triggerWord: 'MARSHALL_UNIQ', // Unique trigger word for prompts
  steps: 1000, // Optional, default 1000
});

console.log('✅ Training completed!');
console.log('LoRA weights URL:', result.loraWeightsUrl);
console.log('Model version:', result.modelVersion);
console.log('Trigger word:', result.triggerWord);
```

**Training Details:**
- ⏱️ **Time**: Under 2 minutes
- 💰 **Cost**: Under $2 per training run
- 📦 **Output**: LoRA weights URL (save this!)

### Step 4: Configure Environment Variables

Add to your `.env.local`:

```bash
# Provider (Fal.ai recommended for LoRA)
IMAGE_GENERATION_PROVIDER=fal
FAL_API_KEY=your_fal_api_key

# Or use Replicate with LoRA
IMAGE_GENERATION_PROVIDER=replicate
REPLICATE_API_TOKEN=your_replicate_token

# LoRA Configuration
MARSHALL_LORA_URL=https://replicate.delivery/.../lora-weights.safetensors
MARSHALL_LORA_TRIGGER_WORD=MARSHALL_UNIQ
```

### Step 5: Test the LoRA

Generate a test image and verify:
1. Face matches Marshall consistently
2. Scene looks natural and realistic
3. Works for both candid and portrait shots

## Using the LoRA

Once configured, the system automatically:
1. Detects when `MARSHALL_LORA_URL` is set
2. Uses LoRA-enabled providers (Fal.ai or Replicate) for Marshall images
3. Inserts the trigger word into prompts automatically
4. Generates lifestyle scenes with consistent face matching

**Example prompts that work great with LoRA:**
- "MARSHALL_UNIQ walking through a European city, candid street photography"
- "MARSHALL_UNIQ having coffee at an outdoor cafe, natural lighting"
- "MARSHALL_UNIQ at a tennis tournament, observing players, documentary style"
- "Portrait of MARSHALL_UNIQ, professional headshot"

## Troubleshooting

### LoRA not being used

**Check:**
1. `MARSHALL_LORA_URL` is set correctly
2. URL is publicly accessible
3. Provider supports LoRA (Fal.ai or Replicate)
4. API keys are configured

**Logs to check:**
```
[Image Provider] Using LoRA: https://...
[Fal Provider] LoRA: Yes
```

### Face not matching

**Possible issues:**
1. **Not enough training images** - Need at least 10, preferably 15-20
2. **Poor quality training images** - Use high-res, clear images
3. **Not enough variety** - Include different angles, lighting, settings
4. **Trigger word not in prompt** - System should add it automatically, but check logs

**Solution:** Retrain with better/more training images

### Scene not looking natural

**Possible issues:**
1. **LoRA scale too high** - Try reducing `loraScale` (default 0.8)
2. **Prompt conflicts** - Ensure prompt describes the scene, not just the person

**Solution:** Adjust LoRA scale or refine prompts

## Advanced: Multiple LoRAs

You can combine multiple LoRAs (e.g., person + style) using Replicate's multi-LoRA support. This is handled automatically if you configure multiple LoRA URLs.

## Cost Considerations

- **Training**: ~$2 one-time cost
- **Inference**: 
  - Fal.ai: ~$0.01-0.05 per image
  - Replicate: ~$0.01-0.03 per image
- **Storage**: Minimal (LoRA weights are small, ~10-50MB)

## Next Steps

1. Train your LoRA with high-quality images
2. Configure environment variables
3. Test with various lifestyle scenes
4. Refine prompts for best results
5. Enjoy consistent face matching across all scene types! 🎉
