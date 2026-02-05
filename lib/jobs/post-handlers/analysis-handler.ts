/**
 * Analysis Post Handler
 * 
 * Handles: match analysis, player profiles, tournament recaps, news analysis
 * Gathers: player stats, head-to-head, recent news, match results, weather
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { createAdminSupabase } from '@/lib/supabase/server';
import { getPlayerProfile, getHeadToHead, getPlayerRankings } from '@/lib/data/integrations/player-data';
import { getRecentNews } from '@/lib/data/integrations/rss';
import { getTournamentMatches, getTodaysMatches } from '@/lib/data/integrations/sportradar-matches';
import { getTournamentWeather } from '@/lib/data/integrations/weather';
import { analyzeRecentPosts } from '@/lib/data/processor';

export async function handleAnalysisPost(
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
    
    // 2. Extract players mentioned in topic/description
    const players = extractPlayerNames(opportunity.topic + ' ' + opportunity.description);
    
    // 3. Gather player data
    if (players.length > 0) {
      const playerData: any[] = [];
      for (const playerName of players.slice(0, 3)) { // Limit to top 3 players
        const profileResult = await getPlayerProfile(playerName);
        if (profileResult.success && profileResult.data) {
          playerData.push(profileResult.data);
          dataSources.push(`Player profile: ${playerName}`);
        }
      }
      richData.players = playerData;
      
      // Get head-to-head if two players mentioned
      if (players.length >= 2) {
        const h2hResult = await getHeadToHead(players[0], players[1]);
        if (h2hResult.success && h2hResult.data) {
          richData.headToHead = h2hResult.data;
          dataSources.push(`H2H: ${players[0]} vs ${players[1]}`);
        }
      }
    }
    
    // 4. Get tournament data if available
    let tournament;
    let tournamentNews = null;
    let matchData = null;
    let weatherData = null;
    
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
        
        // Get match data
        const matchesResult = await getTournamentMatches(tournamentData.id);
        if (matchesResult.success && matchesResult.data) {
          matchData = matchesResult.data;
          richData.matches = matchData;
          dataSources.push(`Matches: ${matchData.length} found`);
        }
        
        // Get weather for tournament location (only if city and country are available)
        if (location.city && location.country) {
          const weatherResult = await getTournamentWeather(location as { city: string; country: string });
          if (weatherResult.success && weatherResult.data) {
            weatherData = weatherResult.data;
            richData.weather = weatherData;
            dataSources.push(`Weather: ${location.city}`);
          }
        }
      }
    }
    
    // 5. Get recent news (especially for recaps)
    const isRecap = opportunity.metadata?.isRecap === true || 
                    opportunity.topic.toLowerCase().includes('recap') ||
                    opportunity.topic.toLowerCase().includes('final');
    
    if (isRecap || opportunity.type === 'news') {
      const newsResult = await getRecentNews(48); // Last 48 hours
      if (newsResult.success && newsResult.data) {
        // Filter news relevant to this opportunity
        let relevantNews = newsResult.data;
        
        if (tournament) {
          const tournamentNameLower = tournament.name.toLowerCase();
          relevantNews = relevantNews.filter(news => {
            const combined = (news.title + ' ' + news.description).toLowerCase();
            return combined.includes(tournamentNameLower) ||
                   players.some(p => combined.includes(p.toLowerCase()));
          });
        } else if (players.length > 0) {
          relevantNews = relevantNews.filter(news => {
            const combined = (news.title + ' ' + news.description).toLowerCase();
            return players.some(p => combined.includes(p.toLowerCase()));
          });
        }
        
        tournamentNews = relevantNews;
        richData.news = relevantNews;
        dataSources.push(`News: ${relevantNews.length} relevant articles`);
      }
    }
    
    // 6. Get player rankings for context
    const rankingsResult = await getPlayerRankings();
    if (rankingsResult.success && rankingsResult.data) {
      richData.rankings = rankingsResult.data.slice(0, 20); // Top 20
      dataSources.push('Rankings: Top 20');
    }
    
    // Build context for Gemini
    const context: any = {
      type: 'analysis' as const,
      topic: opportunity.topic,
      tournament,
      recentPosts: recentPostsContext,
      isRecap,
      tournamentNews: tournamentNews || undefined,
    };
    
    // Add rich data to context for prompt building
    if (richData.players) {
      context.players = richData.players;
    }
    if (richData.headToHead) {
      context.headToHead = richData.headToHead;
    }
    if (richData.matches) {
      context.matches = richData.matches;
    }
    if (richData.weather) {
      context.weather = richData.weather;
    }
    if (richData.rankings) {
      context.rankings = richData.rankings;
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
    console.error('[Analysis Handler] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract player names from text (simple pattern matching)
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
