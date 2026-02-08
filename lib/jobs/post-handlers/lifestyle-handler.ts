/**
 * Lifestyle Post Handler
 * 
 * Handles: lifestyle guides, general tennis content, day updates
 * Gathers: tournament context, Marshall's state, general tennis news
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { createAdminSupabase } from '@/lib/supabase/server';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { getMarshallState } from '@/lib/marshall/state';
import { getRecentNews } from '@/lib/data/integrations/rss';
import { getPlayerRankings } from '@/lib/data/integrations/player-data';

export async function handleLifestylePost(
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
    
    // 2. Get Marshall's current state
    const marshallState = await getMarshallState();
    if (marshallState) {
      richData.marshallState = marshallState;
      dataSources.push('Marshall state: current location & gear');
    }

    // 2b. Top players (for small mentions in lifestyle posts)
    const rankingsResult = await getPlayerRankings();
    if (rankingsResult.success && rankingsResult.data) {
      richData.rankings = rankingsResult.data.slice(0, 15);
      dataSources.push('Rankings: Top 15 (for player mentions)');
    }

    // 3. Get tournament data if available
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
      }
    }
    
    // 4. Get recent tennis news for context
    const newsResult = await getRecentNews(24);
    if (newsResult.success && newsResult.data) {
      richData.recentNews = newsResult.data.slice(0, 5); // Top 5
      dataSources.push(`News: ${newsResult.data.length} articles`);
    }
    
    // 5. Build context for Gemini
    const context: any = {
      type: 'lifestyle' as const,
      topic: opportunity.topic,
      tournament,
      recentPosts: recentPostsContext,
      affiliateFeatured: true, // Lifestyle/travel guides get featured "Marshall's picks" in first 400 words
    };
    
    // Add rich data
    if (richData.marshallState) {
      context.marshallState = richData.marshallState;
    }
    if (richData.recentNews) {
      context.recentNews = richData.recentNews;
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
    console.error('[Lifestyle Handler] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
