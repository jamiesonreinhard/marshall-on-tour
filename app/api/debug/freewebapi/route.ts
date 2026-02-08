import { NextResponse } from 'next/server';
import {
  getATPRankings,
  getRisingPlayers,
  getEventSchedules,
  getTournamentResultsForRecap,
  isFreeWebApiConfigured,
} from '@/lib/data/integrations/freewebapi';

/**
 * Debug endpoint to verify FreeWebAPI (RapidAPI tennisapi1) responses.
 * GET /api/debug/freewebapi
 *
 * Tests: rankings, rising players, event schedules (today), tournament results for recap.
 * Optional query: recapTournament=Name&recapEndDate=YYYY-MM-DD to test recap with a specific tournament.
 */
export async function GET(request: Request) {
  const key = process.env.RAPIDAPI_KEY || process.env.FREEWEBAPI_RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_TENNIS_HOST || 'tennisapi1.p.rapidapi.com';
  const url = `https://${host}/api/tennis/rankings/atp`;

  if (!key) {
    return NextResponse.json({
      ok: false,
      error: 'RAPIDAPI_KEY (or FREEWEBAPI_RAPIDAPI_KEY) not set',
      configured: isFreeWebApiConfigured(),
    });
  }

  const { searchParams } = new URL(request.url);
  const recapTournament = searchParams.get('recapTournament') || 'Australian Open';
  const recapEndDate = searchParams.get('recapEndDate') || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  try {
    // 1. Raw rankings fetch
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
      cache: 'no-store',
    });
    const raw = await res.json().catch(() => ({}));

    // Use explicit enabled: true so partial config doesn't override DEFAULT_CONFIG.enabled
    const testConfig = { enabled: true, fallbackToMock: false };

    // 2. Parsed rankings and rising players
    const parsed = await getATPRankings(testConfig);
    const rising = await getRisingPlayers(8, testConfig);

    // 3. Event schedules for today (matches scheduled/finished today)
    const today = new Date().toISOString().split('T')[0];
    const eventSchedules = await getEventSchedules(today, testConfig);

    // 4. Tournament results for recap (finished matches in final days of a tournament)
    const tournamentResults = await getTournamentResultsForRecap(recapTournament, recapEndDate, testConfig);

    const rankingsOk = parsed.success && (parsed.data?.length ?? 0) > 0;
    const eventsOk = eventSchedules.success;
    const recapOk = tournamentResults.success;

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      configured: isFreeWebApiConfigured(),
      tests: {
        rankings: rankingsOk ? 'pass' : (parsed.success ? 'empty' : 'fail'),
        eventSchedulesToday: eventsOk ? 'pass' : 'fail',
        tournamentResultsRecap: recapOk ? 'pass' : 'fail',
      },
      rawResponse: raw,
      rawKeys: typeof raw === 'object' && raw !== null ? Object.keys(raw) : [],
      parsed: parsed.success
        ? { success: true, source: parsed.source, count: parsed.data?.length ?? 0, sample: (parsed.data ?? []).slice(0, 5) }
        : { success: false, error: parsed.error, source: parsed.source },
      risingPlayers: rising.success ? { count: rising.data?.length ?? 0, players: rising.data ?? [] } : { error: rising.error },
      eventSchedulesToday: eventSchedules.success
        ? { success: true, date: today, count: eventSchedules.data?.length ?? 0, sample: (eventSchedules.data ?? []).slice(0, 5) }
        : { success: false, error: eventSchedules.error, date: today },
      tournamentResultsRecap: tournamentResults.success
        ? {
            success: true,
            tournament: recapTournament,
            endDate: recapEndDate,
            count: tournamentResults.data?.length ?? 0,
            sample: (tournamentResults.data ?? []).slice(0, 10),
          }
        : {
            success: false,
            error: tournamentResults.error,
            tournament: recapTournament,
            endDate: recapEndDate,
          },
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message ?? 'Request failed',
      configured: isFreeWebApiConfigured(),
    });
  }
}
