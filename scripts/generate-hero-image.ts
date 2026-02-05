/**
 * Generate Landscape Hero Image for Homepage
 * 
 * Generates a 16:9 landscape image of Marshall on a plane with champagne
 * Same clothes as base_identity.png (beige/tan hoodie)
 * 
 * Usage: tsx scripts/generate-hero-image.ts
 */

import { getImageProvider } from '../lib/ai/image-providers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function generateHeroImage() {
  console.log('🎨 Generating landscape hero image for homepage...\n');

  // Get image provider
  const provider = getImageProvider();
  console.log(`Using provider: ${provider.getName()}\n`);

  // Build prompt for landscape hero image
  // Based on base_identity.png: Marshall on plane, champagne, beige/tan hoodie
  // Wide-angle view, landscape orientation, cinematic
  const prompt = `Wide-angle landscape view of Marshall, a man in his 30s with medium-brown wavy hair styled upwards and light stubble, wearing a light beige or tan hooded sweatshirt (hoodie), seated in a modern airplane cabin. He holds a clear stemmed glass filled with golden-yellow sparkling champagne in his left hand, a prominent ornate silver ring with dark stone visible on his left ring finger. The scene shows a wide cinematic view of the airplane interior with black leather seats, curved white walls, and airplane windows visible in the background. Soft, even cabin lighting typical of airplane interiors. The mood is relaxed, sophisticated, and travel-focused. Landscape composition, 16:9 aspect ratio, cinematic framing, professional photography style, high quality, detailed, photorealistic`;

  const negativePrompt = 'portrait, close-up, headshot, looking directly at camera, smiling at camera, posed, staged, selfie, vertical orientation, square format';

  console.log('Prompt:', prompt);
  console.log('\nNegative Prompt:', negativePrompt);
  console.log('\nGenerating image...\n');

  try {
    // Get LoRA config if available
    const loraUrl = process.env.MARSHALL_LORA_URL;
    const loraTriggerWord = process.env.MARSHALL_LORA_TRIGGER_WORD || 'MARSHALL_UNIQ';
    const faceReferenceUrl = process.env.MARSHALL_FACE_REFERENCE_URL || '/assets/base_identity.png';

    // Generate image with 16:9 aspect ratio (landscape)
    const imageUrl = await provider.generateImage({
      prompt,
      negativePrompt,
      aspectRatio: '16:9',
      includeMarshall: true,
      faceReferenceUrl: faceReferenceUrl.startsWith('http') ? faceReferenceUrl : undefined, // Only pass if it's a URL
      idWeight: 0.6,
      loraUrl: loraUrl,
      loraScale: 0.8,
      triggerWord: loraUrl ? loraTriggerWord : undefined,
    });

    console.log('✅ Image generated successfully!');
    console.log('Image URL:', imageUrl);

    // Download and save the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const outputPath = path.join(process.cwd(), 'public', 'assets', 'hero_landscape.png');
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save image
    fs.writeFileSync(outputPath, Buffer.from(imageBuffer));
    console.log(`\n✅ Image saved to: ${outputPath}`);
    console.log(`\nYou can now use this image in variant 4B at: /assets/hero_landscape.png`);

    return outputPath;
  } catch (error: any) {
    console.error('❌ Error generating hero image:', error);
    process.exit(1);
  }
}

// Run the script
generateHeroImage();
