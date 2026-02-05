"""
Train LoRA Model for Marshall

This script trains a LoRA model using Replicate's Flux fast finetune.

Prerequisites:
1. Run prepare-lora-training.py first to create the zip file
2. Set REPLICATE_API_TOKEN environment variable

Run with: python scripts/train-lora.py
"""

import os
import replicate
import zipfile
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ZIP_PATH = PROJECT_ROOT / "scripts" / "temp" / "marshall-training-images.zip"
MODEL_NAME = "marshall-lora"
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
    print("🚀 Starting LoRA Training for Marshall\n")
    
    # Check for API token
    api_token = os.environ.get("REPLICATE_API_TOKEN")
    if not api_token:
        print("❌ Error: REPLICATE_API_TOKEN environment variable not set.")
        print("   Set it in your .env.local file or export it in your shell.")
        exit(1)

    # Check if zip file exists
    if not ZIP_PATH.exists():
        print(f"❌ Error: Zip file not found at {ZIP_PATH}")
        print("   Run: python scripts/prepare-lora-training.py first")
        exit(1)

    print("📋 Configuration:")
    print(f"   Model name: {MODEL_NAME}")
    print(f"   Trigger word: {TRIGGER_WORD}")
    print(f"   Training steps: {TRAINING_STEPS}")
    print(f"   Zip file: {ZIP_PATH}\n")

    # Initialize Replicate client
    client = replicate.Client(api_token)
    
    # Get username - try API first, fallback to hardcoded
    username = "jamiesonreinhard2"  # Your Replicate username
    try:
        # Try to get username from API
        import requests
        response = requests.get(
            "https://api.replicate.com/v1/account",
            headers={"Authorization": f"Token {api_token}"}
        )
        if response.ok:
            account_data = response.json()
            username = account_data.get("username", username)
            print(f"✅ Found username: {username}")
    except Exception as e:
        print(f"⚠️  Using hardcoded username: {username}")

    full_model_name = f"{username}/{MODEL_NAME}"
    print(f"📦 Model will be: {full_model_name}\n")

    # Replicate's Flux fast finetune model
    # Try different possible model names/versions
    trainer_models = [
        "black-forest-labs/flux-fast-finetune",
        "black-forest-labs/flux-fast-finetune:latest",
        "black-forest-labs/flux-fast-finetune:main",
    ]
    
    print("📤 Uploading training images and starting training...")
    print("   This may take 1-2 minutes...\n")

    # First, we need to upload the file to Replicate's storage
    # Replicate's Python client can handle this, but we need to use the file path string
    # or upload it first via their API
    
    try:
        # Method 1: Try passing file path as string (Replicate handles upload)
        zip_file_path = str(ZIP_PATH)
        
        # Try each model name until one works
        output = None
        last_error = None
        
        for trainer_model in trainer_models:
            try:
                print(f"   Trying model: {trainer_model}...")
                # Replicate's Python client accepts file paths as strings
                # It will automatically upload them
                output = client.run(
                    trainer_model,
                    input={
                        "input_images": zip_file_path,  # File path - Replicate uploads it
                        "trigger_word": TRIGGER_WORD,
                        "steps": TRAINING_STEPS,
                    }
                )
                print(f"   ✅ Success with model: {trainer_model}\n")
                break
            except Exception as e:
                last_error = e
                if "404" in str(e) or "not found" in str(e).lower():
                    print(f"   ❌ Model not found: {trainer_model}")
                    continue
                else:
                    # Different error, might be file upload issue
                    raise
        
        if output is None:
            raise Exception(f"All model names failed. Last error: {last_error}")

        print("\n✨ Training Complete!\n")
        print("📋 Results:")
        
        # Handle different output formats
        if isinstance(output, str):
            lora_url = output
            print(f"   LoRA Weights URL: {lora_url}")
        elif isinstance(output, list) and len(output) > 0:
            lora_url = output[0] if isinstance(output[0], str) else output[0].get("url", str(output[0]))
            print(f"   LoRA Weights URL: {lora_url}")
        elif isinstance(output, dict):
            lora_url = output.get("lora_weights_url") or output.get("lora_url") or output.get("url")
            print(f"   LoRA Weights URL: {lora_url}")
            if "model_version" in output:
                print(f"   Model Version: {output['model_version']}")
        else:
            print(f"   Output: {output}")
            lora_url = str(output)

        print(f"   Trigger Word: {TRIGGER_WORD}\n")
        
        print("🔧 Next Steps:")
        print("   1. Add to your .env.local:")
        print(f"      MARSHALL_LORA_URL={lora_url}")
        print(f"      MARSHALL_LORA_TRIGGER_WORD={TRIGGER_WORD}")
        print("   2. Set FAL_API_KEY (or use Replicate for inference)")
        print("   3. Start generating images with consistent Marshall face! 🎉\n")

    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Training failed: {error_msg}")
        
        if "404" in error_msg or "not found" in error_msg.lower():
            print("\n💡 The model might not exist or the name is incorrect.")
            print("   Try checking Replicate's model explorer:")
            print("   https://replicate.com/explore")
            print("\n   Search for 'flux finetune' or 'flux lora training'")
            print("   The correct model might be:")
            print("   - A different organization/user name")
            print("   - A specific version hash needed")
            print("   - Or you might need to use Fal.ai instead (you have credits there)")
        else:
            print("\n💡 Tips:")
            print("   - Check your Replicate account has credits")
            print("   - Verify the zip file is valid")
            print("   - Check Replicate API status")
            print("   - The file might need to be uploaded to a public URL first")
        
        print("\n🔍 Debug info:")
        print(f"   Model tried: {trainer_models}")
        print(f"   Zip file: {ZIP_PATH}")
        print(f"   Zip exists: {ZIP_PATH.exists()}")
        if ZIP_PATH.exists():
            size_mb = ZIP_PATH.stat().st_size / 1024 / 1024
            print(f"   Zip size: {size_mb:.2f} MB")
        
        exit(1)

if __name__ == "__main__":
    main()
