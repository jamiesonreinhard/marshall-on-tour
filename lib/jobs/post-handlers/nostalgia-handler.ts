/**
 * Nostalgia/Blast-from-Past Post Handler
 * 
 * Handles: historical player profiles, classic matches, tennis legends
 * Gathers: historical player data, YouTube videos, Wikipedia-style info
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { getMarshallState } from '@/lib/marshall/state';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { findMatchHighlights, findClassicMatches } from '@/lib/data/integrations/youtube';
import { getHistoricalPlayerData } from '@/lib/data/integrations/historical-players';

export async function handleNostalgiaPost(
  ctx: HandlerContext
): Promise<HandlerResult> {
  try {
    const { opportunity, manualInstructions } = ctx;
    const richData: Record<string, any> = {};
    const dataSources: string[] = [];
    
    // 1. Get recent posts for context
    const recentPosts = await analyzeRecentPosts(5);
    const recentPostsContext = recentPosts.map((p: any) => ({
      title: p.title,
      category: p.category,
    }));
    
    // 2. Extract player name and year from topic/description
    let { playerName, year, tournament } = extractNostalgiaContext(
      opportunity.topic + ' ' + opportunity.description + ' ' + (manualInstructions || '')
    );
    
    // If no player found, try to pick one from historical data that hasn't been covered recently
    if (!playerName) {
      console.log('[Nostalgia Handler] No player name found, attempting to select from historical players...');
      
      // Load historical players and pick one
      const historicalPlayers = [
        'federer', 'nadal', 'djokovic', 'sampras', 'agassi', 'mcenroe',
        'connors', 'borg', 'lendl', 'becker', 'edberg', 'wilander',
        'rafter', 'courier', 'chang', 'rios', 'kuerten', 'hewitt', 'roddick',
        'safin', 'ferrero', 'moya', 'corretja', 'grosjean', 'henman',
      ];
      
      const { hasPostedAboutTopic } = await import('../variety-tracker');
      
      for (const player of historicalPlayers) {
        const alreadyPosted = await hasPostedAboutTopic(player, 7);
        if (!alreadyPosted) {
          playerName = player;
          console.log(`[Nostalgia Handler] Selected player: ${playerName}`);
          break;
        }
      }
      
      // If all players were recently posted about, use the first one anyway
      if (!playerName) {
        playerName = historicalPlayers[0];
        console.log(`[Nostalgia Handler] All players recently posted, using fallback: ${playerName}`);
      }
    }
    
    // 3. Get historical player data
    const historicalData = await getHistoricalPlayerData(playerName);
    if (historicalData.success && historicalData.data) {
      richData.historicalPlayer = historicalData.data;
      dataSources.push(`Historical data: ${playerName}`);
    } else {
      // Fallback: create basic structure from player name
      richData.historicalPlayer = {
        name: playerName,
        era: 'Unknown',
        achievements: [],
      };
      console.warn(`[Nostalgia Handler] No historical data found for ${playerName}, using basic structure`);
    }
    
    // 4. Find YouTube videos
    if (year && tournament) {
      // Specific match highlights
      const videosResult = await findMatchHighlights(playerName, tournament, year);
      if (videosResult.success && videosResult.data && videosResult.data.length > 0) {
        richData.videos = videosResult.data;
        dataSources.push(`YouTube: ${videosResult.data.length} match highlights`);
      }
    } else {
      // Classic matches in general
      const videosResult = await findClassicMatches(playerName, tournament || undefined);
      if (videosResult.success && videosResult.data && videosResult.data.length > 0) {
        richData.videos = videosResult.data;
        dataSources.push(`YouTube: ${videosResult.data.length} classic matches`);
      }
    }

    // Marshall's current state
    const marshallState = await getMarshallState();
    if (marshallState) {
      dataSources.push('Marshall state: current location & gear');
    }
    
    // 5. Build context for Gemini
    const context: any = {
      type: 'lifestyle' as const, // Nostalgia posts are lifestyle category
      topic: opportunity.topic,
      recentPosts: recentPostsContext,
      marshallAge: 33,
      marshallBirthYear: 1993,
    };
    if (marshallState) {
      context.marshallState = marshallState;
    }
    
    // Add rich data
    if (richData.historicalPlayer) {
      context.historicalPlayer = richData.historicalPlayer;
    }
    if (richData.videos) {
      context.videos = richData.videos;
    }
    if (year) {
      context.year = year;
    }
    if (tournament) {
      context.tournament = tournament;
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
    console.error('[Nostalgia Handler] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract player name, year, and tournament from text
 */
function extractNostalgiaContext(text: string): {
  playerName: string | null;
  year: number | null;
  tournament: string | null;
} {
  const textLower = text.toLowerCase();
  
  // Historical players (expanded list)
  const historicalPlayers = [
    'federer', 'nadal', 'djokovic', 'sampras', 'agassi', 'mcenroe',
    'connors', 'borg', 'lendl', 'becker', 'edberg', 'wilander',
    'rafter', 'courier', 'chang', 'rios', 'kuerten', 'hewitt', 'roddick',
    'safin', 'ferrero', 'moya', 'corretja', 'grosjean', 'henman',
    'graf', 'navratilova', 'evert', 'seles', 'williams', 'venus',
    'serena', 'hingis', 'davenport', 'capriati', 'pierce', 'mauresmo',
  ];
  
  let playerName: string | null = null;
  
  // First, try exact matches (more specific)
  for (const player of historicalPlayers) {
    // Check for exact word match (handles "Patrick Rafter" -> "rafter")
    const playerRegex = new RegExp(`\\b${player}\\b`, 'i');
    if (playerRegex.test(textLower)) {
      playerName = player;
      break;
    }
  }
  
  // If no exact match, try substring match (fallback)
  if (!playerName) {
    for (const player of historicalPlayers) {
      if (textLower.includes(player)) {
        playerName = player;
        break;
      }
    }
  }
  
  // Extract year (4 digits, between 1960 and 2020 for historical)
  const yearMatch = text.match(/\b(19[6-9]\d|20[01]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extract tournament (common tournament names)
  const tournaments = [
    'wimbledon', 'roland garros', 'french open', 'us open', 'australian open',
    'indian wells', 'miami', 'monte carlo', 'madrid', 'rome', 'cincinnati',
    'shanghai', 'paris', 'atp finals', 'davis cup',
  ];
  
  let tournament: string | null = null;
  for (const t of tournaments) {
    if (textLower.includes(t)) {
      tournament = t;
      break;
    }
  }
  
  return { playerName, year, tournament };
}
