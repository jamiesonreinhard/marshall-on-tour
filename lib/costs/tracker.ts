/**
 * API Cost Tracking
 * 
 * Tracks costs for all API calls to monitor spending
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface CostEntry {
  service: 'gemini' | 'google-maps' | 'youtube' | 'open-meteo' | 'rss' | 'other';
  endpoint: string;
  cost_usd: number;
  input_tokens?: number;
  output_tokens?: number;
  request_count?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an API cost
 */
export async function logCost(entry: CostEntry): Promise<void> {
  try {
    const supabase = createAdminSupabase();
    
    await supabase.from('api_costs').insert({
      service: entry.service,
      endpoint: entry.endpoint,
      cost_usd: entry.cost_usd,
      input_tokens: entry.input_tokens || null,
      output_tokens: entry.output_tokens || null,
      request_count: entry.request_count || 1,
      metadata: entry.metadata || null,
    });
  } catch (error) {
    // Don't fail the request if cost tracking fails
    console.error('Failed to log API cost:', error);
  }
}

/**
 * Calculate Gemini cost based on tokens
 * Pricing (as of 2026):
 * - Input: $0.0001 per 1K tokens
 * - Output: $0.0004 per 1K tokens
 */
export function calculateGeminiCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * 0.0001;
  const outputCost = (outputTokens / 1000) * 0.0004;
  return inputCost + outputCost;
}

/**
 * Calculate Google Maps cost
 * Pricing (as of 2026):
 * - Nearby Search: $0.017 per request
 * - Directions: $0.005 per request
 * - Geocoding: $0.005 per request
 */
export function calculateGoogleMapsCost(endpoint: string, requestCount: number = 1): number {
  const pricing: Record<string, number> = {
    'nearbysearch': 0.017,
    'directions': 0.005,
    'geocode': 0.005,
    'place/details': 0.017,
  };
  
  const costPerRequest = pricing[endpoint] || 0.01; // Default fallback
  return costPerRequest * requestCount;
}

/**
 * Calculate YouTube cost
 * Pricing: Free tier (10,000 units/day), then $0.01 per 10,000 units
 * Each search = 100 units, so effectively free for low usage
 */
export function calculateYouTubeCost(requestCount: number = 1): number {
  // Assuming we're within free tier for now
  // Each search = 100 units, so 100 searches/day = free
  // For tracking, we'll log as $0.0001 per request (essentially free)
  return requestCount * 0.0001;
}

/**
 * Get weekly costs summary
 */
export async function getWeeklyCosts(weekStart?: Date): Promise<{
  service: string;
  total_cost: number;
  request_count: number;
  avg_cost_per_request: number;
}[]> {
  const supabase = createAdminSupabase();
  
  const startDate = weekStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data, error } = await supabase.rpc('get_weekly_costs', {
    week_start: startDate.toISOString().split('T')[0],
  });
  
  if (error) {
    console.error('Error fetching weekly costs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get daily costs for the last N days
 */
export async function getDailyCosts(daysBack: number = 7): Promise<{
  date: string;
  service: string;
  total_cost: number;
  request_count: number;
}[]> {
  const supabase = createAdminSupabase();
  
  const { data, error } = await supabase.rpc('get_daily_costs', {
    days_back: daysBack,
  });
  
  if (error) {
    console.error('Error fetching daily costs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get total cost for current week
 */
export async function getCurrentWeekTotal(): Promise<number> {
  const costs = await getWeeklyCosts();
  return costs.reduce((sum, item) => sum + Number(item.total_cost), 0);
}
