import os
import replicate
import requests
import time
from datetime import datetime

# ==============================================================================
# CONFIGURATION
# ==============================================================================
if not os.environ.get("REPLICATE_API_TOKEN"):
    print("❌ Error: REPLICATE_API_TOKEN environment variable not set.")
    exit(1)

# We use a specific Flux model that supports "PuLID" (Pure Lightning ID) for face consistency
# This model allows us to pass a "main_face_image" to lock the identity.
MODEL_VERSION = "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b"

BASE_IDENTITY_PATH = "../public/assets/base_identity.png"
OUTPUT_DIR = "../public/consistency_test"

# ==============================================================================
# THE CONSISTENCY STRESS TEST
# ==============================================================================
# We put him in scenarios that usually break face consistency (different lighting, angles).
scenarios = [
    {
        "name": "consistency_gym",
        "prompt": "A candid photo of a man in a high-end gym, lifting weights. He is sweating, wearing a black tank top. Mirror reflection visible. The lighting is harsh fluorescent. He looks exhausted but focused. Photorealistic, iPhone style. --ar 4:5"
    },
    {
        "name": "consistency_tuxedo",
        "prompt": "A paparazzi shot of a man walking the red carpet at a gala in Monte Carlo. He is wearing a black tuxedo with a bowtie. Camera flashes going off. He is smiling and waving. Night time. High glamour. --ar 4:5"
    },
    {
        "name": "consistency_snow",
        "prompt": "A close-up selfie of a man on a ski lift in the Swiss Alps. He is wearing a white ski jacket and goggles (pulled up on forehead). Snow covered mountains in background. Bright sunlight, blue sky. Cold breath visible. --ar 4:5"
    }
]

# ==============================================================================
# GENERATOR
# ==============================================================================
def generate_consistent_image(prompt, filename_prefix, face_image_url):
    print(f"🧬 Cloning Marshall into: {filename_prefix}...")
    
    try:
        output = replicate.run(
            MODEL_VERSION,
            input={
                "prompt": prompt,
                "main_face_image": face_image_url,
                "num_steps": 20,
                "guidance_scale": 4,
                "start_step": 0,    # Apply face ID from the very beginning
                "id_weight": 1.0,   # Maximum strength for face copying
                "width": 896,
                "height": 1152      # Approx 4:5 aspect ratio
            }
        )
        
        # Download and Save
        # Note: Output might be a single URL or list depending on model version
        image_url = output[0] if isinstance(output, list) else output
        
        response = requests.get(image_url)
        timestamp = datetime.now().strftime("%H%M%S")
        filepath = os.path.join(OUTPUT_DIR, f"{filename_prefix}_{timestamp}.png")
        
        with open(filepath, "wb") as f:
            f.write(response.content)
            
        print(f"✅ Saved to: {filepath}")
        
    except Exception as e:
        print(f"❌ Failed to generate {filename_prefix}: {e}")

# ==============================================================================
# MAIN
# ==============================================================================
def main():
    print(f"🧪 Starting Identity Consistency Test...")
    
    # 1. Upload the local base image to Replicate (or use a file handle if supported)
    # The replicate python client handles local file paths automatically if we open them!
    
    if not os.path.exists(BASE_IDENTITY_PATH):
        print(f"❌ Error: Base identity image not found at {BASE_IDENTITY_PATH}")
        return

    # Create output dir
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print(f"📂 Using Face Reference: {BASE_IDENTITY_PATH}")
    
    with open(BASE_IDENTITY_PATH, "rb") as face_file:
        # We need to read the file for each request, or Replicate client handles it.
        # Ideally, we upload once, but for simplicity in this script, we pass the file object.
        # Replicate's client is smart enough to upload it.
        
        for scenario in scenarios:
            # We must re-open the file or seek(0) for each request if we reuse the handle
            face_file.seek(0) 
            generate_consistent_image(scenario["prompt"], scenario["name"], face_file)
            print("⏳ Sleeping for 15s to avoid rate limits...")
            time.sleep(15)

    print("\n✨ Consistency Test Complete! Check 'marshall/consistency_test'.")

if __name__ == "__main__":
    main()
