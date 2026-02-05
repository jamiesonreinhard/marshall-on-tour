"""
Prepare LoRA Training Images

This script collects all Marshall training images and creates a zip file
ready for LoRA training.

Run with: python scripts/prepare-lora-training.py
"""

import os
import zipfile
from pathlib import Path

# Get paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "scripts" / "temp"
ZIP_PATH = OUTPUT_DIR / "marshall-training-images.zip"

# All directories containing training images
IMAGE_DIRS = [
    PROJECT_ROOT / "public" / "consistency_test",
    PROJECT_ROOT / "public" / "assets",
    PROJECT_ROOT / "public" / "casting",
]

def main():
    print("📦 Preparing LoRA training images...\n")

    # Create temp directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Collect all image files
    image_files = []
    image_extensions = {".png", ".jpg", ".jpeg", ".webp"}

    for dir_path in IMAGE_DIRS:
        if not dir_path.exists():
            print(f"⚠️  Directory not found: {dir_path}")
            continue

        for file_path in dir_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                image_files.append(file_path)
                print(f"✅ Found: {file_path.name}")

    if not image_files:
        print("❌ No image files found!")
        exit(1)

    print(f"\n📊 Total images: {len(image_files)}")
    print("📦 Creating zip file...\n")

    # Create zip file
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zipf:
        for image_path in image_files:
            # Add file to zip with just the filename (not full path)
            zipf.write(image_path, image_path.name)
            print(f"   Added: {image_path.name}")

    # Get file size
    size_mb = ZIP_PATH.stat().st_size / 1024 / 1024

    print(f"\n✅ Zip file created: {ZIP_PATH}")
    print(f"📦 Size: {size_mb:.2f} MB")
    print(f"📁 Contains {len(image_files)} images\n")
    print("✨ Preparation complete!")
    print("\nNext step: Run training with:")
    print("   python scripts/train-lora.py\n")

if __name__ == "__main__":
    main()
