'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MarshallState {
  id?: string;
  current_racket?: string;
  current_racket_affiliate_link?: string;
  current_shoes?: string;
  current_shoes_affiliate_link?: string;
  current_city?: string;
  current_country?: string;
  current_hotel?: string;
  current_hotel_affiliate_link?: string;
  current_coffee_shop?: string;
  next_city?: string;
  next_country?: string;
  favorite_players?: string[];
  up_and_coming_player_watching?: string;
  favorite_tournaments?: string[];
  current_interests?: string[];
  notes?: string;
}

export default function MarshallStatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<MarshallState | null>(null);
  const [formData, setFormData] = useState<MarshallState>({
    current_racket: '',
    current_racket_affiliate_link: '',
    current_shoes: '',
    current_shoes_affiliate_link: '',
    current_city: '',
    current_country: '',
    current_hotel: '',
    current_hotel_affiliate_link: '',
    current_coffee_shop: '',
    next_city: '',
    next_country: '',
    favorite_players: [],
    up_and_coming_player_watching: '',
    favorite_tournaments: [],
    current_interests: [],
    notes: '',
  });

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const response = await fetch('/api/marshall-state');
      const data = await response.json();
      
      if (data.state) {
        setState(data.state);
        setFormData({
          current_racket: data.state.current_racket || '',
          current_racket_affiliate_link: data.state.current_racket_affiliate_link || '',
          current_shoes: data.state.current_shoes || '',
          current_shoes_affiliate_link: data.state.current_shoes_affiliate_link || '',
          current_city: data.state.current_city || '',
          current_country: data.state.current_country || '',
          current_hotel: data.state.current_hotel || '',
          current_hotel_affiliate_link: data.state.current_hotel_affiliate_link || '',
          current_coffee_shop: data.state.current_coffee_shop || '',
          next_city: data.state.next_city || '',
          next_country: data.state.next_country || '',
          favorite_players: data.state.favorite_players || [],
          up_and_coming_player_watching: data.state.up_and_coming_player_watching || '',
          favorite_tournaments: data.state.favorite_tournaments || [],
          current_interests: data.state.current_interests || [],
          notes: data.state.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to load Marshall state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/marshall-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          favorite_players: formData.favorite_players?.filter(p => p.trim()) || [],
          favorite_tournaments: formData.favorite_tournaments?.filter(t => t.trim()) || [],
          current_interests: formData.current_interests?.filter(i => i.trim()) || [],
        }),
      });

      if (response.ok) {
        alert('Marshall\'s state updated successfully!');
        loadState();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save state:', error);
      alert('Failed to save state');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading Marshall's state...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Marshall's State</h1>
            <p className="text-lg text-gray-600">
              Manage Marshall's current gear, location, and preferences for authentic content generation
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Location updates automatically when tournaments start/end. Other fields can be updated manually.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="space-y-8">
            {/* Current Gear */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Gear</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Racket
                  </label>
                  <input
                    type="text"
                    value={formData.current_racket}
                    onChange={(e) => setFormData({ ...formData, current_racket: e.target.value })}
                    placeholder="e.g., Wilson Blade 98"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Racket Affiliate Link
                  </label>
                  <input
                    type="text"
                    value={formData.current_racket_affiliate_link}
                    onChange={(e) => setFormData({ ...formData, current_racket_affiliate_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Shoes
                  </label>
                  <input
                    type="text"
                    value={formData.current_shoes}
                    onChange={(e) => setFormData({ ...formData, current_shoes: e.target.value })}
                    placeholder="e.g., Nike Court Vapor"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shoes Affiliate Link
                  </label>
                  <input
                    type="text"
                    value={formData.current_shoes_affiliate_link}
                    onChange={(e) => setFormData({ ...formData, current_shoes_affiliate_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Current Location */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Location</h2>
              <p className="text-sm text-gray-500 mb-4">
                Auto-updated when tournaments start. You can override manually if needed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current City
                  </label>
                  <input
                    type="text"
                    value={formData.current_city}
                    onChange={(e) => setFormData({ ...formData, current_city: e.target.value })}
                    placeholder="e.g., Melbourne"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Country
                  </label>
                  <input
                    type="text"
                    value={formData.current_country}
                    onChange={(e) => setFormData({ ...formData, current_country: e.target.value })}
                    placeholder="e.g., Australia"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Hotel
                  </label>
                  <input
                    type="text"
                    value={formData.current_hotel}
                    onChange={(e) => setFormData({ ...formData, current_hotel: e.target.value })}
                    placeholder="e.g., The Langham Melbourne"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Affiliate Link
                  </label>
                  <input
                    type="text"
                    value={formData.current_hotel_affiliate_link}
                    onChange={(e) => setFormData({ ...formData, current_hotel_affiliate_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Coffee Shop
                  </label>
                  <input
                    type="text"
                    value={formData.current_coffee_shop}
                    onChange={(e) => setFormData({ ...formData, current_coffee_shop: e.target.value })}
                    placeholder="e.g., Proud Mary"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Next Location */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Location</h2>
              <p className="text-sm text-gray-500 mb-4">
                Auto-updated when tournaments end. You can override manually if needed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next City
                  </label>
                  <input
                    type="text"
                    value={formData.next_city}
                    onChange={(e) => setFormData({ ...formData, next_city: e.target.value })}
                    placeholder="e.g., Indian Wells"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Country
                  </label>
                  <input
                    type="text"
                    value={formData.next_country}
                    onChange={(e) => setFormData({ ...formData, next_country: e.target.value })}
                    placeholder="e.g., USA"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Preferences & Interests</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Up-and-Coming Player Watching
                  </label>
                  <input
                    type="text"
                    value={formData.up_and_coming_player_watching}
                    onChange={(e) => setFormData({ ...formData, up_and_coming_player_watching: e.target.value })}
                    placeholder="e.g., Luca Van Assche"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This player will be featured in content opportunities
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite Players (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.favorite_players?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      favorite_players: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                    })}
                    placeholder="e.g., Alcaraz, Sinner, Djokovic"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite Tournaments (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.favorite_tournaments?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      favorite_tournaments: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    })}
                    placeholder="e.g., Wimbledon, Indian Wells, Roland-Garros"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.current_interests?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      current_interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                    })}
                    placeholder="e.g., clay court season, racket technology"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Any additional context about Marshall's current state..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
