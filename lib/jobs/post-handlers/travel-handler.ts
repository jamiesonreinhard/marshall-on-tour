/**
 * Travel Post Handler
 * 
 * Handles: tournament previews, travel guides, city guides
 * Gathers: tournament data, weather, hotels, restaurants, coffee shops, walking routes
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { createAdminSupabase } from '@/lib/supabase/server';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { getTournamentWeather } from '@/lib/data/integrations/weather';
import { findPlacesNearby, geocodeLocation } from '@/lib/data/integrations/google-maps';

export async function handleTravelPost(
  ctx: HandlerContext
): Promise<HandlerResult> {
  try {
    const { opportunity } = ctx;
    const richData: Record<string, any> = {};
    const dataSources: string[] = [];
    
    // 1. Get recent posts for context
    const recentPosts = await analyzeRecentPosts(5);
    const recentPostsContext = recentPosts.map((p: any) => ({
      title: p.title,
      category: p.category,
    }));
    
    // 2. Get tournament data
    let tournament;
    
    if (opportunity.metadata?.tournament_id) {
      const supabase = createAdminSupabase();
      const { data: tournamentData } = await supabase
        .from('atp_calendar')
        .select('*')
        .eq('id', opportunity.metadata.tournament_id)
        .single();
      
      if (tournamentData) {
        const location = tournamentData.location as { city?: string; country?: string };
        tournament = {
          name: tournamentData.name,
          location: location.city && location.country 
            ? `${location.city}, ${location.country}`
            : location.city || location.country || '',
          startDate: tournamentData.start_date,
        };
        dataSources.push(`Tournament: ${tournamentData.name}`);
        
        // 3. Get weather (only if we have both city and country)
        if (location.city && location.country) {
          const weatherResult = await getTournamentWeather({
            city: location.city,
            country: location.country,
          });
          if (weatherResult.success && weatherResult.data) {
            richData.weather = weatherResult.data;
            dataSources.push(`Weather: ${location.city}`);
          }
        }
        
        // 4. Geocode location for Google Maps (only if we have city)
        if (location.city) {
          const geoResult = await geocodeLocation(
            location.city, 
            location.country || ''
          );
          if (geoResult.success && geoResult.data) {
            const coords = geoResult.data;
            
            // Get hotels
            const hotelsResult = await findPlacesNearby(coords, 'hotel', 5000, 10);
            if (hotelsResult.success && hotelsResult.data) {
              richData.hotels = hotelsResult.data;
              dataSources.push(`Hotels: ${hotelsResult.data.length} found`);
            }
            
            // Get coffee shops
            const coffeeResult = await findPlacesNearby(coords, 'coffee', 2000, 5);
            if (coffeeResult.success && coffeeResult.data) {
              richData.coffeeShops = coffeeResult.data;
              dataSources.push(`Coffee: ${coffeeResult.data.length} found`);
            }
            
            // Get restaurants
            const restaurantsResult = await findPlacesNearby(coords, 'restaurant', 3000, 5);
            if (restaurantsResult.success && restaurantsResult.data) {
              richData.restaurants = restaurantsResult.data;
              dataSources.push(`Restaurants: ${restaurantsResult.data.length} found`);
            }
          }
        } else {
          console.warn('[Travel Handler] No city in location, skipping weather and places lookup');
        }
      }
    }
    
    // 5. Build context for Gemini
    const context: any = {
      type: 'travel' as const,
      topic: opportunity.topic,
      tournament,
      recentPosts: recentPostsContext,
    };
    
    // Add rich data
    if (richData.weather) {
      context.weather = richData.weather;
    }
    if (richData.hotels) {
      context.hotels = richData.hotels;
    }
    if (richData.coffeeShops) {
      context.coffeeShops = richData.coffeeShops;
    }
    if (richData.restaurants) {
      context.restaurants = richData.restaurants;
    }
    
    return {
      success: true,
      data: {
        context,
        richData,
        dataSources,
      },
    };
  } catch (error: any) {
    console.error('[Travel Handler] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
