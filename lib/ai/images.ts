/**
 * Image Generation Integration
 * 
 * Uses Replicate/Flux for generating Marshall images with consistency
 */

import Replicate from 'replicate';
import { getImageStrategy, ImageStrategy } from './image-strategy';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE_IDENTITY_IMAGE = '/assets/base_identity.png';
const MARSHALL_FACE_REFERENCE = process.env.MARSHALL_FACE_REFERENCE_URL || BASE_IDENTITY_IMAGE;

if (!REPLICATE_API_TOKEN) {
  console.warn('REPLICATE_API_TOKEN not set. Image generation will fail.');
}

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
 */
export async function generatePostImage(
  context: ImageGenerationContext
): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    // Return placeholder image
    return '/consistency_test/consistency_gym_141939.png';
  }

  // Get image strategy based on post type and content
  const strategy = getImageStrategy(
    context.postType,
    context.topic,
    context.tournament,
    context.isRecap
  );
  
  // Override with explicit values if provided
  const includeMarshall = context.includeMarshall !== undefined 
    ? context.includeMarshall 
    : strategy.includeMarshall;
  
  const sceneDescription = context.scene || strategy.sceneDescription;

  console.log(`[Image Generation] Strategy: ${strategy.imageType}, Include Marshall: ${includeMarshall}`);
  console.log(`[Image Generation] Scene: ${sceneDescription.substring(0, 100)}...`);

  const prompt = buildImagePrompt({
    ...context,
    includeMarshall,
    sceneDescription,
    strategy,
  });

  try {
    const client = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    // Use face consistency model if Marshall is included
    // flux-pulid supports face ID for consistency
    const useFaceConsistency = includeMarshall && MARSHALL_FACE_REFERENCE && MARSHALL_FACE_REFERENCE !== BASE_IDENTITY_IMAGE;
    const model = useFaceConsistency
      ? 'zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b'
      : 'black-forest-labs/flux-dev';

    const input: any = {
      prompt,
      aspect_ratio: '16:9',
      output_format: 'png',
      output_quality: 90,
    };

    // Add face reference for consistency (flux-pulid model)
    if (useFaceConsistency) {
      // flux-pulid uses 'main_face_image' parameter
      // We need to pass a URL or file handle to the reference image
      input.main_face_image = MARSHALL_FACE_REFERENCE;
      input.num_steps = 20;
      input.guidance_scale = 4;
      input.start_step = 0; // Apply face ID from the beginning
      input.id_weight = 1.0; // Maximum strength for face copying
      console.log(`[Image Generation] Using face consistency model with reference: ${MARSHALL_FACE_REFERENCE}`);
    }

    const output = await client.run(model, { input });

    // Replicate returns a URL or array of URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error('No image URL returned from Replicate');
    }

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

  // Marshall's consistent appearance (use same description every time for consistency)
  const marshallDescription = `Marshall, a handsome 33-year-old tennis tour insider with ambiguous European appearance, olive skin, dark brown hair with light stubble, signature messy textured hair, expressive eyes, athletic build, 5'10" height. `;

  if (includeMarshall) {
    prompt += marshallDescription;
  }

  // Use strategy-based scene description
  prompt += sceneDescription;

  // Add style guide from strategy
  prompt += ` ${strategy.styleGuide}. `;

  // Consistency and quality settings
  prompt += `Photorealistic, high quality, professional photography. Natural lighting, authentic moment. `;
  
  // Face consistency note (if Marshall is included)
  if (includeMarshall) {
    prompt += `Maintain consistent facial features and appearance across all images. Same person, same face structure, same hair style. `;
  }

  prompt += `--ar 16:9 --style raw --quality 90`;

  return prompt;
}

/**
 * Save generated image to public directory
 */
async function saveImage(imageUrl: string, context: ImageGenerationContext): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Generate filename
    const timestamp = Date.now();
    const slug = context.topic.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    const filename = `${slug}_${timestamp}.png`;
    const filepath = `public/posts/${filename}`;

    // In a real implementation, you'd save to the filesystem
    // For now, return the URL (you can implement file saving later)
    // Or use Supabase Storage to store images
    
    // For MVP, return the Replicate URL (it's temporary, but works for testing)
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
