/**
 * Train LoRA Model for Marshall
 * 
 * This script trains a LoRA model using Replicate's Flux fast finetune.
 * 
 * Prerequisites:
 * 1. Run prepare-lora-training.ts first to create the zip file
 * 2. Upload the zip to a public URL (or use Replicate file upload)
 * 3. Set REPLICATE_API_TOKEN environment variable
 * 
 * Run with: npx tsx scripts/train-lora.ts
 */

import { trainLoRA } from '../lib/ai/lora-training';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const ZIP_PATH = path.join(__dirname, 'temp', 'marshall-training-images.zip');
const MODEL_NAME = 'marshall-lora';
const TRIGGER_WORD = 'MARSHALL_UNIQ';
const TRAINING_STEPS = 1000;

async function uploadToReplicate(zipPath: string, apiToken: string): Promise<string> {
  console.log('📤 Uploading zip file to Replicate...\n');
  
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: apiToken });

  try {
    // Replicate can handle file uploads directly
    // We'll use their file upload API or pass the file path
    // For now, we'll need a public URL, so let's check if we can use Replicate's upload
    
    // Read the file
    const fileBuffer = fs.readFileSync(zipPath);
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`📦 File size: ${fileSizeMB} MB`);
    
    // Replicate's API accepts file uploads via their upload endpoint
    // We'll use the replicate client's file handling
    // For now, we need to upload to a public URL first
    
    // Option 1: Use Replicate's file upload (if supported)
    // Option 2: Upload to a public service and get URL
    
    // For simplicity, let's try using the file directly with Replicate
    // Replicate's Python client handles local files, but TypeScript client might need URL
    
    // We'll need to upload to a public URL first
    // Options: Supabase Storage, S3, or any public file hosting
    
    throw new Error('File upload not yet implemented. Please upload the zip file to a public URL first.');
    
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting LoRA Training for Marshall\n');
  
  // Check for API token
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error('❌ Error: REPLICATE_API_TOKEN environment variable not set.');
    console.error('   Set it in your .env.local file or export it in your shell.');
    process.exit(1);
  }

  // Check if zip file exists
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌ Error: Zip file not found at ${ZIP_PATH}`);
    console.error('   Run: npx tsx scripts/prepare-lora-training.ts first');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Model name: ${MODEL_NAME}`);
  console.log(`   Trigger word: ${TRIGGER_WORD}`);
  console.log(`   Training steps: ${TRAINING_STEPS}`);
  console.log(`   Zip file: ${ZIP_PATH}\n`);

  // For now, we need a public URL to the zip file
  // You can upload it to:
  // 1. Supabase Storage (if you have it set up)
  // 2. AWS S3
  // 3. Cloudflare R2
  // 4. Any public file hosting service
  
  console.log('📤 Step 1: Upload zip file to a public URL');
  console.log('   Options:');
  console.log('   - Supabase Storage');
  console.log('   - AWS S3');
  console.log('   - Cloudflare R2');
  console.log('   - Any public file hosting\n');
  
  // Prompt for URL (or we can implement auto-upload)
  const trainingImagesUrl = process.env.TRAINING_IMAGES_URL;
  
  if (!trainingImagesUrl) {
    console.error('❌ Error: TRAINING_IMAGES_URL environment variable not set.');
    console.error('   Please upload the zip file to a public URL and set:');
    console.error('   TRAINING_IMAGES_URL=https://your-public-url.com/marshall-training-images.zip');
    process.exit(1);
  }

  console.log(`✅ Using training images URL: ${trainingImagesUrl}\n`);

  try {
    // Train the LoRA
    console.log('🎓 Starting LoRA training...\n');
    const result = await trainLoRA(apiToken, {
      modelName: MODEL_NAME,
      trainingImagesUrl: trainingImagesUrl,
      triggerWord: TRIGGER_WORD,
      steps: TRAINING_STEPS,
    });

    console.log('\n✨ Training Complete!\n');
    console.log('📋 Results:');
    console.log(`   LoRA Weights URL: ${result.loraWeightsUrl}`);
    console.log(`   Model Version: ${result.modelVersion}`);
    console.log(`   Trigger Word: ${result.triggerWord}\n`);
    
    console.log('🔧 Next Steps:');
    console.log('   1. Add to your .env.local:');
    console.log(`      MARSHALL_LORA_URL=${result.loraWeightsUrl}`);
    console.log(`      MARSHALL_LORA_TRIGGER_WORD=${result.triggerWord}`);
    console.log('   2. Set FAL_API_KEY (or use Replicate for inference)');
    console.log('   3. Start generating images with consistent Marshall face! 🎉\n');

  } catch (error: any) {
    console.error('\n❌ Training failed:', error.message);
    if (error.message.includes('Unexpected')) {
      console.error('\n💡 Tip: Check the Replicate API response format may have changed.');
      console.error('   The training might still be in progress. Check your Replicate dashboard.');
    }
    process.exit(1);
  }
}

main();
