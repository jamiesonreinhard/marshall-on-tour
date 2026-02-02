# Image Generation Providers

The image generation system supports multiple providers and can be easily toggled via environment variables.

## Supported Providers

1. **Replicate** (default) - Uses Flux models with face consistency via flux-pulid
2. **Google Imagen** - Uses Vertex AI Imagen API

## Configuration

### Toggle Provider

Set the `IMAGE_GENERATION_PROVIDER` environment variable:

```bash
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

## Provider Comparison

### Replicate (Flux)
- ✅ Face consistency via flux-pulid model
- ✅ Negative prompts supported
- ✅ Fine-tuned control over face weight
- ✅ Fast generation
- ❌ Costs per generation

### Google Imagen
- ✅ May produce more natural/candid images
- ✅ Integrated with Google Cloud
- ⚠️ Face consistency may work differently
- ⚠️ Requires Vertex AI setup
- ❌ May have different prompt interpretation

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
