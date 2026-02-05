/**
 * Prepare LoRA Training Images
 * 
 * This script collects all Marshall training images and creates a zip file
 * ready for LoRA training.
 * 
 * Run with: npx tsx scripts/prepare-lora-training.ts
 */

import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

const PROJECT_ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "scripts", "temp");
const ZIP_PATH = path.join(OUTPUT_DIR, "marshall-training-images.zip");

// All directories containing training images
const IMAGE_DIRS = [
  path.join(PROJECT_ROOT, "public", "consistency_test"),
  path.join(PROJECT_ROOT, "public", "assets"),
  path.join(PROJECT_ROOT, "public", "casting"),
];

async function prepareTrainingImages() {
  console.log("📦 Preparing LoRA training images...\n");

  // Create temp directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Collect all image files
  const imageFiles: string[] = [];
  const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];

  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Directory not found: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const fullPath = path.join(dir, file);
        imageFiles.push(fullPath);
        console.log(`✅ Found: ${file}`);
      }
    }
  }

  if (imageFiles.length === 0) {
    console.error("❌ No image files found!");
    process.exit(1);
  }

  console.log(`\n📊 Total images: ${imageFiles.length}`);
  console.log("📦 Creating zip file...\n");

  // Create zip file
  return new Promise<string>((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Zip file created: ${ZIP_PATH}`);
      console.log(`📦 Size: ${sizeMB} MB`);
      console.log(`📁 Contains ${imageFiles.length} images\n`);
      resolve(ZIP_PATH);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all images to zip
    for (const imagePath of imageFiles) {
      const fileName = path.basename(imagePath);
      archive.file(imagePath, { name: fileName });
    }

    archive.finalize();
  });
}

// Run the script
prepareTrainingImages()
  .then((zipPath) => {
    console.log("✨ Preparation complete!");
    console.log(`\n📦 Zip file ready: ${zipPath}`);
    console.log("\nNext step: Run training with:");
    console.log("   npx tsx scripts/train-lora-fal.ts\n");
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
