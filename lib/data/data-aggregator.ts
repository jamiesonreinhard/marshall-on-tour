/**
 * Data Aggregator
 * 
 * Unified interface for all data sources
 * Aggregates data from all integrations and provides clean interface for Gemini
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { fetchTennisNews, getRecentNews } from './integrations/rss';
import { getTournamentWeather } from './integrations/weather';
import { findPlacesNearby, geocodeLocation, getWalkingRoute } from './integrations/google-maps';
import { findMatchHighlights, findClassicMatches } from './integrations/youtube';
import { getPlayerRankings, getPlayerProfile, getHeadToHead } from './integrations/player-data';
import { getTournamentMatches, getTodaysMatches, isBigMatch } from './integrations/sportradar-matches';
import { getGearItems, getGearItem } from './integrations/gear';
import { getATPTournaments, getCurrentTournaments, getUpcomingTournaments } from './sportradar';
import { getMarshallState } from '@/lib/marshall/state';
import type { 
  NewsItem, 
  WeatherData, 
  LocationPlace, 
  WalkingRoute, 
  YouTubeVideo, 
  Player, 
  Match, 
  GearItem 
} from './integrations/types';

export interface AggregatedData {
  // Tournament data
  activeTournaments: Awaited<ReturnType<typeof getATPTournaments>>;
  upcomingTournaments: Awaited<ReturnType<typeof getUpcomingTournaments>>;
  
  // Match data
  todaysMatches?: Match[];
  bigMatches?: Match[];
  
  // News
  recentNews?: NewsItem[];
  
  // Player data
  topPlayers?: Player[];
  
  // Marshall's state
  marshallState?: Awaited<ReturnType<typeof getMarshallState>>;
  
  // Tournament-specific data (when tournament is active)
  tournamentData?: {
    weather?: WeatherData;
    hotels?: LocationPlace[];
    coffeeShops?: LocationPlace[];
    restaurants?: LocationPlace[];
    walkingRoutes?: WalkingRoute[];
  };
}

/**
 * Get all data needed for content generation
 */
export async function aggregateDataForContent(
  tournamentId?: string
): Promise<AggregatedData> {
  const data: AggregatedData = {
    activeTournaments: [],
    upcomingTournaments: [],
  };
  
  try {
    // 1. Tournament data
    data.activeTournaments = await getCurrentTournaments();
    data.upcomingTournaments = await getUpcomingTournaments();
    
    // 2. Match data (if tournament specified)
    if (tournamentId) {
      const matchesResult = await getTournamentMatches(tournamentId);
      if (matchesResult.success && matchesResult.data) {
        const allMatches = matchesResult.data;
        data.todaysMatches = allMatches.filter(m => {
          const matchDate = new Date(m.scheduled_time).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          return matchDate === today;
        });
        data.bigMatches = allMatches.filter(isBigMatch);
      }
    } else {
      // Get today's matches from all active tournaments
      const todaysMatchesResult = await getTodaysMatches();
      if (todaysMatchesResult.success && todaysMatchesResult.data) {
        data.todaysMatches = todaysMatchesResult.data;
        data.bigMatches = todaysMatchesResult.data.filter(isBigMatch);
      }
    }
    
    // 3. News (last 24 hours)
    const newsResult = await getRecentNews(24);
    if (newsResult.success && newsResult.data) {
      data.recentNews = newsResult.data;
    }
    
    // 4. Player rankings (top 20)
    const rankingsResult = await getPlayerRankings();
    if (rankingsResult.success && rankingsResult.data) {
      data.topPlayers = rankingsResult.data.slice(0, 20);
    }
    
    // 5. Marshall's state
    data.marshallState = await getMarshallState();
    
    // 6. Tournament-specific data (if tournament specified)
    if (tournamentId) {
      const supabase = createAdminSupabase();
      const { data: tournament } = await supabase
        .from('atp_calendar')
        .select('location')
        .eq('id', tournamentId)
        .single();
      
      if (tournament) {
        const location = tournament.location as { city?: string; country?: string };
        
        // Weather (only if city and country are available)
        if (location.city && location.country) {
          const weatherResult = await getTournamentWeather(location as { city: string; country: string });
          if (weatherResult.success && weatherResult.data) {
            data.tournamentData = {
              ...data.tournamentData,
              weather: weatherResult.data,
            };
          }
          
          // Geocode location for Google Maps
          const geoResult = await geocodeLocation(location.city, location.country);
          if (geoResult.success && geoResult.data) {
            const coords = geoResult.data;
            
            // Hotels
            const hotelsResult = await findPlacesNearby(coords, 'hotel', 5000, 10);
            if (hotelsResult.success && hotelsResult.data) {
              data.tournamentData = {
                ...data.tournamentData,
                hotels: hotelsResult.data,
              };
            }
            
            // Coffee shops
            const coffeeResult = await findPlacesNearby(coords, 'coffee', 2000, 5);
            if (coffeeResult.success && coffeeResult.data) {
              data.tournamentData = {
                ...data.tournamentData,
                coffeeShops: coffeeResult.data,
              };
            }
            
            // Restaurants
            const restaurantsResult = await findPlacesNearby(coords, 'restaurant', 3000, 5);
            if (restaurantsResult.success && restaurantsResult.data) {
              data.tournamentData = {
                ...data.tournamentData,
                restaurants: restaurantsResult.data,
              };
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error aggregating data:', error);
  }
  
  return data;
}

/**
 * Get data for a specific content type
 */
export async function getDataForContentType(
  type: 'tournament' | 'match' | 'player' | 'gear' | 'lifestyle' | 'blast-from-past',
  context?: Record<string, any>
): Promise<Partial<AggregatedData>> {
  const data: Partial<AggregatedData> = {};
  
  switch (type) {
    case 'tournament':
      if (context?.tournamentId) {
        return aggregateDataForContent(context.tournamentId);
      }
      break;
      
    case 'match':
      if (context?.matchId || context?.tournamentId) {
        const matchesResult = await getTournamentMatches(context.tournamentId);
        if (matchesResult.success && matchesResult.data) {
          data.todaysMatches = matchesResult.data;
          data.bigMatches = matchesResult.data.filter(isBigMatch);
        }
      }
      break;
      
    case 'player':
      if (context?.playerName) {
        const playerResult = await getPlayerProfile(context.playerName);
        if (playerResult.success && playerResult.data) {
          data.topPlayers = [playerResult.data];
        }
      }
      break;
      
    case 'gear':
      if (context?.gearName) {
        const gearResult = await getGearItem(context.gearName);
        // Add to data structure if needed
      }
      break;
      
    case 'lifestyle':
      if (context?.tournamentId) {
        return aggregateDataForContent(context.tournamentId);
      }
      break;
      
    case 'blast-from-past':
      if (context?.playerName && context?.year) {
        const videosResult = await findMatchHighlights(
          context.playerName,
          context.tournament || '',
          context.year
        );
        // Add videos to data structure if needed
      }
      break;
  }
  
  return data;
}

/**
 * Format aggregated data for Gemini prompt
 */
export function formatDataForGemini(data: AggregatedData): string {
  let prompt = '## Current Context for Content Generation\n\n';
  
  // Active tournaments
  if (data.activeTournaments.length > 0) {
    prompt += '### Active Tournaments\n';
    data.activeTournaments.forEach(t => {
      prompt += `- ${t.name} (${t.start_date} - ${t.end_date})\n`;
      prompt += `  Location: ${t.location.city}, ${t.location.country}\n`;
    });
    prompt += '\n';
  }
  
  // Big matches today
  if (data.bigMatches && data.bigMatches.length > 0) {
    prompt += '### Big Matches Today\n';
    data.bigMatches.forEach(m => {
      prompt += `- ${m.player1.name} vs ${m.player2.name} (${m.round})\n`;
      prompt += `  Scheduled: ${new Date(m.scheduled_time).toLocaleString()}\n`;
      prompt += `  Status: ${m.status}\n`;
    });
    prompt += '\n';
  }
  
  // Recent news
  if (data.recentNews && data.recentNews.length > 0) {
    prompt += '### Recent Tennis News (Last 24 Hours)\n';
    data.recentNews.slice(0, 5).forEach(news => {
      prompt += `- ${news.title} (${news.source})\n`;
    });
    prompt += '\n';
  }
  
  // Marshall's state
  if (data.marshallState) {
    prompt += '### Marshall\'s Current State\n';
    if (data.marshallState.current_city) {
      prompt += `- Location: ${data.marshallState.current_city}, ${data.marshallState.current_country}\n`;
    }
    if (data.marshallState.current_racket) {
      prompt += `- Current Racket: ${data.marshallState.current_racket}\n`;
    }
    if (data.marshallState.up_and_coming_player_watching) {
      prompt += `- Watching: ${data.marshallState.up_and_coming_player_watching}\n`;
    }
    prompt += '\n';
  }
  
  // Tournament-specific data
  if (data.tournamentData) {
    if (data.tournamentData.weather) {
      prompt += '### Weather\n';
      prompt += `- Temperature: ${data.tournamentData.weather.current.temperature}°C\n`;
      prompt += `- Condition: ${data.tournamentData.weather.current.condition}\n`;
      prompt += '\n';
    }
    
    if (data.tournamentData.hotels && data.tournamentData.hotels.length > 0) {
      prompt += '### Hotels Near Tournament\n';
      data.tournamentData.hotels.slice(0, 3).forEach(hotel => {
        prompt += `- ${hotel.name} (${hotel.rating}⭐, ${hotel.distance_from_venue ? `${(hotel.distance_from_venue / 1000).toFixed(1)}km` : 'nearby'})\n`;
      });
      prompt += '\n';
    }
    
    if (data.tournamentData.coffeeShops && data.tournamentData.coffeeShops.length > 0) {
      prompt += '### Coffee Shops Near Tournament\n';
      data.tournamentData.coffeeShops.slice(0, 3).forEach(coffee => {
        prompt += `- ${coffee.name} (${coffee.rating}⭐)\n`;
      });
      prompt += '\n';
    }
  }
  
  return prompt;
}
