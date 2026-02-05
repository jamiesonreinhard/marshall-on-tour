import os
import replicate
import requests
import time
from datetime import datetime

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load .env from project root (one level up from scripts/)
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        # Try .env as fallback
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed, skip .env loading
    pass

# Check for API token
if not os.environ.get("REPLICATE_API_TOKEN"):
    print("❌ Error: REPLICATE_API_TOKEN environment variable not set.")
    print("   Options:")
    print("   1. Set it in your shell: export REPLICATE_API_TOKEN=r8_...")
    print("   2. Add it to .env.local file in the project root")
    print("   3. Install python-dotenv: pip install python-dotenv")
    exit(1)

# We use a specific Flux model that supports "PuLID" (Pure Lightning ID) for face consistency
# This model allows us to pass a "main_face_image" to lock the identity.
MODEL_VERSION = "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b"

# Get the script directory and resolve paths relative to project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BASE_IDENTITY_PATH = os.path.join(PROJECT_ROOT, "public", "assets", "base_identity.png")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "consistency_test")

# Debug: Print paths to help troubleshoot
print(f"📂 Script directory: {SCRIPT_DIR}")
print(f"📂 Project root: {PROJECT_ROOT}")
print(f"📂 Base identity path: {BASE_IDENTITY_PATH}")
print(f"📂 Output directory: {OUTPUT_DIR}")

# ==============================================================================
# THE CONSISTENCY STRESS TEST
# ==============================================================================
# Portrait images for LoRA training - various angles, lighting, and settings
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
    },
    # Additional portrait scenarios for LoRA training
    {
        "name": "portrait_professional",
        "prompt": "Professional headshot portrait of a man, three-quarter view, looking directly at camera. Clean background, studio lighting, confident expression. Business casual attire. High quality portrait photography. --ar 4:5"
    },
    {
        "name": "portrait_casual",
        "prompt": "Casual portrait of a man sitting at a coffee shop, looking at camera with a relaxed smile. Natural window lighting, warm atmosphere. Wearing a casual button-down shirt. Lifestyle photography. --ar 4:5"
    },
    {
        "name": "portrait_outdoor",
        "prompt": "Outdoor portrait of a man in natural daylight, standing in front of a city street. Looking directly at camera, natural expression. Golden hour lighting, shallow depth of field. Street photography style. --ar 4:5"
    },
    {
        "name": "portrait_indoor",
        "prompt": "Indoor portrait of a man in a modern apartment, soft natural lighting from windows. Looking at camera, three-quarter angle. Casual clothing, relaxed pose. Interior photography. --ar 4:5"
    },
    {
        "name": "portrait_side",
        "prompt": "Side profile portrait of a man, looking to the side, strong jawline visible. Professional lighting, dramatic shadows. Clean background. Portrait photography, high contrast. --ar 4:5"
    },
    {
        "name": "portrait_closeup",
        "prompt": "Close-up portrait of a man, face filling the frame, looking directly at camera. Sharp focus on eyes, natural skin texture visible. Soft lighting, professional portrait style. --ar 4:5"
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
