/**
 * Image Generation Integration
 * 
 * Supports multiple providers: Replicate/Flux, Fal.ai, and Google Imagen
 * Automatically routes to the best provider based on configuration and use case
 */

import { getImageStrategy, ImageStrategy } from './image-strategy';
import { getStockImageForPost } from './stock-images';
import { getImageProvider, ImageProviderInterface, ReplicateProvider, ImagenProvider, FalProvider } from './image-providers';

const BASE_IDENTITY_IMAGE = '/assets/base_identity.png';
const MARSHALL_FACE_REFERENCE = process.env.MARSHALL_FACE_REFERENCE_URL || BASE_IDENTITY_IMAGE;

export interface ImageGenerationContext {
  postType: 'gear' | 'travel' | 'analysis' | 'lifestyle';
  topic: string;
  tournament?: {
    name: string;
    location: string;
  };
  includeMarshall?: boolean; // Whether to include Marshall in the image (auto-determined if not provided)
  scene?: string; // Specific scene description (auto-generated if not provided)
  isRecap?: boolean; // Flag for recap posts
}

/**
 * Generate image for blog post
 * 
 * Strategy:
 * - Use stock images for non-Marshall posts (recaps, previews, gear guides, player profiles)
 * - Use AI generation only when Marshall needs to appear
 * - This reduces costs and provides authentic photography where appropriate
 */
export async function generatePostImage(
  context: ImageGenerationContext
): Promise<string> {
  // LOG: Image generation context
  console.log('\n========== IMAGE GENERATION CONTEXT ==========');
  console.log(JSON.stringify(context, null, 2));
  console.log('==============================================\n');
  
  // Get image strategy based on post type and content
  const strategy = getImageStrategy(
    context.postType,
    context.topic,
    context.tournament,
    context.isRecap
  );
  
  // LOG: Image strategy
  console.log('\n========== IMAGE STRATEGY ==========');
  console.log(JSON.stringify(strategy, null, 2));
  console.log('====================================\n');
  
  // Override with explicit values if provided
  const includeMarshall = context.includeMarshall !== undefined 
    ? context.includeMarshall 
    : strategy.includeMarshall;
  
  // If Marshall is NOT included, try stock images first (free, authentic)
  if (!includeMarshall) {
    console.log(`[Image Generation] Marshall not included - trying stock images first...`);
    
    const stockImage = await getStockImageForPost(
      context.postType,
      context.topic,
      context.tournament,
      context.isRecap
    );
    
    if (stockImage) {
      console.log(`[Image Generation] ✅ Using stock image: ${stockImage}`);
      return stockImage;
    }
    
    console.log(`[Image Generation] ⚠️ No stock image found, falling back to AI generation`);
  }
  
  // If Marshall IS included, or stock image failed, use AI generation
  const sceneDescription = context.scene || strategy.sceneDescription;
  
  // Smart routing: Choose provider based on whether we need face consistency
  const provider = selectImageProvider(includeMarshall, strategy, sceneDescription);
  
  if (!provider) {
    console.warn(`[Image Generation] Provider setup failed. Returning fallback image.`);
    return getFallbackImage(context.postType);
  }

  console.log(`[Image Generation] Using AI generation - Strategy: ${strategy.imageType}, Include Marshall: ${includeMarshall}`);
  console.log(`[Image Generation] Scene: ${sceneDescription.substring(0, 100)}...`);

  const prompt = buildImagePrompt({
    ...context,
    includeMarshall,
    sceneDescription,
    strategy,
    provider,
  });

  // LOG: Full image generation prompt
  console.log('\n========== IMAGE GENERATION PROMPT ==========');
  console.log(prompt);
  console.log('=============================================\n');
  
  // Build negative prompt - KEEP IT SHORT AND FOCUSED
  // Too many repetitions can cause the model to focus on those concepts instead of avoiding them
  // Focus only on the most critical things to avoid
  const negativePrompt = includeMarshall 
    ? 'portrait, headshot, looking at camera, smiling, posed, staged'
    : undefined;

  // Check for LoRA configuration (preferred method for face consistency)
  const loraUrl = process.env.MARSHALL_LORA_URL;
  const loraTriggerWord = process.env.MARSHALL_LORA_TRIGGER_WORD || 'MARSHALL_UNIQ';
  const useLoRA = includeMarshall && loraUrl;
  
  // Only use face consistency (flux-pulid) if LoRA is not available
  // For Gemini (candid shots), we avoid showing face to prevent consistency issues
  const isReplicate = provider.getName() === 'replicate';
  const isFal = provider.getName() === 'fal';
  const useFaceConsistency = !useLoRA && includeMarshall && isReplicate && MARSHALL_FACE_REFERENCE && MARSHALL_FACE_REFERENCE !== BASE_IDENTITY_IMAGE;
  
  console.log('\n========== IMAGE PROVIDER INPUT ==========');
  console.log('Provider:', provider.getName());
  console.log('Include Marshall:', includeMarshall);
  if (useLoRA) {
    console.log('Using LoRA:', loraUrl);
    console.log('Trigger Word:', loraTriggerWord);
  } else {
    console.log('Use Face Consistency:', useFaceConsistency, isReplicate ? '(Replicate profile image)' : '(Gemini candid - face not visible)');
    if (useFaceConsistency) {
      console.log('Face Reference:', MARSHALL_FACE_REFERENCE);
    }
  }
  console.log('==========================================\n');

  try {
    // Generate image using the selected provider
    const imageUrl = await provider.generateImage({
      prompt,
      negativePrompt,
      aspectRatio: '16:9',
      includeMarshall,
      faceReferenceUrl: useFaceConsistency ? MARSHALL_FACE_REFERENCE : undefined,
      idWeight: 0.6, // For Replicate face consistency
      loraUrl: useLoRA ? loraUrl : undefined,
      loraScale: useLoRA ? 0.8 : undefined, // Default LoRA strength
      triggerWord: useLoRA ? loraTriggerWord : undefined,
    });

    // Download and save image
    return await saveImage(imageUrl, context);
  } catch (error) {
    console.error('Error generating image:', error);
    // Return fallback image
    return getFallbackImage(context.postType);
  }
}

/**
 * Build image generation prompt with consistency and strategy
 * 
 * For Gemini (Nano Banana): Emphasize scenes without visible face (from behind, looking away, etc.)
 * For Replicate: Use face consistency for profile images (rare)
 */
function buildImagePrompt(context: ImageGenerationContext & { strategy: ImageStrategy; sceneDescription: string; provider: ImageProviderInterface }): string {
  const { includeMarshall, sceneDescription, strategy, provider } = context;
  const isReplicate = provider.getName() === 'replicate';
  const isProfileImage = isReplicate && includeMarshall; // Replicate = profile image (face visible)

  let prompt = '';

  if (includeMarshall) {
    if (isProfileImage) {
      // PROFILE IMAGE (Replicate) - Face-forward, looking at camera - RARE
      prompt += `PORTRAIT PHOTOGRAPHY, 16:9 aspect ratio. Professional headshot or three-quarter portrait. Marshall looking directly at camera, confident expression, professional lighting. `;
      prompt += `Marshall, a handsome 33-year-old tennis tour insider with ambiguous European appearance, olive skin, dark brown hair with light stubble, signature messy textured hair, expressive eyes, athletic build, 5'10" height. Professional portrait style, studio quality lighting. `;
    } else {
      // CANDID IMAGE (Gemini) - Face NOT visible or looking away - MOST COMMON
      prompt += `LANDSCAPE ORIENTATION, 16:9 aspect ratio. CANDID STREET PHOTOGRAPHY STYLE. Wide shot, full body or three-quarter view. Marshall is completely unaware of the camera, NOT looking at camera, NOT posing, NOT staged. Natural, unposed moment. Marshall is absorbed in an activity - sipping coffee, reading, walking, observing, talking - completely natural body language. Environmental portraiture with full context visible. Documentary photography style, not portrait photography. `;
      prompt += `CRITICAL: Marshall's face is either NOT visible (from behind, side profile, head down) OR looking away from camera (looking at street, coffee, phone, surroundings). Face should NOT be clearly visible to avoid consistency issues. Focus on body language, posture, and environment. `;
      prompt += `Marshall, a 33-year-old tennis tour insider with ambiguous European appearance, olive skin, dark brown hair, athletic build, 5'10" height. Marshall is completely absorbed in the moment, unaware of camera, natural body language. `;
    }
  }

  // Use strategy-based scene description
  prompt += sceneDescription;

  // Add style guide from strategy
  prompt += ` ${strategy.styleGuide}. `;

  // Style settings based on image type
  if (includeMarshall) {
    if (isProfileImage) {
      prompt += `Professional portrait photography, studio lighting, high quality, sharp focus on face. `;
    } else {
      prompt += `Street photography style, candid moment, photorealistic, natural lighting, authentic unposed moment. Documentary photography aesthetic. NOT portrait photography. NOT studio photography. NOT staged. Focus on environment and body language, not facial features. `;
    }
  } else {
    prompt += `Photorealistic, natural lighting, high quality photography. `;
  }

  prompt += `Landscape orientation, 16:9 aspect ratio. --ar 16:9 --style raw --quality 90`;

  return prompt;
}

/**
 * Smart provider selection based on image requirements
 * 
 * Updated Strategy with LoRA support:
 * - LoRA-enabled providers (Fal.ai or Replicate with LoRA): BEST for Marshall lifestyle scenes
 *   - Works for both candid AND portrait shots
 *   - Maintains face consistency while allowing natural scenes
 * - Replicate (flux-pulid): Fallback for profile images if LoRA not available
 * - Gemini (Nano Banana): For non-Marshall images or if LoRA/Replicate unavailable
 * 
 * Priority:
 * 1. LoRA-enabled provider (Fal.ai preferred, then Replicate with LoRA) if LoRA configured
 * 2. Replicate (flux-pulid) for profile images if no LoRA
 * 3. Gemini for everything else
 */
function selectImageProvider(
  includeMarshall: boolean,
  strategy: ImageStrategy,
  sceneDescription: string
): ImageProviderInterface | null {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const falApiKey = process.env.FAL_API_KEY;
  const useProModel = process.env.USE_GEMINI_PRO_IMAGE === 'true';
  const baseIdentityImage = process.env.MARSHALL_FACE_REFERENCE_URL || '/assets/base_identity.png';
  const loraUrl = process.env.MARSHALL_LORA_URL;
  const loraTriggerWord = process.env.MARSHALL_LORA_TRIGGER_WORD || 'MARSHALL_UNIQ';

  // If Marshall is NOT included → use Gemini (80-90% of images)
  if (!includeMarshall) {
    console.log(`[Image Provider] Marshall not included → Using Gemini (Nano Banana)`);
    if (!geminiApiKey) {
      console.warn(`[Image Provider] GEMINI_API_KEY not set, falling back to Replicate`);
      if (!replicateToken) {
        return null;
      }
      return new ReplicateProvider(replicateToken, baseIdentityImage);
    }
    return new ImagenProvider(geminiApiKey, useProModel);
  }

  // If Marshall IS included, prefer LoRA-enabled providers if LoRA is configured
  if (loraUrl) {
    // Prefer Fal.ai if configured and available
    if (falApiKey) {
      console.log(`[Image Provider] Marshall with LoRA → Using Fal.ai (Flux.1 + LoRA) for best lifestyle scenes`);
      return new FalProvider(falApiKey, loraUrl, loraTriggerWord);
    }
    
    // Fallback to Replicate with LoRA
    if (replicateToken) {
      console.log(`[Image Provider] Marshall with LoRA → Using Replicate (Flux.1 + LoRA) for lifestyle scenes`);
      return new ReplicateProvider(replicateToken, baseIdentityImage);
    }
    
    console.warn(`[Image Provider] LoRA configured but no provider available. Need FAL_API_KEY or REPLICATE_API_TOKEN.`);
  }

  // If no LoRA, check if it's a profile image (face-forward, looking at camera)
  // This is RARE - only for specific profile shots
  const sceneLower = sceneDescription.toLowerCase();
  const strategyLower = strategy.styleGuide.toLowerCase();
  const isPortrait = strategy.imageType === 'marshall-portrait';
  const isLookingAtCamera = sceneLower.includes('looking at camera') || 
                           sceneLower.includes('looking directly at camera') ||
                           sceneLower.includes('facing camera') ||
                           strategyLower.includes('looking at camera') ||
                           strategyLower.includes('portrait') ||
                           isPortrait;

  // ONLY use Replicate (flux-pulid) for profile images if no LoRA - RARE
  if (isPortrait || isLookingAtCamera) {
    console.log(`[Image Provider] Marshall profile image (looking at camera) → Using Replicate (flux-pulid) for face consistency`);
    if (!replicateToken) {
      console.warn(`[Image Provider] REPLICATE_API_TOKEN not set, falling back to Gemini`);
      if (!geminiApiKey) {
        return null;
      }
      return new ImagenProvider(geminiApiKey, useProModel);
    }
    return new ReplicateProvider(replicateToken, baseIdentityImage);
  }

  // Everything else (candid, from behind, looking away) → use Gemini
  // This avoids face consistency issues since face isn't visible anyway
  // BUT if LoRA is available, we should use it for better consistency
  if (loraUrl && (falApiKey || replicateToken)) {
    if (falApiKey) {
      console.log(`[Image Provider] Marshall candid with LoRA → Using Fal.ai (Flux.1 + LoRA) for best results`);
      return new FalProvider(falApiKey, loraUrl, loraTriggerWord);
    }
    if (replicateToken) {
      console.log(`[Image Provider] Marshall candid with LoRA → Using Replicate (Flux.1 + LoRA) for best results`);
      return new ReplicateProvider(replicateToken, baseIdentityImage);
    }
  }
  
  console.log(`[Image Provider] Marshall candid/face not visible → Using Gemini (Nano Banana) for better scene composition`);
  if (!geminiApiKey) {
    console.warn(`[Image Provider] GEMINI_API_KEY not set, falling back to Replicate`);
    if (!replicateToken) {
      return null;
    }
    return new ReplicateProvider(replicateToken, baseIdentityImage);
  }
  return new ImagenProvider(geminiApiKey, useProModel);
}

/**
 * Save generated image to public directory
 */
async function saveImage(imageUrl: string, context: ImageGenerationContext): Promise<string> {
  try {
    // Handle base64 data URLs (from Imagen)
    if (imageUrl.startsWith('data:image/')) {
      // For now, return the data URL directly
      // In production, you'd want to decode and upload to storage
      console.log('[Image Save] Received base64 data URL from provider');
      return imageUrl;
    }
    
    // Handle regular URLs (from Replicate)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // For MVP, return the URL directly (temporary URLs work for testing)
    // In production, you'd save to filesystem or Supabase Storage
    return imageUrl;
  } catch (error) {
    console.error('Error saving image:', error);
    return getFallbackImage(context.postType);
  }
}

/**
 * Get fallback image based on post type
 */
function getFallbackImage(postType: string): string {
  const fallbacks: Record<string, string> = {
    gear: '/consistency_test/consistency_gym_141939.png',
    travel: '/consistency_test/consistency_tuxedo_142009.png',
    analysis: '/consistency_test/consistency_snow_142041.png',
    lifestyle: '/assets/base_identity.png',
  };

  return fallbacks[postType] || '/assets/base_identity.png';
}
