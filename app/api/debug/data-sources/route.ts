import { NextResponse } from 'next/server';
import { getCurrentTournamentsFromDB, getUpcomingTournamentsFromDB } from '@/lib/data/tournaments-from-db';
import { getATPRankings, getEventSchedules } from '@/lib/data/integrations/freewebapi';
import { fetchTennisNews, getRecentNews } from '@/lib/data/integrations/rss';

/**
 * Debug endpoint: data from free stack only (no Sportradar).
 *
 * GET /api/debug/data-sources
 *
 * Returns:
 * - Tournaments: atp_calendar (current + upcoming)
 * - Rankings + today's matches: FreeWebAPI (RapidAPI)
 * - News: RSS (ESPN, BBC, Tennis.com)
 */

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      currentTournaments,
      upcomingTournaments,
      rankingsResult,
      todaysMatchesResult,
      allNewsResult,
      recentNewsResult,
    ] = await Promise.all([
      getCurrentTournamentsFromDB(),
      getUpcomingTournamentsFromDB(),
      getATPRankings(),
      getEventSchedules(today),
      fetchTennisNews(),
      getRecentNews(24),
    ]);

    const rankings = rankingsResult.success && rankingsResult.data ? rankingsResult.data : [];
    const todaysMatches = todaysMatchesResult.success && todaysMatchesResult.data ? todaysMatchesResult.data : [];
    const allNews = allNewsResult.success && allNewsResult.data ? allNewsResult.data : [];
    const recentNews = recentNewsResult.success && recentNewsResult.data ? recentNewsResult.data : [];

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        tournaments: {
          current: { count: currentTournaments.length, tournaments: currentTournaments },
          upcoming: { count: upcomingTournaments.length, tournaments: upcomingTournaments },
        },
        freewebapi: {
          rankings: { count: rankings.length, top10: rankings.slice(0, 10) },
          todaysMatches: { count: todaysMatches.length, matches: todaysMatches.slice(0, 20) },
        },
        rss: {
          allNews: { count: allNews.length, items: allNews.slice(0, 5) },
          recentNews: { count: recentNews.length, items: recentNews },
        },
        summary: {
          currentTournaments: currentTournaments.length,
          upcomingTournaments: upcomingTournaments.length,
          topRankedPlayers: rankings.slice(0, 5).map((p) => p.name),
          todaysMatchesCount: todaysMatches.length,
          recentNewsCount: recentNews.length,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch data sources',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
