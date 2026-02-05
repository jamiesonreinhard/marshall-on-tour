/**
 * Train LoRA Model for Marshall using Fal.ai
 * 
 * This script uses the @fal-ai/client library which handles file uploads,
 * queue management, and polling automatically.
 * 
 * Prerequisites:
 * 1. Run prepare-lora-training.ts first to create the zip file
 * 2. Set FAL_API_KEY environment variable
 * 
 * Run with: npx tsx scripts/train-lora-fal.ts
 */

import { fal } from "@fal-ai/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  const envPath2 = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath2)) {
    dotenv.config({ path: envPath2 });
  }
}

// Configuration
const ZIP_PATH = path.join(__dirname, "..", "scripts", "temp", "marshall-training-images.zip");
const TRIGGER_WORD = "MARSHALL_UNIQ";
const TRAINING_STEPS = 1000;

async function main() {
  console.log("🚀 Starting LoRA Training for Marshall (Fal.ai)\n");

  // Check for API key
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: FAL_API_KEY environment variable not set.");
    console.error("   Set it in your .env.local file or export it in your shell.");
    process.exit(1);
  }

  // Configure Fal.ai client
  fal.config({
    credentials: apiKey,
  });

  // Check if zip file exists
  if (!fs.existsSync(ZIP_PATH)) {
    console.error("❌ Error: Zip file not found at " + ZIP_PATH);
    console.error("   Run: npx tsx scripts/prepare-lora-training.ts first");
    process.exit(1);
  }

  const zipSizeMB = fs.statSync(ZIP_PATH).size / 1024 / 1024;
  console.log("📋 Configuration:");
  console.log("   Trigger word: " + TRIGGER_WORD);
  console.log("   Training steps: " + TRAINING_STEPS);
  console.log("   Zip file: " + ZIP_PATH + " (" + zipSizeMB.toFixed(2) + " MB)\n");

  try {
    console.log("📤 Uploading zip file and starting training...");
    console.log("   This may take 2-5 minutes...\n");

    // First, upload the zip file to Supabase Storage to get a public URL
    // Fal.ai expects images_data_url to be a URL string, not a Buffer
    console.log("   📤 Uploading zip to Supabase Storage...");
    
    let zipUrl: string;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Read zip file as buffer
      const zipBuffer = fs.readFileSync(ZIP_PATH);
      const filename = "lora-training/marshall-training-images-" + Date.now() + ".zip";
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("marshall-assets")
        .upload(filename, zipBuffer, {
          contentType: "application/zip",
          upsert: false,
        });
      
      if (uploadError) {
        throw new Error("Supabase upload failed: " + uploadError.message);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("marshall-assets")
        .getPublicUrl(filename);
      
      zipUrl = urlData.publicUrl;
      console.log("   ✅ Uploaded to Supabase Storage: " + zipUrl + "\n");
    } catch (error: any) {
      console.error("   ❌ Upload failed: " + (error.message || error));
      console.error("\n   Please upload the zip file manually:");
      console.error("   1. Upload to Supabase Storage or any public file hosting");
      console.error("   2. Upload: " + ZIP_PATH);
      console.error("   3. Set environment variable: TRAINING_IMAGES_URL=<the-url>");
      console.error("   4. Run this script again\n");
      process.exit(1);
    }

    // Use Fal.ai's subscribe method which handles:
    // - Queue management
    // - Polling for completion
    // - Progress updates
    console.log("   🚀 Starting Fal.ai training job...");
    console.log("   ⏳ This may take 5-15 minutes. Training is in progress...\n");
    
    const result: any = await fal.subscribe("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: zipUrl, // URL string to zip file
        trigger_word: TRIGGER_WORD,
        steps: TRAINING_STEPS,
        create_masks: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_QUEUE") {
          process.stdout.write("\r   📋 Status: In queue...");
        } else if (update.status === "IN_PROGRESS") {
          const logs = update.logs || [];
          if (logs.length > 0) {
            const latestLog = logs[logs.length - 1];
            const message = typeof latestLog === "string" ? latestLog : latestLog.message || "";
            const displayMessage = message.substring(0, 60);
            process.stdout.write("\r   ⏳ Training: " + displayMessage + "...");
          } else {
            process.stdout.write("\r   ⏳ Training in progress...");
          }
        } else if (update.status === "COMPLETED") {
          process.stdout.write("\r   ✅ Training completed!\n");
        }
      },
    });

    console.log("\n\n✨ Training Complete!\n");
    console.log("📋 Results:");

    // Extract LoRA URL from result
    // The result structure is: result.data.diffusers_lora_file.url
    const resultData = result.data || result;
    const loraFile = resultData.diffusers_lora_file;
    const loraUrl = typeof loraFile === "string" ? loraFile : loraFile?.url;

    if (loraUrl) {
      console.log("   LoRA Weights URL: " + loraUrl);
      
      if (resultData.config_file) {
        const configFile = resultData.config_file;
        const configUrl = typeof configFile === "string" ? configFile : configFile?.url;
        if (configUrl) {
          console.log("   Config File URL: " + configUrl);
        }
      }

      console.log("   Trigger Word: " + TRIGGER_WORD + "\n");

      console.log("🔧 Next Steps:");
      console.log("   1. Add to your .env.local:");
      console.log("      MARSHALL_LORA_URL=" + loraUrl);
      console.log("      MARSHALL_LORA_TRIGGER_WORD=" + TRIGGER_WORD);
      console.log("   2. Start generating images with consistent Marshall face! 🎉\n");
    } else {
      console.error("   ⚠️  Could not find LoRA URL in response:");
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error: any) {
    console.error("\n❌ Training failed:", error.message);
    if (error.response) {
      console.error("   Response:", error.response.data);
    }
    console.error("\n💡 Tips:");
    console.error("   - Check your Fal.ai account has credits");
    console.error("   - Verify the zip file is valid");
    console.error("   - Check Fal.ai API status");
    process.exit(1);
  }
}

main();
