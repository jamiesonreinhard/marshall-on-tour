import { NextResponse } from 'next/server';

/**
 * Debug route: test all known tennisapi1 (RapidAPI) endpoints to see which return useful data.
 * GET /api/debug/tennisapi-endpoints
 *
 * Returns for each endpoint: name, path, description, status, ok, summary (item count or keys),
 * and a short "useful for" note so we can decide what to incorporate into posting.
 */

const HOST = process.env.RAPIDAPI_TENNIS_HOST || 'tennisapi1.p.rapidapi.com';
const BASE = `https://${HOST}`;

function getHeaders(): Record<string, string> {
  const key = process.env.RAPIDAPI_KEY || process.env.FREEWEBAPI_RAPIDAPI_KEY;
  if (!key) return {};
  return {
    'X-RapidAPI-Key': key,
    'X-RapidAPI-Host': HOST,
  };
}

function summarize(data: unknown): { summary: string; itemCount?: number; keys?: string[] } {
  if (data == null) return { summary: 'null' };
  if (Array.isArray(data)) {
    const len = data.length;
    const sample = data[0];
    const sampleKeys = typeof sample === 'object' && sample !== null ? Object.keys(sample as object).slice(0, 8) : [];
    return {
      summary: len === 0 ? 'empty array' : `array of ${len} items`,
      itemCount: len,
      keys: sampleKeys.length ? sampleKeys : undefined,
    };
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data as object);
    return { summary: `object with ${keys.length} keys`, keys: keys.slice(0, 12) };
  }
  return { summary: String(data).slice(0, 80) };
}

interface EndpointDef {
  name: string;
  path: string;
  description: string;
  usefulFor?: string;
}

function buildEndpoints(): EndpointDef[] {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return [
    {
      name: 'calendar_categories',
      path: `/api/tennis/calendar/${day}/${month}/${year}/categories`,
      description: 'Categories (tournaments) for a given date',
      usefulFor: 'Content calendar, which tournaments are on which days',
    },
    {
      name: 'calendar_categories_with_days',
      path: '/api/tennis/calendar/10/2022/categories?days=2,3,4,5,6',
      description: 'Categories for a month with day filter (Oct 2022, days 2–6)',
      usefulFor: 'Multi-day calendar view',
    },
    {
      name: 'category_events',
      path: '/api/tennis/category/3/events/22/7/2025',
      description: 'Events (matches) for a category on a date (category 3, 22 Jul 2025)',
      usefulFor: 'Match schedule for a tournament on a specific day',
    },
    {
      name: 'events_live',
      path: '/api/tennis/events/live',
      description: 'Currently live events',
      usefulFor: 'Live match posts, real-time content',
    },
    {
      name: 'event_highlights',
      path: '/api/tennis/event/14232981/highlights',
      description: 'Highlights for a specific event ID',
      usefulFor: 'Embedding highlight clips in recaps',
    },
    {
      name: 'tv_channel_event',
      path: '/api/tv/channel/3177/event/10974920',
      description: 'TV/broadcast info for an event',
      usefulFor: 'Where to watch, broadcast mentions',
    },
    {
      name: 'search',
      path: '/api/tennis/search/federer?page=0',
      description: 'Search players/tournaments (e.g. federer)',
      usefulFor: 'Player lookup, name resolution (we already use this)',
    },
    {
      name: 'tournament_schedules',
      path: '/api/tennis/tournament/31614/schedules/23/12/2025',
      description: 'Schedule for a tournament on a date (tournament 31614, 23 Dec 2025)',
      usefulFor: 'Tournament-specific match schedule, recaps',
    },
    {
      name: 'tournament_media',
      path: '/api/tennis/tournament/2473/media',
      description: 'Media assets for a tournament',
      usefulFor: 'Images, logos for recap/tournament posts',
    },
    {
      name: 'tournament_venues',
      path: '/api/tennis/tournament/2473/season/67391/venues',
      description: 'Venues for a tournament season',
      usefulFor: 'Venue/court names for recap images, location context',
    },
  ];
}

export async function GET() {
  const headers = getHeaders();
  if (!headers['X-RapidAPI-Key']) {
    return NextResponse.json({
      ok: false,
      error: 'RAPIDAPI_KEY (or FREEWEBAPI_RAPIDAPI_KEY) not set',
      endpoints: [],
    });
  }

  const endpoints = buildEndpoints();
  const results: Array<{
    name: string;
    path: string;
    description: string;
    usefulFor?: string;
    status: number;
    ok: boolean;
    summary: string;
    itemCount?: number;
    keys?: string[];
    error?: string;
  }> = [];

  const tests: Record<string, 'pass' | 'fail'> = {};

  for (const ep of endpoints) {
    const url = `${BASE}${ep.path}`;
    try {
      const res = await fetch(url, { headers, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      const { summary: summaryStr, itemCount, keys } = summarize(data);
      const ok = res.ok && (res.status >= 200 && res.status < 300);
      results.push({
        name: ep.name,
        path: ep.path,
        description: ep.description,
        usefulFor: ep.usefulFor,
        status: res.status,
        ok,
        summary: summaryStr,
        itemCount,
        keys: keys?.length ? keys : undefined,
        error: res.ok ? undefined : (typeof data === 'object' && data?.message) ? String(data.message) : `${res.status} ${res.statusText}`,
      });
      tests[ep.name] = ok ? 'pass' : 'fail';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed';
      results.push({
        name: ep.name,
        path: ep.path,
        description: ep.description,
        usefulFor: ep.usefulFor,
        status: 0,
        ok: false,
        summary: message,
        error: message,
      });
      tests[ep.name] = 'fail';
    }
  }

  const allOk = results.every((r) => r.ok);

  return NextResponse.json({
    ok: allOk,
    tests,
    endpoints: results,
    note: 'Useful for: compare summaries and usefulFor to decide which endpoints to integrate into content calendar, recaps, and match posts.',
  });
}
