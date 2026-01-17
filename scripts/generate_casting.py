import os
import replicate
import requests
import time
from datetime import datetime

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# Ensure you have your API token set: export REPLICATE_API_TOKEN=r8_...
if not os.environ.get("REPLICATE_API_TOKEN"):
    print("❌ Error: REPLICATE_API_TOKEN environment variable not set.")
    print("   Run: export REPLICATE_API_TOKEN=<your_token_here>")
    exit(1)

OUTPUT_DIR = "../public/casting"
MODEL_VERSION = "black-forest-labs/flux-dev" # The current King of Realism

# ==============================================================================
# THE SCENARIOS (Casting Call)
# ==============================================================================
# We generate 3 distinct vibes to see which "Face" works best across contexts.
scenarios = [
    {
        "name": "portrait_cafe",
        "prompt": "A hyper-realistic, candid iPhone photo of a handsome 33-year-old man sitting at a cafe table in Monte Carlo. He has an ambiguous European appearance, olive skin, dark hair, light stubble. He is wearing a navy blue linen shirt with the top button open and expensive sunglasses. He is looking away from the camera, holding an espresso. Soft natural lighting, sunny day. In the background, out of focus, are clay tennis courts. The vibe is 'quiet luxury' and 'old money.' Shot on iPhone 15 Pro, unpolished, authentic social media aesthetic. --ar 4:5"
    },
    {
        "name": "action_court",
        "prompt": "A medium shot of a handsome 32-year-old tennis analyst standing courtside at a professional tournament. He is wearing a vintage white Fila track jacket and holding a tennis racquet. He has a serious, knowledgeable expression. Background is a blurred stadium crowd. The lighting is harsh midday sun. He looks like a mix of Roger Federer and a male model. High definition, photorealistic, 8k. --ar 4:5"
    },
    {
        "name": "luxury_travel",
        "prompt": "A selfie taken by a handsome 34-year-old man in a first-class airplane seat. He is winking at the camera, holding a glass of champagne. He wears a cashmere beige hoodie. The lighting is dim cabin lighting. He looks tired but happy. Authentic, slightly grainy, social media story style. --ar 9:16"
    }
]

# ==============================================================================
# GENERATOR FUNCTION
# ==============================================================================
def generate_image(prompt, filename_prefix):
    print(f"🎨 Generating: {filename_prefix}...")
    
    try:
        output = replicate.run(
            MODEL_VERSION,
            input={
                "prompt": prompt,
                "go_fast": True,
                "guidance": 3.5,   # Lower guidance = more photorealistic/less "fried"
                "megapixels": "1",
                "num_outputs": 1,
                "aspect_ratio": "4:5",
                "output_format": "png",
                "output_quality": 90
            }
        )
        
        # Flux returns a list with the image URL
        image_url = output[0]
        
        # Download and Save
        response = requests.get(image_url)
        timestamp = datetime.now().strftime("%H%M%S")
        filepath = os.path.join(OUTPUT_DIR, f"{filename_prefix}_{timestamp}.png")
        
        with open(filepath, "wb") as f:
            f.write(response.content)
            
        print(f"✅ Saved to: {filepath}")
        
    except Exception as e:
        print(f"❌ Failed to generate {filename_prefix}: {e}")

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
def main():
    print(f"🎬 Starting Casting Call for 'Marshall'...")
    print(f"📂 Output Directory: {OUTPUT_DIR}")
    
    for scenario in scenarios:
        # Generate 2 variations for each scenario to give you options
        for i in range(2):
            generate_image(scenario["prompt"], f"{scenario['name']}_v{i+1}")

    print("\n✨ Casting Call Complete! Check the 'marshall/casting' folder.")

if __name__ == "__main__":
    main()
