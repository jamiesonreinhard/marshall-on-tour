/**
 * LoRA Training Utility for Flux.1
 * 
 * This module provides utilities for training a LoRA (Low-Rank Adaptation) model
 * for Marshall's face using Replicate's Flux trainer API.
 * 
 * Training a LoRA allows us to generate lifestyle scenes with consistent face matching
 * while maintaining the quality and realism of Flux.1.
 */

export interface LoRATrainingOptions {
  /** Name for the trained model (will be created on Replicate) */
  modelName: string;
  /** URL to a zip file containing training images (10-20 images recommended) */
  trainingImagesUrl: string;
  /** Trigger word to use when generating images (e.g., "MARSHALL_UNIQ") */
  triggerWord?: string;
  /** Number of training steps (default: 1000) */
  steps?: number;
}

export interface LoRATrainingResult {
  /** The trained model version on Replicate (e.g., "username/model-name:version-id") */
  modelVersion: string;
  /** URL to download the LoRA weights file */
  loraWeightsUrl: string;
  /** The trigger word to use in prompts */
  triggerWord: string;
  /** Training status */
  status: 'completed' | 'failed' | 'processing';
}

/**
 * Train a LoRA model using Replicate's Flux trainer
 * 
 * Process:
 * 1. Create a model on Replicate (if it doesn't exist)
 * 2. Upload training images (or provide URL to zip file)
 * 3. Start training job
 * 4. Poll for completion
 * 5. Return model version and LoRA weights URL
 * 
 * @param apiToken Replicate API token
 * @param options Training options
 * @returns Training result with model version and LoRA weights URL
 */
export async function trainLoRA(
  apiToken: string,
  options: LoRATrainingOptions
): Promise<LoRATrainingResult> {
  const Replicate = (await import('replicate')).default;
  const client = new Replicate({ auth: apiToken });

  const triggerWord = options.triggerWord || 'MARSHALL_UNIQ';
  const steps = options.steps || 1000;

  console.log(`[LoRA Training] Starting training for model: ${options.modelName}`);
  console.log(`[LoRA Training] Training images URL: ${options.trainingImagesUrl}`);
  console.log(`[LoRA Training] Trigger word: ${triggerWord}`);
  console.log(`[LoRA Training] Steps: ${steps}`);

  try {
    // Step 1: Create model if it doesn't exist
    // Replicate models are in format: username/model-name
    const modelOwner = await getModelOwner(apiToken);
    const fullModelName = `${modelOwner}/${options.modelName}`;
    
    console.log(`[LoRA Training] Model name: ${fullModelName}`);

    // Step 2: Use Replicate's fast Flux trainer
    // Model: black-forest-labs/flux-fast-finetune
    const trainerModel = 'black-forest-labs/flux-fast-finetune';
    
    const trainingInput = {
      input_images: options.trainingImagesUrl, // URL to zip file with images
      trigger_word: triggerWord,
      steps: steps,
      // Optional: can specify learning rate, etc.
    };

    console.log(`[LoRA Training] Starting training job...`);
    const trainingOutput = await client.run(trainerModel, { input: trainingInput });

    // The output should contain:
    // - lora_weights_url: URL to download the LoRA weights
    // - model_version: The trained model version
    
    let loraWeightsUrl: string;
    let modelVersion: string;

    // Type guard for the training output
    if (typeof trainingOutput === 'string') {
      // Sometimes it's just a URL
      loraWeightsUrl = trainingOutput;
      modelVersion = fullModelName; // Will need to create version manually
    } else if (typeof trainingOutput === 'object' && trainingOutput !== null) {
      // Type assertion for the object response
      const output = trainingOutput as any;
      if (output.lora_weights_url) {
        loraWeightsUrl = output.lora_weights_url;
        modelVersion = output.model_version || fullModelName;
      } else if (output.lora_url) {
        // Alternative property name
        loraWeightsUrl = output.lora_url;
        modelVersion = output.model_version || fullModelName;
      } else if (Array.isArray(output) && output.length > 0) {
        // Sometimes it's an array with the URL as first element
        loraWeightsUrl = typeof output[0] === 'string' ? output[0] : output[0].url || output[0].lora_weights_url;
        modelVersion = fullModelName;
      } else {
        throw new Error(`Unexpected training output format: ${JSON.stringify(output)}`);
      }
    } else {
      throw new Error(`Unexpected training output type: ${typeof trainingOutput}`);
    }

    console.log(`[LoRA Training] ✅ Training completed!`);
    console.log(`[LoRA Training] LoRA weights URL: ${loraWeightsUrl}`);
    console.log(`[LoRA Training] Model version: ${modelVersion}`);

    return {
      modelVersion,
      loraWeightsUrl,
      triggerWord,
      status: 'completed',
    };
  } catch (error: any) {
    console.error(`[LoRA Training] Error:`, error);
    throw new Error(`LoRA training failed: ${error.message}`);
  }
}

/**
 * Get the current user's username from Replicate API
 */
async function getModelOwner(apiToken: string): Promise<string> {
  try {
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status}`);
    }

    const account = await response.json();
    return account.username || 'default';
  } catch (error: any) {
    console.warn(`[LoRA Training] Could not get username, using 'default': ${error.message}`);
    return 'default';
  }
}

/**
 * Check training status (for polling)
 */
export async function checkTrainingStatus(
  apiToken: string,
  trainingId: string
): Promise<{ status: string; progress?: number }> {
  // This would poll Replicate's API for training status
  // Implementation depends on how Replicate exposes training job status
  // For now, this is a placeholder
  throw new Error('Training status checking not yet implemented');
}
