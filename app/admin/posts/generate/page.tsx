'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PostType = 'analysis' | 'gear' | 'travel' | 'lifestyle' | 'blast-from-past' | 'tournament' | 'match' | 'player' | 'news';

export default function GeneratePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'analysis' as PostType,
    topic: '',
    instructions: '',
    tournamentId: '',
    publish: false,
    includeMarshall: undefined as boolean | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          topic: formData.topic,
          manualInstructions: formData.instructions,
          tournamentId: formData.tournamentId || undefined,
          publish: formData.publish,
          includeMarshall: formData.includeMarshall,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate post');
      }

      setSuccess(`Post ${data.post.published ? 'published' : 'saved as draft'} successfully!`);
      
      // Redirect to post edit page after a short delay
      setTimeout(() => {
        router.push(`/admin/posts/${data.post.id}/edit`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Post</h1>
        <p className="text-gray-600">
          Create a new post with AI. The system will gather relevant data and generate high-quality content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Post Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Post Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as PostType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          >
            <option value="analysis">Analysis (Match, Player, Tournament Recap)</option>
            <option value="gear">Gear Guide</option>
            <option value="travel">Travel Guide (Tournament Preview)</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="blast-from-past">Nostalgia / Blast from Past</option>
            <option value="tournament">Tournament (Auto-detect)</option>
            <option value="match">Match Analysis</option>
            <option value="player">Player Profile</option>
            <option value="news">News Analysis</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.type === 'analysis' && 'Gathers player stats, match data, weather, news'}
            {formData.type === 'gear' && 'Gathers product data, specs, affiliate links'}
            {formData.type === 'travel' && 'Gathers tournament data, weather, hotels, restaurants, coffee shops'}
            {formData.type === 'lifestyle' && 'Gathers Marshall\'s state, tournament context, recent news'}
            {formData.type === 'blast-from-past' && 'Gathers historical player data, YouTube videos, achievements'}
            {(formData.type === 'tournament' || formData.type === 'match' || formData.type === 'player' || formData.type === 'news') && 'Auto-detects best data sources'}
          </p>
        </div>

        {/* Topic - Optional */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Topic / Title (Optional)
          </label>
          <input
            type="text"
            id="topic"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="Leave blank to auto-generate based on available data"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional. If blank, the system will intelligently generate a topic based on recent posts, tournaments, and available data to avoid duplicates.
          </p>
        </div>

        {/* Manual Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Instructions (Optional)
          </label>
          <textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="e.g., 'Focus on the tactical battle', 'Include weather impact', 'Mention specific year for nostalgia post'"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Provide any specific guidance for the AI. For nostalgia posts, include player name and year. The system will check recent posts to avoid duplicates.
          </p>
        </div>

        {/* Tournament ID (Optional) */}
        <div>
          <label htmlFor="tournamentId" className="block text-sm font-medium text-gray-700 mb-2">
            Tournament ID (Optional)
          </label>
          <input
            type="text"
            id="tournamentId"
            value={formData.tournamentId}
            onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
            placeholder="UUID from ATP calendar"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            If this post is about a specific tournament, provide the tournament ID for richer data.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="publish"
              checked={formData.publish}
              onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
              className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
            />
            <label htmlFor="publish" className="ml-2 block text-sm text-gray-700">
              Publish immediately (otherwise saves as draft)
            </label>
          </div>

          <div>
            <label htmlFor="includeMarshall" className="block text-sm font-medium text-gray-700 mb-2">
              Include Marshall in Image
            </label>
            <select
              id="includeMarshall"
              value={formData.includeMarshall === undefined ? 'auto' : formData.includeMarshall ? 'yes' : 'no'}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  includeMarshall: value === 'auto' ? undefined : value === 'yes',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="auto">Auto (let system decide)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Auto: Marshall appears in ~10-20% of images, usually candid shots
            </p>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Post'}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>System reviews recent posts, calendar, and RSS feeds to avoid duplicates</li>
          <li>Type-specific handler gathers comprehensive data (players, weather, videos, etc.)</li>
          <li>Data is organized into a rich prompt for Gemini</li>
          <li>Gemini generates the post content</li>
          <li>Fact-checker validates claims</li>
          <li>Editor refines while maintaining Marshall's voice</li>
          <li>Image is generated based on post type</li>
          <li>Post is saved (as draft or published)</li>
        </ol>
      </div>
    </div>
  );
}
