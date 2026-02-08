/**
 * Topic Generator
 * 
 * Intelligently generates post topics based on:
 * - Post type
 * - Available data (tournaments, players, etc.)
 * - Recent posts (to avoid duplicates)
 * - Manual instructions
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { getCurrentTournamentsFromDB, getUpcomingTournamentsFromDB } from '@/lib/data/tournaments-from-db';
import { getRecentNews } from '@/lib/data/integrations/rss';
import { getPlayerRankings } from '@/lib/data/integrations/player-data';
import { hasPostedAboutTopic, hasPostedAboutTournament } from './variety-tracker';
import { getMarshallState } from '@/lib/marshall/state';

export interface TopicGenerationOptions {
  type: 'analysis' | 'gear' | 'travel' | 'lifestyle' | 'blast-from-past' | 'tournament' | 'match' | 'player' | 'news';
  manualInstructions?: string;
  tournamentId?: string;
}

/**
 * Generate an intelligent topic for a post
 */
export async function generateTopic(options: TopicGenerationOptions): Promise<string> {
  const { type, manualInstructions, tournamentId } = options;
  
  // Extract hints from manual instructions
  const instructions = (manualInstructions || '').toLowerCase();
  
  switch (type) {
    case 'analysis':
      return await generateAnalysisTopic(instructions, tournamentId);
    
    case 'gear':
      return await generateGearTopic(instructions);
    
    case 'travel':
      return await generateTravelTopic(instructions, tournamentId);
    
    case 'lifestyle':
      return await generateLifestyleTopic(instructions, tournamentId);
    
    case 'blast-from-past':
      return await generateNostalgiaTopic(instructions);
    
    case 'tournament':
      return await generateTournamentTopic(instructions, tournamentId);
    
    case 'match':
      return await generateMatchTopic(instructions, tournamentId);
    
    case 'player':
      return await generatePlayerTopic(instructions);
    
    case 'news':
      return await generateNewsTopic(instructions);
    
    default:
      return 'Tennis Content';
  }
}

/**
 * Generate analysis topic
 */
async function generateAnalysisTopic(instructions: string, tournamentId?: string): Promise<string> {
  // Check for active tournaments
  const activeTournaments = await getCurrentTournamentsFromDB();
  const upcomingTournaments = await getUpcomingTournamentsFromDB();
  
  // Check recent news for interesting stories
  const newsResult = await getRecentNews(24);
  const recentNews = newsResult.success && newsResult.data ? newsResult.data : [];
  
  // Check player rankings for interesting matchups
  const rankingsResult = await getPlayerRankings();
  const topPlayers = rankingsResult.success && rankingsResult.data ? rankingsResult.data.slice(0, 10) : [];
  
  // If tournament specified, focus on that
  if (tournamentId) {
    const supabase = createAdminSupabase();
    const { data: tournament } = await supabase
      .from('atp_calendar')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    if (tournament) {
      // Check if we've posted about this tournament recently
      const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
      if (!alreadyPosted) {
        return `${tournament.name} Preview: What to Watch`;
      }
    }
  }
  
  // Check for interesting news
  if (recentNews.length > 0) {
    const topNews = recentNews[0];
    const newsTitle = topNews.title.toLowerCase();
    
    // Extract player names from news
    const playerNames = extractPlayerNames(newsTitle);
    if (playerNames.length > 0) {
      const alreadyPosted = await hasPostedAboutTopic(playerNames[0], 3);
      if (!alreadyPosted) {
        return `${playerNames[0].charAt(0).toUpperCase() + playerNames[0].slice(1)}: Breaking Down the Latest News`;
      }
    }
  }
  
  // Check for active tournaments
  if (activeTournaments.length > 0) {
    const tournament = activeTournaments[0];
    const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
    if (!alreadyPosted) {
      return `${tournament.name} Day Update: Key Matches and Storylines`;
    }
  }
  
  // Check for upcoming tournaments
  if (upcomingTournaments.length > 0) {
    const tournament = upcomingTournaments[0];
    const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
    if (!alreadyPosted) {
      return `${tournament.name} Preview: What to Expect`;
    }
  }
  
  // Check for interesting player matchups
  if (topPlayers.length >= 2) {
    const player1 = topPlayers[0];
    const player2 = topPlayers[1];
    const alreadyPosted = await hasPostedAboutTopic(`${player1.name} ${player2.name}`, 7);
    if (!alreadyPosted) {
      return `${player1.name} vs ${player2.name}: A Tactical Breakdown`;
    }
  }
  
  // Fallback
  return 'Tennis Analysis: Breaking Down the Latest';
}

/**
 * Generate gear topic
 */
async function generateGearTopic(instructions: string): Promise<string> {
  const year = new Date().getFullYear();
  
  if (instructions.includes('racket')) {
    return `Best Tennis Rackets for ${year}: A Complete Guide`;
  } else if (instructions.includes('shoe') || instructions.includes('footwear')) {
    return `Best Tennis Shoes for ${year}: Performance and Comfort`;
  } else if (instructions.includes('bag')) {
    return `Best Tennis Bags for ${year}: Style and Function`;
  } else if (instructions.includes('clothing') || instructions.includes('apparel')) {
    return `Best Tennis Apparel for ${year}: Performance Wear Guide`;
  } else if (instructions.includes('string')) {
    return `Best Tennis Strings for ${year}: Power vs Control`;
  } else {
    return `Best Tennis Gear for ${year}: Complete Equipment Guide`;
  }
}

/**
 * Generate travel topic
 */
async function generateTravelTopic(instructions: string, tournamentId?: string): Promise<string> {
  if (tournamentId) {
    const supabase = createAdminSupabase();
    const { data: tournament } = await supabase
      .from('atp_calendar')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    if (tournament) {
      const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
      if (!alreadyPosted) {
        const location = tournament.location as { city?: string; country?: string };
        return `${location.city || tournament.name} Travel Guide: Where to Stay, Eat, and Explore`;
      }
    }
  }
  
  const upcomingTournaments = await getUpcomingTournamentsFromDB();
  if (upcomingTournaments.length > 0) {
    const tournament = upcomingTournaments[0];
    const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
    if (!alreadyPosted) {
      const location = tournament.location as { city?: string; country?: string };
      return `${location.city || tournament.name} Travel Guide: Complete Tournament Experience`;
    }
  }
  
  return 'Tennis Travel Guide: Exploring the Tour';
}

/**
 * Generate lifestyle topic
 */
async function generateLifestyleTopic(instructions: string, tournamentId?: string): Promise<string> {
  const marshallState = await getMarshallState();
  
  if (tournamentId) {
    const supabase = createAdminSupabase();
    const { data: tournament } = await supabase
      .from('atp_calendar')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    if (tournament) {
      const location = tournament.location as { city?: string; country?: string };
      return `Life on Tour: ${location.city || tournament.name} Edition`;
    }
  }
  
  if (marshallState?.current_city) {
    return `Life on Tour: ${marshallState.current_city} Edition`;
  }
  
  return 'Life on Tour: Behind the Scenes';
}

/**
 * Generate nostalgia topic
 */
async function generateNostalgiaTopic(instructions: string): Promise<string> {
  // Extract player name from instructions
  const historicalPlayers = [
    'federer', 'nadal', 'djokovic', 'sampras', 'agassi', 'mcenroe',
    'connors', 'borg', 'lendl', 'becker', 'edberg', 'wilander',
    'rafter', 'courier', 'chang', 'rios', 'kuerten', 'hewitt', 'roddick',
    'safin', 'ferrero', 'moya', 'corretja', 'grosjean', 'henman',
  ];
  
  const instructionsLower = instructions.toLowerCase();
  
  // First, try to extract from instructions (use word boundaries for better matching)
  for (const player of historicalPlayers) {
    // Use word boundary regex to match "Patrick Rafter" -> "rafter"
    const playerRegex = new RegExp(`\\b${player}\\b`, 'i');
    if (playerRegex.test(instructionsLower)) {
      // Get full name from historical data if available
      const { getHistoricalPlayerData } = await import('@/lib/data/integrations/historical-players');
      const playerData = await getHistoricalPlayerData(player);
      const playerName = playerData.success && playerData.data?.fullName 
        ? playerData.data.fullName
        : player.charAt(0).toUpperCase() + player.slice(1);
      
      const yearMatch = instructions.match(/\b(19[6-9]\d|20[01]\d)\b/);
      if (yearMatch) {
        // Even if recently posted, if user explicitly requested this player, use it
        return `Blast from the Past: ${playerName} in ${yearMatch[1]}`;
      }
      // Even if recently posted, if user explicitly requested this player, use it
      return `Remembering ${playerName}: A Tennis Legend`;
    }
  }
  
  // If no player in instructions, pick one that hasn't been covered recently
  // Load historical players data
  const { getHistoricalPlayerData } = await import('@/lib/data/integrations/historical-players');
  
  for (const player of historicalPlayers) {
    const alreadyPosted = await hasPostedAboutTopic(player, 7);
    if (!alreadyPosted) {
      const playerData = await getHistoricalPlayerData(player);
      if (playerData.success && playerData.data) {
        const playerName = playerData.data.fullName || player.charAt(0).toUpperCase() + player.slice(1);
        return `Remembering ${playerName}: A Tennis Legend`;
      }
    }
  }
  
  // Fallback: use first player (Federer) even if recently posted
  return 'Remembering Roger Federer: A Tennis Legend';
}

/**
 * Generate tournament topic
 */
async function generateTournamentTopic(instructions: string, tournamentId?: string): Promise<string> {
  if (tournamentId) {
    const supabase = createAdminSupabase();
    const { data: tournament } = await supabase
      .from('atp_calendar')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    if (tournament) {
      const alreadyPosted = await hasPostedAboutTournament(tournament.name, 7);
      if (!alreadyPosted) {
        return `${tournament.name} Preview: Everything You Need to Know`;
      }
    }
  }
  
  return generateAnalysisTopic(instructions, tournamentId);
}

/**
 * Generate match topic
 */
async function generateMatchTopic(instructions: string, tournamentId?: string): Promise<string> {
  return generateAnalysisTopic(instructions, tournamentId);
}

/**
 * Generate player topic
 */
async function generatePlayerTopic(instructions: string): Promise<string> {
  const rankingsResult = await getPlayerRankings();
  const topPlayers = rankingsResult.success && rankingsResult.data ? rankingsResult.data.slice(0, 10) : [];
  
  // Extract player name from instructions
  const playerNames = extractPlayerNames(instructions);
  if (playerNames.length > 0) {
    const playerName = playerNames[0];
    const alreadyPosted = await hasPostedAboutTopic(playerName, 7);
    if (!alreadyPosted) {
      return `${playerName.charAt(0).toUpperCase() + playerName.slice(1)}: Rising Star Profile`;
    }
  }
  
  // Use top player
  if (topPlayers.length > 0) {
    const player = topPlayers[0];
    const alreadyPosted = await hasPostedAboutTopic(player.name, 7);
    if (!alreadyPosted) {
      return `${player.name}: Breaking Down Their Game`;
    }
  }
  
  return 'Player Profile: Rising Star';
}

/**
 * Generate news topic
 */
async function generateNewsTopic(instructions: string): Promise<string> {
  const newsResult = await getRecentNews(24);
  const recentNews = newsResult.success && newsResult.data ? newsResult.data : [];
  
  if (recentNews.length > 0) {
    const topNews = recentNews[0];
    // Create a topic from the news title
    return `Breaking Down: ${topNews.title}`;
  }
  
  return 'Tennis News Analysis';
}

/**
 * Extract player names from text
 */
function extractPlayerNames(text: string): string[] {
  const commonPlayers = [
    'alcaraz', 'djokovic', 'sinner', 'medvedev', 'federer', 'nadal',
    'murray', 'tsitsipas', 'zverev', 'rublev', 'ruud', 'fritz',
    'rybakina', 'sabalenka', 'swiatek', 'gauff', 'pegula', 'vondrousova',
    'rune', 'fils', 'shelton', 'paul', 'tiafoe', 'norrie',
  ];
  
  const textLower = text.toLowerCase();
  const found: string[] = [];
  
  for (const player of commonPlayers) {
    if (textLower.includes(player)) {
      found.push(player);
    }
  }
  
  return found;
}
