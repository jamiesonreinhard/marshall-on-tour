import { NextResponse } from 'next/server';
import { getATPTournaments, getUpcomingTournaments, getCurrentTournaments, getATPRankings } from '@/lib/data/sportradar';
import { getTennisNews, getRecentNews, getNewsFromSource } from '@/lib/data/rss';

/**
 * Debug endpoint to view raw data from RSS and Sportradar
 * 
 * GET /api/debug/data-sources
 * 
 * Shows what data is being fetched from:
 * - Sportradar API (tournaments, rankings)
 * - RSS feeds (news)
 */

export async function GET() {
  try {
    // Fetch all data sources in parallel
    const [
      allTournaments,
      upcomingTournaments,
      currentTournaments,
      rankings,
      allNews,
      recentNews,
      espnNews,
      bbcNews,
      tennisComNews,
    ] = await Promise.all([
      getATPTournaments(),
      getUpcomingTournaments(),
      getCurrentTournaments(),
      getATPRankings(),
      getTennisNews(20),
      getRecentNews(24),
      getNewsFromSource('espn', 5),
      getNewsFromSource('bbc', 5),
      getNewsFromSource('tennisCom', 5),
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      sportradar: {
        allTournaments: {
          count: allTournaments.length,
          tournaments: allTournaments.slice(0, 5), // First 5
        },
        upcomingTournaments: {
          count: upcomingTournaments.length,
          tournaments: upcomingTournaments,
        },
        currentTournaments: {
          count: currentTournaments.length,
          tournaments: currentTournaments,
        },
        rankings: {
          count: rankings.length,
          top10: rankings.slice(0, 10),
        },
      },
      rss: {
        allNews: {
          count: allNews.length,
          items: allNews.slice(0, 5), // First 5
        },
        recentNews: {
          count: recentNews.length,
          items: recentNews,
        },
        bySource: {
          espn: {
            count: espnNews.length,
            items: espnNews,
          },
          bbc: {
            count: bbcNews.length,
            items: bbcNews,
          },
          tennisCom: {
            count: tennisComNews.length,
            items: tennisComNews,
          },
        },
      },
      summary: {
        totalTournaments: allTournaments.length,
        upcomingCount: upcomingTournaments.length,
        currentCount: currentTournaments.length,
        totalNewsItems: allNews.length,
        recentNewsCount: recentNews.length,
        topRankedPlayers: rankings.slice(0, 5).map(p => p.name),
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
