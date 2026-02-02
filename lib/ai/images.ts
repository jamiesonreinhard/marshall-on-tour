/**
 * Image Generation Integration
 * 
 * Supports multiple providers: Replicate/Flux and Google Imagen
 * Toggle via IMAGE_GENERATION_PROVIDER env var: 'replicate' or 'imagen'
 */

import { getImageStrategy, ImageStrategy } from './image-strategy';
import { getStockImageForPost } from './stock-images';
import { getImageProvider, ImageProviderInterface } from './image-providers';

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
  let provider: ImageProviderInterface;
  try {
    provider = getImageProvider();
  } catch (error: any) {
    console.warn(`[Image Generation] Provider setup failed: ${error.message}. Returning fallback image.`);
    return getFallbackImage(context.postType);
  }
  
  const sceneDescription = context.scene || strategy.sceneDescription;

  console.log(`[Image Generation] Using AI generation - Strategy: ${strategy.imageType}, Include Marshall: ${includeMarshall}`);
  console.log(`[Image Generation] Scene: ${sceneDescription.substring(0, 100)}...`);

  const prompt = buildImagePrompt({
    ...context,
    includeMarshall,
    sceneDescription,
    strategy,
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

  const useFaceConsistency = includeMarshall && MARSHALL_FACE_REFERENCE && MARSHALL_FACE_REFERENCE !== BASE_IDENTITY_IMAGE;
  
  console.log('\n========== IMAGE PROVIDER INPUT ==========');
  console.log('Provider:', provider.getName());
  console.log('Include Marshall:', includeMarshall);
  console.log('Use Face Consistency:', useFaceConsistency);
  if (useFaceConsistency) {
    console.log('Face Reference:', MARSHALL_FACE_REFERENCE);
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
 */
function buildImagePrompt(context: ImageGenerationContext & { strategy: ImageStrategy; sceneDescription: string }): string {
  const { includeMarshall, sceneDescription, strategy } = context;

  let prompt = '';

  // CRITICAL: Start with composition instructions FIRST (before face description)
  // This helps the model prioritize composition over face centering
  if (includeMarshall) {
    prompt += `LANDSCAPE ORIENTATION, 16:9 aspect ratio. CANDID STREET PHOTOGRAPHY STYLE. Wide shot, full body or three-quarter view. Marshall is completely unaware of the camera, NOT looking at camera, NOT posing, NOT staged. Natural, unposed moment. Marshall is absorbed in an activity - sipping coffee, reading, walking, observing, talking - completely natural body language. Environmental portraiture with full context visible. Documentary photography style, not portrait photography. CRITICAL: Subject (Marshall) should be vertically centered in the frame to avoid getting cut off. Use rule of thirds horizontally, but center vertically for landscape format. `;
  }

  // Marshall's consistent appearance (use same description every time for consistency)
  // CRITICAL: Add neutral/serious expression to avoid smiles and direct eye contact
  const marshallDescription = `Marshall, a handsome 33-year-old tennis tour insider with ambiguous European appearance, olive skin, dark brown hair with light stubble, signature messy textured hair, expressive eyes, athletic build, 5'10" height. CRITICAL EXPRESSION: Completely neutral, serious, or contemplative facial expression. Mouth closed, lips together, NO smile, NO teeth showing, NO grinning, NO happy expression. Eyes looking away from camera - looking at street, coffee, phone, surroundings, or down. NOT looking at camera, NOT making eye contact, NOT aware of camera, NOT engaging with viewer. Completely absorbed, unaware, natural moment. `;

  if (includeMarshall) {
    prompt += marshallDescription;
    // Additional composition reinforcement - emphasize candid, unaware of camera, vertical centering
    prompt += `COMPOSITION: Landscape orientation (16:9), wide shot, full body visible. Marshall is completely absorbed in an activity, unaware of camera, NOT looking at camera, NOT posing, NOT smiling. Neutral or contemplative facial expression. Natural body language - relaxed shoulders, natural hand positions, authentic unposed moment. Marshall is part of the scene, environment clearly visible around him. Street photography aesthetic, candid moment captured naturally. Marshall's gaze is directed away from camera - looking at street, coffee, phone, or surroundings. CRITICAL: Subject vertically centered in frame (not too high, not too low) to prevent cropping issues in landscape format. `;
  }

  // Use strategy-based scene description
  prompt += sceneDescription;

  // Add style guide from strategy
  prompt += ` ${strategy.styleGuide}. `;

  // Consistency and quality settings - emphasize candid, street photography
  prompt += `Street photography style, candid moment, photorealistic, natural lighting, authentic unposed moment. Documentary photography aesthetic. NOT portrait photography. NOT studio photography. NOT staged. `;
  
  // Face consistency (if Marshall is included) - but emphasize it's about features, not framing
  if (includeMarshall) {
    prompt += `Maintain consistent facial features and appearance across all images. Same person, same face structure, same hair style. `;
    prompt += `CRITICAL CANDID PHOTOGRAPHY RULES: Landscape orientation (16:9). Marshall is completely unaware of camera, NOT looking at camera, NOT posing, NOT staged. Natural body language, authentic moment. Wide shot showing full context. Environment is prominent - cafe, street, park, etc. Marshall is absorbed in activity, not performing for camera. Street photography style, documentary aesthetic. NOT portrait photography. NOT looking at camera. NOT posed. NOT staged. CRITICAL: Subject vertically centered in landscape frame to avoid cropping. `;
  }

  prompt += `Landscape orientation, 16:9 aspect ratio, subject vertically centered. --ar 16:9 --style raw --quality 90`;

  return prompt;
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
