/**
 * Image Generation Provider Abstraction
 * 
 * Allows easy switching between different image generation providers
 */

export type ImageProvider = 'replicate' | 'imagen';

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1';
  includeMarshall?: boolean;
  faceReferenceUrl?: string;
  idWeight?: number;
}

export interface ImageProviderInterface {
  generateImage(options: ImageGenerationOptions): Promise<string>;
  getName(): string;
}

/**
 * Replicate Provider (Flux models)
 */
export class ReplicateProvider implements ImageProviderInterface {
  private apiToken: string;
  private baseIdentityImage: string;

  constructor(apiToken: string, baseIdentityImage: string) {
    this.apiToken = apiToken;
    this.baseIdentityImage = baseIdentityImage;
  }

  getName(): string {
    return 'replicate';
  }

  async generateImage(options: ImageGenerationOptions): Promise<string> {
    const Replicate = (await import('replicate')).default;
    const client = new Replicate({ auth: this.apiToken });

    const useFaceConsistency = options.includeMarshall && 
                              options.faceReferenceUrl && 
                              options.faceReferenceUrl !== this.baseIdentityImage;

    const model = useFaceConsistency
      ? 'zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b'
      : 'black-forest-labs/flux-dev';

    const input: any = {
      prompt: options.prompt,
      aspect_ratio: options.aspectRatio || '16:9',
      output_format: 'png',
      output_quality: 90,
    };

    if (useFaceConsistency) {
      input.main_face_image = options.faceReferenceUrl;
      input.num_steps = 20;
      input.guidance_scale = 4;
      input.start_step = 0;
      input.id_weight = options.idWeight || 0.6;
      
      // Only add negative prompt if provided and not empty
      // Keep it minimal - too much can backfire
      if (options.negativePrompt && options.negativePrompt.trim()) {
        input.negative_prompt = options.negativePrompt;
      }
    }

    console.log(`[Replicate Provider] Generating image with model: ${model}`);
    if (useFaceConsistency) {
      console.log(`[Replicate Provider] Face consistency: ${options.faceReferenceUrl}, ID weight: ${input.id_weight}`);
    }

    const output = await client.run(model, { input });
    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error('No image URL returned from Replicate');
    }

    return imageUrl;
  }
}

/**
 * Google Nano Banana Provider (Gemini Image Generation)
 * Uses Gemini API directly - NOT Vertex AI
 * 
 * Models available:
 * - gemini-2.5-flash-image (fast, 1024px)
 * - gemini-3-pro-image-preview (high quality, up to 4K)
 * 
 * Note: Face consistency may work differently than Replicate
 * Face reference URLs may need to be passed differently
 */
export class ImagenProvider implements ImageProviderInterface {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, usePro: boolean = false) {
    this.apiKey = apiKey;
    // Use Pro model for higher quality, Flash for speed
    this.model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  }

  getName(): string {
    return 'imagen';
  }

  async generateImage(options: ImageGenerationOptions): Promise<string> {
    // Gemini API endpoint for image generation
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    // Map aspect ratio - Gemini supports these ratios
    const aspectRatioMap: Record<string, string> = {
      '16:9': '16:9',
      '4:5': '4:5',
      '1:1': '1:1',
      '2:3': '2:3',
      '3:2': '3:2',
      '3:4': '3:4',
      '4:3': '4:3',
      '5:4': '5:4',
      '9:16': '9:16',
      '21:9': '21:9',
    };
    const geminiAspectRatio = aspectRatioMap[options.aspectRatio || '16:9'] || '16:9';

    // Build request body according to Gemini API format
    const requestBody: any = {
      contents: [{
        parts: [{
          text: options.prompt,
        }],
      }],
      generationConfig: {
        imageConfig: {
          aspectRatio: geminiAspectRatio,
        },
      },
    };

    // For Pro model, can specify image size
    if (this.model === 'gemini-3-pro-image-preview') {
      requestBody.generationConfig.imageConfig.imageSize = '2K'; // Options: 1K, 2K, 4K
    }

    // Note: Gemini API doesn't support negative prompts the same way
    // The negative prompt concepts should be in the main prompt instead
    if (options.negativePrompt) {
      console.log(`[Imagen Provider] Note: Negative prompts not directly supported, concepts should be in main prompt`);
    }

    // If face reference is provided, fetch it and include as an image part
    // Gemini can use reference images in the prompt for face consistency
    if (options.includeMarshall && options.faceReferenceUrl) {
      console.log(`[Imagen Provider] Face reference provided: ${options.faceReferenceUrl}`);
      console.log(`[Imagen Provider] Fetching face reference image for face consistency...`);
      
      try {
        // Fetch the face reference image
        const faceImageResponse = await fetch(options.faceReferenceUrl);
        if (!faceImageResponse.ok) {
          console.warn(`[Imagen Provider] Failed to fetch face reference: ${faceImageResponse.status}`);
        } else {
          const faceImageBuffer = await faceImageResponse.arrayBuffer();
          const faceImageBase64 = Buffer.from(faceImageBuffer).toString('base64');
          
          // Determine MIME type from URL or default to PNG
          let mimeType = 'image/png';
          if (options.faceReferenceUrl.includes('.jpg') || options.faceReferenceUrl.includes('.jpeg')) {
            mimeType = 'image/jpeg';
          }
          
          // Add the face reference image as a part in the contents
          // Gemini can use this for face consistency
          requestBody.contents[0].parts.push({
            inlineData: {
              mimeType: mimeType,
              data: faceImageBase64,
            },
          });
          
          // Add explicit instruction to use this face - put it at the START of the prompt for emphasis
          const faceInstruction = `CRITICAL FACE CONSISTENCY: The reference image shows the exact person who must appear in this scene. Use the EXACT face, facial features, hair style, hair color, eye color, skin tone, facial structure, and all distinguishing features from the reference image. The person in the generated image MUST be the same person as in the reference image. `;
          // Prepend face instruction to the prompt for maximum emphasis
          requestBody.contents[0].parts[0].text = faceInstruction + requestBody.contents[0].parts[0].text;
          
          console.log(`[Imagen Provider] Face reference image added to request (${mimeType}, ${faceImageBase64.length} chars base64)`);
        }
      } catch (error: any) {
        console.warn(`[Imagen Provider] Error fetching face reference: ${error.message}`);
        // Continue without face reference if fetch fails
      }
    }

    console.log(`[Imagen Provider] Generating image via Gemini API`);
    console.log(`[Imagen Provider] Model: ${this.model}`);
    console.log(`[Imagen Provider] Aspect Ratio: ${geminiAspectRatio}`);
    console.log(`[Imagen Provider] Prompt: ${options.prompt.substring(0, 100)}...`);

    try {
      // Use x-goog-api-key header as per Gemini API documentation
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Imagen Provider] API error: ${response.status}`, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Gemini API returns images in candidates[0].content.parts
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        
        // Find the image part
        for (const part of parts) {
          if (part.inlineData) {
            // Image is base64 encoded in inlineData.data
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${imageData}`;
          }
        }
        
        console.error('[Imagen Provider] No image data in response:', JSON.stringify(data, null, 2));
        throw new Error('No image data found in Gemini API response');
      } else {
        console.error('[Imagen Provider] Unexpected response format:', JSON.stringify(data, null, 2));
        throw new Error('Unexpected response format from Gemini API');
      }
    } catch (error: any) {
      console.error('[Imagen Provider] Error:', error);
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }
}

/**
 * Get the configured image provider
 */
export function getImageProvider(): ImageProviderInterface {
  const provider = (process.env.IMAGE_GENERATION_PROVIDER || 'replicate').toLowerCase() as ImageProvider;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const useProModel = process.env.USE_GEMINI_PRO_IMAGE === 'true'; // Optional: use Pro model
  const baseIdentityImage = process.env.MARSHALL_FACE_REFERENCE_URL || '/assets/base_identity.png';

  console.log(`[Image Provider] Using provider: ${provider}`);

  if (provider === 'imagen') {
    if (!geminiApiKey) {
      console.warn('[Image Provider] Imagen selected but GEMINI_API_KEY not set. Falling back to Replicate.');
      if (!replicateToken) {
        throw new Error('No image generation provider configured. Set REPLICATE_API_TOKEN or GEMINI_API_KEY.');
      }
      return new ReplicateProvider(replicateToken, baseIdentityImage);
    }
    
    // Nano Banana uses Gemini API directly - NO project ID needed!
    console.log(`[Image Provider] Using Gemini API (Nano Banana) - no project ID required`);
    return new ImagenProvider(geminiApiKey, useProModel);
  }

  // Default to Replicate
  if (!replicateToken) {
    throw new Error('REPLICATE_API_TOKEN not set. Image generation will fail.');
  }

  return new ReplicateProvider(replicateToken, baseIdentityImage);
}
