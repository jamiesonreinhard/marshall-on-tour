"""
Train LoRA Model for Marshall using Fal.ai

This script trains a LoRA model using Fal.ai's Flux LoRA training endpoint.
Since you have Fal.ai credits, this might be easier than Replicate.

Prerequisites:
1. Run prepare-lora-training.py first to create the zip file
2. Set FAL_API_KEY environment variable

Run with: python scripts/train-lora-fal.py
"""

import os
import requests
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ZIP_PATH = PROJECT_ROOT / "scripts" / "temp" / "marshall-training-images.zip"
TRIGGER_WORD = "MARSHALL_UNIQ"
TRAINING_STEPS = 1000

# Try to load .env file
try:
    from dotenv import load_dotenv
    env_path = PROJECT_ROOT / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists():
            load_dotenv(env_path)
except ImportError:
    pass

def main():
    print("🚀 Starting LoRA Training for Marshall (Fal.ai)\n")
    
    # Check for API key
    api_key = os.environ.get("FAL_API_KEY")
    if not api_key:
        print("❌ Error: FAL_API_KEY environment variable not set.")
        print("   Set it in your .env.local file or export it in your shell.")
        exit(1)

    # Check if zip file exists
    if not ZIP_PATH.exists():
        print(f"❌ Error: Zip file not found at {ZIP_PATH}")
        print("   Run: python scripts/prepare-lora-training.py first")
        exit(1)

    print("📋 Configuration:")
    print(f"   Trigger word: {TRIGGER_WORD}")
    print(f"   Training steps: {TRAINING_STEPS}")
    print(f"   Zip file: {ZIP_PATH}\n")

    # Fal.ai training endpoint
    endpoint = "https://fal.run/fal-ai/flux-lora-fast-training"
    
    print("📤 Uploading training images and starting training...")
    print("   This may take 2-5 minutes (training is async)...\n")

    try:
        import time
        
        # According to Fal.ai docs: images_data_url should be a URL to zip archive
        # Base64 data URIs don't work for zip files - we need to upload to Fal.ai storage first
        # Docs: https://fal.ai/models/fal-ai/flux-lora-fast-training/api
        
        zip_size_mb = ZIP_PATH.stat().st_size / 1024 / 1024
        print(f"   📦 Reading {zip_size_mb:.2f} MB zip file...")
        
        # Fal.ai requires a publicly accessible URL for the zip file
        # Options:
        # 1. Check if user provided a URL via environment variable
        # 2. Use a temporary file hosting service
        # 3. User uploads manually and provides URL
        
        zip_url = os.environ.get("TRAINING_IMAGES_URL")
        
        if not zip_url:
            print("   💡 Fal.ai requires a publicly accessible URL for the zip file.")
            print("   Options:")
            print("   1. Upload zip to a public service (S3, Cloudflare R2, etc.)")
            print("   2. Use file.io for temporary hosting (free, 1 download)")
            print("   3. Set TRAINING_IMAGES_URL environment variable with the URL\n")
            
            # Try using file.io as a quick solution
            print("   📤 Attempting to upload to file.io (temporary hosting)...")
            try:
                with open(ZIP_PATH, "rb") as zip_file:
                    fileio_response = requests.post(
                        "https://file.io",
                        files={"file": zip_file},
                        timeout=60
                    )
                    
                    if fileio_response.ok:
                        fileio_data = fileio_response.json()
                        if fileio_data.get("success"):
                            zip_url = fileio_data.get("link")
                            print(f"   ✅ Uploaded to file.io: {zip_url}")
                            print("   ⚠️  Note: This link expires after 1 download. Training will use it immediately.\n")
                        else:
                            raise Exception("File.io upload failed")
                    else:
                        raise Exception(f"File.io error: {fileio_response.status_code}")
            except Exception as e:
                print(f"   ❌ File.io upload failed: {e}")
                print("\n   Please upload the zip file manually:")
                print(f"   1. Go to https://file.io or your preferred file hosting")
                print(f"   2. Upload: {ZIP_PATH}")
                print(f"   3. Set environment variable: TRAINING_IMAGES_URL=<the-url>")
                print(f"   4. Run this script again\n")
                exit(1)
        else:
            print(f"   ✅ Using provided URL: {zip_url}\n")
        
        # Start training with the file URL
        print("   📤 Starting training job...")
        
        # Fal.ai expects images_data_url as a string URL to zip archive
        payload = {
            "images_data_url": zip_url,  # Public URL to zip file
            "trigger_word": TRIGGER_WORD,
            "steps": TRAINING_STEPS,
            "create_masks": True,  # Use segmentation masks for better training
        }
        
        headers = {
            "Authorization": f"Key {api_key}",
            "Content-Type": "application/json",
        }
        
        # Use Fal.ai's queue API for async training (recommended for long-running jobs)
        # Docs: https://fal.ai/models/fal-ai/flux-lora-fast-training/api
        queue_endpoint = "https://queue.fal.run/fal-ai/flux-lora-fast-training"
        
        print("   ⏳ Submitting training job to queue...")
        queue_response = requests.post(
            queue_endpoint,
            json={"input": payload},  # Queue API wraps input in "input" field
            headers=headers,
            timeout=30
        )
        
        if not queue_response.ok:
            error_text = queue_response.text
            print(f"❌ Fal.ai queue error: {queue_response.status_code}")
            print(f"   {error_text}")
            exit(1)
        
        queue_result = queue_response.json()
        request_id = queue_result.get("request_id") or queue_result.get("id")
        
        if not request_id:
            print(f"❌ No request ID returned: {queue_result}")
            exit(1)
        
        print(f"   🔄 Training job started: {request_id}")
        print("   ⏳ Polling for completion (this may take 2-5 minutes)...\n")
        
        # Poll for completion using queue status endpoint
        status_endpoint = f"https://queue.fal.run/fal-ai/flux-lora-fast-training/requests/{request_id}/status"
        result_endpoint = f"https://queue.fal.run/fal-ai/flux-lora-fast-training/requests/{request_id}"
        
        max_wait = 600  # 10 minutes max
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            time.sleep(5)  # Poll every 5 seconds
            status_response = requests.get(status_endpoint, headers=headers, timeout=30)
            
            if status_response.ok:
                status_data = status_response.json()
                status_type = status_data.get("status", "unknown")
                
                if status_type == "COMPLETED":
                    # Get the result
                    result_response = requests.get(result_endpoint, headers=headers, timeout=30)
                    if result_response.ok:
                        result_data = result_response.json()
                        result = result_data.get("data") or result_data
                        print("   ✅ Training completed!\n")
                        break
                elif status_type == "FAILED":
                    error_msg = status_data.get("error") or status_data.get("message", "Unknown error")
                    print(f"   ❌ Training failed: {error_msg}")
                    exit(1)
                else:
                    elapsed = int(time.time() - start_time)
                    # Show logs if available
                    logs = status_data.get("logs", [])
                    if logs:
                        latest_log = logs[-1].get("message", "") if isinstance(logs[-1], dict) else str(logs[-1])
                        print(f"   ⏳ Still training... ({elapsed}s) - {latest_log[:60]}", end="\r")
                    else:
                        print(f"   ⏳ Still training... ({elapsed}s elapsed)", end="\r")
            else:
                print(f"\n   ⚠️  Polling error: {status_response.status_code}")
        
        if time.time() - start_time >= max_wait:
            print(f"\n   ⚠️  Training is taking longer than expected.")
            print(f"   Check status manually: {status_endpoint}")
            exit(1)
        
        print("\n✨ Training Complete!\n")
        print("📋 Results:")
        
        # According to Fal.ai docs, output contains:
        # - diffusers_lora_file: URL to trained LoRA weights
        # - config_file: URL to training config
        # - debug_preprocessed_output: (optional) preprocessed images
        
        lora_url = None
        if isinstance(result, dict):
            # Check for diffusers_lora_file (the main output)
            if "diffusers_lora_file" in result:
                lora_file = result["diffusers_lora_file"]
                if isinstance(lora_file, dict):
                    lora_url = lora_file.get("url")
                elif isinstance(lora_file, str):
                    lora_url = lora_file
            
            # Fallback to other possible fields
            if not lora_url:
                lora_url = (result.get("lora_url") or 
                           result.get("url") or 
                           result.get("lora_weights_url") or
                           result.get("output", {}).get("diffusers_lora_file", {}).get("url") if isinstance(result.get("output"), dict) else None)
        
        if lora_url:
            print(f"   LoRA Weights URL: {lora_url}")
            if "config_file" in result:
                config_file = result["config_file"]
                if isinstance(config_file, dict):
                    print(f"   Config File URL: {config_file.get('url', 'N/A')}")
        else:
            print(f"   Full response: {result}")
            print("\n   ⚠️  Could not find LoRA URL in response.")
            print("   Check the response structure above.")
            lora_url = "CHECK_RESPONSE_ABOVE"
        
        print(f"   Trigger Word: {TRIGGER_WORD}\n")
        
        print("🔧 Next Steps:")
        print("   1. Add to your .env.local:")
        print(f"      MARSHALL_LORA_URL={lora_url}")
        print(f"      MARSHALL_LORA_TRIGGER_WORD={TRIGGER_WORD}")
        print("   2. Start generating images with consistent Marshall face! 🎉\n")

    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        print("\n💡 Tips:")
        print("   - Check your Fal.ai account has credits")
        print("   - Verify the zip file is valid")
        print("   - Check Fal.ai API status")
        exit(1)

if __name__ == "__main__":
    main()
