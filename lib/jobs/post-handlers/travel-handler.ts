/**
 * Travel Post Handler
 * 
 * Handles: tournament previews, travel guides, city guides
 * Gathers: tournament data, weather, hotels, restaurants, coffee shops, walking routes
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { createAdminSupabase } from '@/lib/supabase/server';
import { getMarshallState } from '@/lib/marshall/state';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { getTournamentWeather } from '@/lib/data/integrations/weather';
import { findPlacesNearby, geocodeLocation } from '@/lib/data/integrations/google-maps';
import { getPlayerRankings } from '@/lib/data/integrations/player-data';
import {
  getTournamentScheduleForPreview,
  getTournamentCupTrees,
  parseCupTreesForPreview,
  getTournamentApiIds,
} from '@/lib/data/integrations/freewebapi';

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

    // 2. Top players (for small mentions: "top seeds", "world number 2", etc.)
    const rankingsResult = await getPlayerRankings();
    if (rankingsResult.success && rankingsResult.data) {
      richData.rankings = rankingsResult.data.slice(0, 15);
      dataSources.push('Rankings: Top 15 (for player mentions)');
    }

    // 3. Get tournament data
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

        // Tournament preview: who's playing and draw (prefer cup-trees when we have API IDs, else EventSchedules)
        const isPreview = opportunity.topic.toLowerCase().includes('preview');
        if (isPreview && tournamentData.start_date) {
          const apiIds = getTournamentApiIds(tournamentData.name);
          if (apiIds) {
            const cupResult = await getTournamentCupTrees(apiIds.tournamentId, apiIds.seasonId, {
              enabled: true,
              fallbackToMock: false,
            });
            if (cupResult.success && cupResult.data) {
              const { playersInDraw: cupPlayers, matchups: cupMatchups } = parseCupTreesForPreview(cupResult.data);
              if (cupPlayers.length > 0 || cupMatchups.length > 0) {
                richData.playersInDraw = cupPlayers;
                richData.cupTreeMatchups = cupMatchups;
                if (cupPlayers.length > 0) dataSources.push(`Players in draw: ${cupPlayers.length} (FreeWebAPI cup-trees)`);
                if (cupMatchups.length > 0) dataSources.push(`Draw matchups: ${cupMatchups.length} (FreeWebAPI cup-trees)`);
              }
            }
          }
          if (!richData.playersInDraw?.length) {
            const scheduleResult = await getTournamentScheduleForPreview(
              tournamentData.name,
              tournamentData.start_date,
              { enabled: true, fallbackToMock: false }
            );
            if (scheduleResult.success && scheduleResult.data) {
              richData.tournamentSchedule = scheduleResult.data.matches;
              richData.playersInDraw = scheduleResult.data.playersInDraw;
              if (scheduleResult.data.matches.length > 0) {
                dataSources.push(`Tournament schedule: ${scheduleResult.data.matches.length} matches (FreeWebAPI EventSchedules)`);
              }
              if (scheduleResult.data.playersInDraw.length > 0) {
                dataSources.push(`Players in draw: ${scheduleResult.data.playersInDraw.length} (FreeWebAPI EventSchedules)`);
              }
            }
          } else if (!richData.tournamentSchedule?.length && richData.cupTreeMatchups?.length) {
            richData.tournamentSchedule = richData.cupTreeMatchups.map((m: string) => ({
              round: 'Draw',
              player1: { name: m.split(' vs ')[0]?.trim() ?? 'TBD' },
              player2: { name: m.split(' vs ')[1]?.trim() ?? 'TBD' },
            }));
          }
        }
        
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

    // Marshall's current state
    const marshallState = await getMarshallState();
    if (marshallState) {
      dataSources.push('Marshall state: current location & gear');
    }
    
    // 5. Build context for Gemini
    const context: any = {
      type: 'travel' as const,
      topic: opportunity.topic,
      tournament,
      recentPosts: recentPostsContext,
      affiliateFeatured: true, // Tournament previews and travel guides get featured "Marshall's picks" / "Where to stay" in first 400 words
    };
    if (marshallState) {
      context.marshallState = marshallState;
    }
    
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
    if (richData.rankings) {
      context.rankings = richData.rankings;
    }
    if (richData.tournamentSchedule && Array.isArray(richData.tournamentSchedule)) {
      context.tournamentSchedule = richData.tournamentSchedule;
    }
    if (richData.playersInDraw && Array.isArray(richData.playersInDraw)) {
      context.playersInDraw = richData.playersInDraw;
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
