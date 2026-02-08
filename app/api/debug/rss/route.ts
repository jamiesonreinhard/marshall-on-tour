import { NextResponse } from 'next/server';
import { fetchTennisNews, getRecentNews } from '@/lib/data/integrations/rss';

/**
 * Debug endpoint for RSS feeds only (no Sportradar).
 * Uses the same integration as post generation: lib/data/integrations/rss
 *
 * GET /api/debug/rss
 */
export async function GET() {
  try {
    const [allResult, recentResult] = await Promise.all([
      fetchTennisNews({ fallbackToMock: false }),
      getRecentNews(24, { fallbackToMock: false }),
    ]);

    const allCount = allResult.success && allResult.data ? allResult.data.length : 0;
    const recentCount = recentResult.success && recentResult.data ? recentResult.data.length : 0;

    return NextResponse.json({
      ok: allResult.success,
      source: allResult.source,
      allNews: {
        count: allCount,
        sample: allResult.success && allResult.data ? allResult.data.slice(0, 5) : [],
      },
      recentNews24h: {
        count: recentCount,
        sample: recentResult.success && recentResult.data ? recentResult.data.slice(0, 5) : [],
      },
      error: allResult.success ? undefined : allResult.error,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'RSS fetch failed',
      },
      { status: 500 }
    );
  }
}
