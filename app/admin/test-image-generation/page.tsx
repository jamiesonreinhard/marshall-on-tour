'use client';

import { useState } from 'react';
import { AdminHeader } from '@/app/admin/components/AdminHeader';

export default function TestImageGenerationPage() {
  const [scene, setScene] = useState('Marshall sitting with a charcuterie board, in the grass on a towel in front of the Eiffel Tower');
  const [postType, setPostType] = useState<'lifestyle' | 'gear' | 'travel' | 'analysis'>('lifestyle');
  const [includeMarshall, setIncludeMarshall] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    imageUrl?: string; 
    error?: string;
    scene?: string;
  } | null>(null);

  const presetScenes = [
    'Marshall sitting with a charcuterie board, in the grass on a towel in front of the Eiffel Tower',
    'Marshall walking through a European city, cobblestone streets, tennis bag over shoulder',
    'Marshall having coffee at an outdoor cafe, looking out at the street scene',
    'Marshall at a tennis tournament, observing players practice, notebook in hand',
    'Marshall at a rooftop bar overlooking a tennis venue, golden hour',
    'Marshall exploring a new city neighborhood, tennis racket visible, taking photos',
  ];

  const handleGenerate = async () => {
    if (!scene.trim()) {
      alert('Please enter a scene description');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: scene.trim(),
          postType,
          includeMarshall,
          topic: 'Test image generation',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          imageUrl: data.imageUrl,
          scene: data.scene,
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Generation failed',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to generate image',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Test Image Generation</h1>
        <p className="text-gray-600 mb-6">
          Test LoRA/Fal.ai image generation with custom scenes
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Type
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="lifestyle">Lifestyle</option>
                  <option value="travel">Travel</option>
                  <option value="gear">Gear</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>

              {/* Include Marshall */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeMarshall"
                  checked={includeMarshall}
                  onChange={(e) => setIncludeMarshall(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeMarshall" className="text-sm font-medium text-gray-700">
                  Include Marshall (uses LoRA if configured)
                </label>
              </div>

              {/* Scene Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scene Description
                </label>
                <textarea
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Describe the scene you want to generate..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Be specific about the scene, setting, and what Marshall is doing
                </p>
              </div>

              {/* Preset Scenes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preset Scenes
                </label>
                <div className="space-y-2">
                  {presetScenes.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setScene(preset)}
                      className="w-full text-left text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!scene.trim() || generating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {generating ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            
            {generating && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating image...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may take 30-60 seconds
                  </p>
                </div>
              </div>
            )}

            {result && !generating && (
              <div>
                {result.success && result.imageUrl ? (
                  <div>
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium mb-1">✅ Image Generated!</p>
                      {result.scene && (
                        <p className="text-sm text-green-700">Scene: {result.scene}</p>
                      )}
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={result.imageUrl}
                        alt="Generated image"
                        className="w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/base_identity.png';
                        }}
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Image URL:</p>
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded block break-all">
                        {result.imageUrl}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium mb-2">❌ Generation Failed</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                )}
              </div>
            )}

            {!result && !generating && (
              <div className="text-center py-12 text-gray-400">
                <p>No image generated yet</p>
                <p className="text-sm mt-2">Enter a scene and click Generate</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>If <code className="bg-blue-100 px-1 rounded">MARSHALL_LORA_URL</code> is set, it will use Fal.ai with LoRA</li>
            <li>Otherwise, it falls back to Replicate (flux-pulid) or Gemini (Nano Banana)</li>
            <li>The system automatically selects the best provider based on your configuration</li>
            <li>LoRA provides the best face consistency for lifestyle scenes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
