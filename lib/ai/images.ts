/**
 * Image Generation Integration
 * 
 * Uses Replicate/Flux for generating Marshall images
 */

import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE_IDENTITY_IMAGE = '/assets/base_identity.png';

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
  includeMarshall?: boolean; // Whether to include Marshall in the image
  scene?: string; // Specific scene description
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

  const prompt = buildImagePrompt(context);

  try {
    const client = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    const output = await client.run(
      'black-forest-labs/flux-dev',
      {
        input: {
          prompt,
          aspect_ratio: '16:9',
          output_format: 'png',
          output_quality: 90,
        },
      }
    );

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
 * Build image generation prompt
 */
function buildImagePrompt(context: ImageGenerationContext): string {
  const { postType, topic, tournament, includeMarshall = true, scene } = context;

  let prompt = '';

  if (includeMarshall) {
    prompt += `A hyper-realistic, candid photo of Marshall, a handsome 33-year-old tennis tour insider. He has an ambiguous European appearance, olive skin, dark hair, light stubble, signature messy textured hair. `;
  }

  switch (postType) {
    case 'gear':
      prompt += scene || `Marshall reviewing tennis equipment. High-end tennis gear visible. Clean, modern aesthetic. `;
      break;
    case 'travel':
      if (tournament) {
        prompt += scene || `Marshall in ${tournament.location} for ${tournament.name}. Luxury travel setting, hotel or airport. `;
      } else {
        prompt += scene || `Marshall traveling for tennis. Airport, hotel, or tournament location. `;
      }
      break;
    case 'analysis':
      prompt += scene || `Marshall courtside at a tennis tournament. Professional tennis setting, stadium in background. `;
      break;
    case 'lifestyle':
      prompt += scene || `Marshall in a casual, luxury setting. Coffee shop, hotel lobby, or similar. `;
      break;
  }

  prompt += `Photorealistic, iPhone 15 Pro aesthetic, unpolished, authentic social media style. Quiet luxury vibe. Shot on iPhone, natural lighting. --ar 16:9`;

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
