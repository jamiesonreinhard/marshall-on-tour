/**
 * FreeWebAPI Tennis API (via RapidAPI)
 *
 * Documentation: https://freewebapi.com/sports-apis/tennis-api/
 * Access: https://rapidapi.com/fluis.lacasse/api/tennisapi1
 *
 * Set RAPIDAPI_KEY in env (from RapidAPI subscription). Optional: RAPIDAPI_HOST
 * defaults to tennisapi1.p.rapidapi.com.
 *
 * Provides: ATP rankings, search (players/tournaments), event schedules,
 * player details, head-to-head. Used to fill Marshall's player/rankings data
 * for analysis, player posts, and small mentions across all post types.
 */

import { Player, Match, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 3600, // 1 hour for rankings
  fallbackToMock: true,
};

function mergeConfig(config?: DataSourceConfig): DataSourceConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

const RAPIDAPI_HOST = process.env.RAPIDAPI_TENNIS_HOST || 'tennisapi1.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;
const RANKINGS_PATH = '/api/tennis/rankings'; // + /atp or /wta
const API_TENNIS = '/api/tennis';

function getApiKey(): string | null {
  return process.env.RAPIDAPI_KEY || process.env.FREEWEBAPI_RAPIDAPI_KEY || null;
}

function getHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) return {};
  return {
    'X-RapidAPI-Key': key,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  };
}

export function isFreeWebApiConfigured(): boolean {
  return !!getApiKey();
}

/** Raw response shapes - tennisapi1 returns { rankings: [...] } */
interface RankingEntry {
  rank?: number;
  ranking?: number;
  position?: number;
  name?: string;
  player_name?: string;
  rowName?: string;
  player?: { name?: string; id?: string };
  team?: { name?: string; id?: number; country?: { name?: string; alpha2?: string } };
  country?: string | { name?: string; alpha2?: string };
  country_code?: string;
  nationality?: string;
  points?: number;
  id?: number;
  previousRanking?: number;
  previousPoints?: number;
  bestRanking?: number;
  tournamentsPlayed?: number;
}

/** Enriched player for "up and coming" / rising-star posts (from rankings API) */
export interface PlayerWithRankingStats extends Player {
  previousRanking?: number;
  points?: number;
  bestRanking?: number;
  tournamentsPlayed?: number;
}

interface SearchResultItem {
  id?: string;
  name?: string;
  type?: string;
  player_name?: string;
  country?: string;
}

interface EventItem {
  id?: string;
  name?: string;
  scheduled?: string;
  start_date?: string;
  home_team?: { name?: string; id?: string };
  away_team?: { name?: string; id?: string };
  competitors?: Array<{ name?: string; id?: string }>;
  tournament_name?: string;
  round?: string;
  status?: string;
  score?: string;
}

/**
 * Fetch ATP rankings (live or static).
 * Maps API response to our Player[] shape.
 */
export async function getATPRankings(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Player[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    if (c.fallbackToMock) {
      return { success: true, data: getMockRankings(), cached: false, source: 'freewebapi-mock' };
    }
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  try {
    const url = `${BASE_URL}${RANKINGS_PATH}/atp`;
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: c.cacheDuration ?? 3600 },
    });
    if (!res.ok) {
      if (c.fallbackToMock) {
        return { success: true, data: getMockRankings(), cached: false, source: 'freewebapi-mock' };
      }
      return {
        success: false,
        data: null,
        error: `${res.status} ${res.statusText}`,
        cached: false,
        source: 'freewebapi',
      };
    }
    const json = await res.json();
    // Handle array or wrapper like { data: [], rankings: [] }
    let data: RankingEntry[] | null = null;
    if (Array.isArray(json)) {
      data = json;
    } else if (json.rankings && Array.isArray(json.rankings)) {
      data = json.rankings;
    } else if (json.data && Array.isArray(json.data)) {
      data = json.data;
    } else if (json.results && Array.isArray(json.results)) {
      data = json.results;
    }

    if (!data || data.length === 0) {
      if (c.fallbackToMock) {
        return { success: true, data: getMockRankings(), cached: false, source: 'freewebapi-mock' };
      }
      return {
        success: false,
        data: null,
        error: 'No rankings in response',
        cached: false,
        source: 'freewebapi',
      };
    }

    const players: Player[] = data.slice(0, 100).map((entry, idx) => {
      const rank = entry.rank ?? entry.ranking ?? entry.position ?? idx + 1;
      const name =
        entry.team?.name ??
        entry.rowName ??
        entry.name ??
        entry.player_name ??
        entry.player?.name ??
        'Unknown';
      const countryObj = entry.country;
      const countryStr =
        typeof countryObj === 'string'
          ? countryObj
          : entry.team?.country?.name ?? (countryObj as { name?: string })?.name ?? entry.nationality ?? entry.country_code ?? '';
      return {
        id: String(entry.team?.id ?? entry.id ?? `fw-${rank}`),
        name: String(name).trim(),
        country: String(countryStr).trim() || 'Unknown',
        rank,
        playing_style: undefined,
      };
    });

    return { success: true, data: players, cached: false, source: 'freewebapi' };
  } catch (err: any) {
    console.warn('[FreeWebAPI] getATPRankings error:', err?.message);
    if (c.fallbackToMock) {
      return { success: true, data: getMockRankings(), cached: false, source: 'freewebapi-mock' };
    }
    return {
      success: false,
      data: null,
      error: err?.message ?? 'Unknown error',
      cached: false,
      source: 'freewebapi',
    };
  }
}

/**
 * Fetch ATP rankings with full stats (previousRanking, points, bestRanking).
 * Used for "up and coming" / rising-star logic and player deep-dives.
 */
export async function getATPRankingsWithStats(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<PlayerWithRankingStats[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    if (c.fallbackToMock) {
      const mock = getMockRankings().map((p) => ({ ...p, previousRanking: p.rank, points: 0, bestRanking: p.rank }));
      return { success: true, data: mock, cached: false, source: 'freewebapi-mock' };
    }
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}${RANKINGS_PATH}/atp`;
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: c.cacheDuration ?? 3600 },
    });
    if (!res.ok) {
      if (c.fallbackToMock) {
        const mock = getMockRankings().map((p) => ({ ...p, previousRanking: p.rank, points: 0, bestRanking: p.rank }));
        return { success: true, data: mock, cached: false, source: 'freewebapi-mock' };
      }
      return { success: false, data: null, error: `${res.status} ${res.statusText}`, cached: false, source: 'freewebapi' };
    }
    const json = await res.json();
    const data: RankingEntry[] = json.rankings ?? json.data ?? [];
    const withStats: PlayerWithRankingStats[] = data.slice(0, 100).map((entry, idx) => {
      const rank = entry.rank ?? entry.ranking ?? idx + 1;
      const name = entry.team?.name ?? entry.rowName ?? entry.name ?? 'Unknown';
      const countryObj = entry.country;
      const countryStr = typeof countryObj === 'string' ? countryObj : entry.team?.country?.name ?? (countryObj as { name?: string })?.name ?? '';
      return {
        id: String(entry.team?.id ?? entry.id ?? `fw-${rank}`),
        name: String(name).trim(),
        country: String(countryStr).trim() || 'Unknown',
        rank,
        previousRanking: entry.previousRanking,
        points: entry.points,
        bestRanking: entry.bestRanking,
        tournamentsPlayed: entry.tournamentsPlayed,
      };
    });
    return { success: true, data: withStats, cached: false, source: 'freewebapi' };
  } catch (err: any) {
    if (c.fallbackToMock) {
      const mock = getMockRankings().map((p) => ({ ...p, previousRanking: p.rank, points: 0, bestRanking: p.rank }));
      return { success: true, data: mock, cached: false, source: 'freewebapi-mock' };
    }
    return { success: false, data: null, error: err?.message ?? 'Unknown error', cached: false, source: 'freewebapi' };
  }
}

/**
 * Players who moved up in the rankings or sit in the "up and coming" band (rank 11–30).
 * Great for "Rising Star" posts when Marshall doesn't have a specific player set.
 */
export async function getRisingPlayers(
  limit: number = 5,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<PlayerWithRankingStats[]>> {
  const result = await getATPRankingsWithStats(config);
  if (!result.success || !result.data) return { ...result, data: [] };
  const rising = result.data.filter((p) => {
    const rank = p.rank ?? 999;
    const prev = p.previousRanking ?? rank;
    const movedUp = prev > rank;
    const inRisingBand = rank >= 11 && rank <= 30;
    return movedUp || inRisingBand;
  });
  return { success: true, data: rising.slice(0, limit), cached: false, source: result.source };
}

/**
 * Search for players (and optionally tournaments).
 * Used to resolve player names to IDs/details for profile and H2H.
 */
export async function searchTennis(
  term: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<SearchResultItem[]>> {
  if (!config.enabled || !term?.trim()) {
    return { success: false, data: null, error: 'Disabled or empty term', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  try {
    const params = new URLSearchParams({ term: term.trim() });
    const urlsToTry = [
      `${BASE_URL}${API_TENNIS}/search?${params}`,
      `${BASE_URL}/Search?${params}`,
      `${BASE_URL}/search?${params}`,
    ];
    for (const url of urlsToTry) {
      const res = await fetch(url, {
        headers: getHeaders(),
        next: { revalidate: config.cacheDuration ?? 3600 },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.results ?? json.data ?? json.teams ?? [];
      const items = (Array.isArray(list) ? list : []).map((item: any) => ({
        id: item.id ?? item.team?.id,
        name: item.name ?? item.team?.name ?? item.rowName,
        type: item.type,
        player_name: item.team?.name ?? item.name,
        country: typeof item.country === 'string' ? item.country : item.country?.name ?? item.team?.country?.name,
      }));
      return { success: true, data: items, cached: false, source: 'freewebapi' };
    }
    return { success: false, data: null, error: 'Search failed', cached: false, source: 'freewebapi' };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message ?? 'Unknown error',
      cached: false,
      source: 'freewebapi',
    };
  }
}

/**
 * Get player profile by name (search + first player result, or rankings match).
 */
export async function getPlayerByName(
  playerName: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Player>> {
  if (!config.enabled || !playerName?.trim()) {
    return { success: false, data: null, error: 'Disabled or empty name', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key && config.fallbackToMock) {
    const mock = findMockPlayer(playerName);
    if (mock) return { success: true, data: mock, cached: false, source: 'freewebapi-mock' };
    return { success: false, data: null, error: 'Player not in mock list', cached: false, source: 'freewebapi' };
  }
  if (!key) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  // 1) Try search
  const searchResult = await searchTennis(playerName, { ...config, fallbackToMock: false });
  if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
    const first = searchResult.data[0];
    const name = first.name ?? first.player_name ?? playerName;
    const country = first.country ?? '';
    return {
      success: true,
      data: {
        id: String(first.id ?? `fw-${name.toLowerCase().replace(/\s+/g, '-')}`),
        name: String(name).trim(),
        country: String(country).trim() || 'Unknown',
        playing_style: undefined,
      },
      cached: false,
      source: 'freewebapi',
    };
  }

  // 2) Fallback: find in rankings by name match
  const rankingsResult = await getATPRankings({ ...config, fallbackToMock: false });
  if (rankingsResult.success && rankingsResult.data) {
    const normalized = playerName.toLowerCase().trim();
    const found = rankingsResult.data.find(
      (p) => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase())
    );
    if (found) return { success: true, data: found, cached: false, source: 'freewebapi' };
  }

  if (config.fallbackToMock) {
    const mock = findMockPlayer(playerName);
    if (mock) return { success: true, data: mock, cached: false, source: 'freewebapi-mock' };
  }
  return { success: false, data: null, error: `Player not found: ${playerName}`, cached: false, source: 'freewebapi' };
}

/**
 * Event schedules for a date (YYYY-MM-DD). Returns matches we can map to Match[].
 */
export async function getEventSchedules(
  dateStr: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Match[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    if (c.fallbackToMock) {
      return { success: true, data: getMockMatches(), cached: false, source: 'freewebapi-mock' };
    }
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  try {
    const params = new URLSearchParams({ date: dateStr });
    const url = `${BASE_URL}/EventSchedules?${params}`;
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: c.cacheDuration ?? 900 },
    });
    if (!res.ok) {
      if (c.fallbackToMock) {
        return { success: true, data: getMockMatches(), cached: false, source: 'freewebapi-mock' };
      }
      return {
        success: false,
        data: null,
        error: `${res.status} ${res.statusText}`,
        cached: false,
        source: 'freewebapi',
      };
    }
    const json = await res.json();
    const rawEvents: EventItem[] = Array.isArray(json) ? json : json.events ?? json.data ?? json.results ?? [];
    const matches: Match[] = rawEvents.slice(0, 50).map((ev, i) => {
      const p1 = ev.home_team ?? ev.competitors?.[0];
      const p2 = ev.away_team ?? ev.competitors?.[1];
      const scheduled = ev.scheduled ?? ev.start_date ?? new Date().toISOString();
      return {
        id: String(ev.id ?? `ev-${i}`),
        tournament_id: 'freewebapi',
        tournament_name: ev.tournament_name ?? 'ATP',
        round: ev.round ?? 'R32',
        scheduled_time: scheduled,
        status: (ev.status === 'live' ? 'live' : ev.status === 'closed' || ev.status === 'finished' ? 'finished' : 'scheduled') as Match['status'],
        player1: {
          id: String(p1?.id ?? `p1-${i}`),
          name: String(p1?.name ?? 'Player 1').trim(),
        },
        player2: {
          id: String(p2?.id ?? `p2-${i}`),
          name: String(p2?.name ?? 'Player 2').trim(),
        },
        scoreText: typeof (ev as any).score === 'string' ? (ev as any).score : undefined,
      };
    });
    return { success: true, data: matches, cached: false, source: 'freewebapi' };
  } catch (err: any) {
    if (c.fallbackToMock) {
      return { success: true, data: getMockMatches(), cached: false, source: 'freewebapi-mock' };
    }
    return {
      success: false,
      data: null,
      error: err?.message ?? 'Unknown error',
      cached: false,
      source: 'freewebapi',
    };
  }
}

/**
 * Fetch finished match results for a tournament's final days (for recap posts).
 * Uses EventSchedules for end_date and the 2 days before; filters by tournament name and status finished/closed.
 * See: https://freewebapi.com/sports-apis/tennis-api/ (EventSchedules endpoint)
 */
export async function getTournamentResultsForRecap(
  tournamentName: string,
  endDateStr: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Match[]>> {
  const c = mergeConfig(config);
  if (!c.enabled || !tournamentName?.trim() || !endDateStr) {
    return { success: false, data: null, error: 'Disabled or missing params', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  const normalizedName = tournamentName.toLowerCase().trim();
  const days: string[] = [endDateStr];
  for (let d = 1; d <= 2; d++) {
    const d2 = new Date(endDateStr + 'T12:00:00Z');
    d2.setUTCDate(d2.getUTCDate() - d);
    days.push(d2.toISOString().split('T')[0]);
  }

  const allFinished: Match[] = [];
  const seen = new Set<string>();

  for (const dateStr of days) {
    const result = await getEventSchedules(dateStr, { ...c, fallbackToMock: false });
    if (!result.success || !result.data) continue;
    for (const m of result.data) {
      if (m.status !== 'finished' && m.status !== 'closed') continue;
      const tName = (m.tournament_name ?? '').toLowerCase();
      if (!tName.includes(normalizedName) && !normalizedName.includes(tName)) continue;
      const keyId = `${m.round}-${m.player1.name}-${m.player2.name}`;
      if (seen.has(keyId)) continue;
      seen.add(keyId);
      allFinished.push(m);
    }
  }

  const roundOrder: Record<string, number> = { F: 1, SF: 2, QF: 3, R16: 4, R32: 5, R64: 6, R128: 7 };
  allFinished.sort((a, b) => (roundOrder[a.round] ?? 99) - (roundOrder[b.round] ?? 99));

  return { success: true, data: allFinished, cached: false, source: 'freewebapi' };
}

/**
 * Head-to-head between two players (by name).
 * Uses API if available; otherwise returns mock or unknown.
 */
export async function getHeadToHeadByNames(
  player1Name: string,
  player2Name: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<{ player1Wins: number; player2Wins: number }>> {
  if (!config.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) {
    if (config.fallbackToMock) {
      return {
        success: true,
        data: { player1Wins: 5, player2Wins: 3 },
        cached: false,
        source: 'freewebapi-mock',
      };
    }
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }

  try {
    // HeadToHeadEvents or EventH2HDuel often need event ID; Search for both players and try H2H endpoint if we have IDs
    const [r1, r2] = await Promise.all([
      getPlayerByName(player1Name, { ...config, fallbackToMock: false }),
      getPlayerByName(player2Name, { ...config, fallbackToMock: false }),
    ]);
    const id1 = r1.success ? r1.data?.id : null;
    const id2 = r2.success ? r2.data?.id : null;
    if (id1 && id2) {
      const url = `${BASE_URL}/HeadToHeadEvents?player1=${id1}&player2=${id2}`;
      const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
      if (res.ok) {
        const json = await res.json();
        const events = Array.isArray(json) ? json : json.events ?? json.data ?? [];
        let p1Wins = 0;
        let p2Wins = 0;
        for (const e of events) {
          const winner = e.winner_id ?? e.winner?.id;
          if (winner === id1) p1Wins++;
          else if (winner === id2) p2Wins++;
        }
        return { success: true, data: { player1Wins: p1Wins, player2Wins: p2Wins }, cached: false, source: 'freewebapi' };
      }
    }
  } catch (_) {
    // ignore
  }
  if (config.fallbackToMock) {
    return {
      success: true,
      data: { player1Wins: 5, player2Wins: 3 },
      cached: false,
      source: 'freewebapi-mock',
    };
  }
  return { success: false, data: null, error: 'H2H not available', cached: false, source: 'freewebapi' };
}

/** Team/player details by ID (from rankings team.id). Docs: PlayerOrTeamDetails / TeamDetails */
export async function getTeamDetails(
  teamId: string | number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Record<string, unknown>>> {
  if (!config.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  const urlsToTry = [
    `${BASE_URL}${API_TENNIS}/team/${teamId}`,
    `${BASE_URL}${API_TENNIS}/team/${teamId}/details`,
    `${BASE_URL}/team/${teamId}`,
  ];
  for (const url of urlsToTry) {
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: config.cacheDuration ?? 3600 } });
    if (!res.ok) continue;
    const data = await res.json().catch(() => ({}));
    return { success: true, data: data as Record<string, unknown>, cached: false, source: 'freewebapi' };
  }
  return { success: false, data: null, error: 'Team details not found', cached: false, source: 'freewebapi' };
}

/** Last events (recent matches) for a team/player. Docs: PlayerOrTeamLastEvents / TeamLastEvents */
export async function getTeamLastEvents(
  teamId: string | number,
  limit: number = 10,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<unknown[]>> {
  if (!config.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  const key = getApiKey();
  if (!key) return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  const urlsToTry = [
    `${BASE_URL}${API_TENNIS}/team/${teamId}/events/last`,
    `${BASE_URL}${API_TENNIS}/team/${teamId}/last-events`,
    `${BASE_URL}/team/${teamId}/events/last`,
  ];
  for (const url of urlsToTry) {
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 900 } });
    if (!res.ok) continue;
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json) ? json : json.events ?? json.data ?? json.results ?? [];
    return { success: true, data: list.slice(0, limit), cached: false, source: 'freewebapi' };
  }
  return { success: false, data: null, error: 'Last events not found', cached: false, source: 'freewebapi' };
}

// --- Tennis API (tennisapi1) additional endpoints: calendar, live, category events, venues ---

/** Calendar categories for a date. Path: /api/tennis/calendar/{day}/{month}/{year}/categories */
export async function getCalendarCategories(
  day: number,
  month: number,
  year: number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<{ categories?: unknown[] }>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  if (!getApiKey()) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}/api/tennis/calendar/${day}/${month}/${year}/categories`;
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: c.cacheDuration ?? 900 } });
    if (!res.ok) return { success: false, data: null, error: `${res.status}`, cached: false, source: 'freewebapi' };
    const json = await res.json().catch(() => ({}));
    const categories = (json as { categories?: unknown[] }).categories ?? [];
    return { success: true, data: { categories }, cached: false, source: 'freewebapi' };
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Request failed', cached: false, source: 'freewebapi' };
  }
}

/** Live events. Path: /api/tennis/events/live */
export async function getLiveEvents(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<unknown[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  if (!getApiKey()) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}/api/tennis/events/live`;
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 60 } });
    if (!res.ok) return { success: false, data: null, error: `${res.status}`, cached: false, source: 'freewebapi' };
    const json = await res.json().catch(() => ({}));
    const events = (json as { events?: unknown[] }).events ?? [];
    return { success: true, data: Array.isArray(events) ? events : [], cached: false, source: 'freewebapi' };
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Request failed', cached: false, source: 'freewebapi' };
  }
}

/** Events for a category on a date. Path: /api/tennis/category/{categoryId}/events/{day}/{month}/{year} */
export async function getCategoryEvents(
  categoryId: string | number,
  day: number,
  month: number,
  year: number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<unknown[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  if (!getApiKey()) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}/api/tennis/category/${categoryId}/events/${day}/${month}/${year}`;
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: c.cacheDuration ?? 900 } });
    if (!res.ok) return { success: false, data: null, error: `${res.status}`, cached: false, source: 'freewebapi' };
    const json = await res.json().catch(() => ({}));
    const events = (json as { events?: unknown[] }).events ?? [];
    return { success: true, data: Array.isArray(events) ? events : [], cached: false, source: 'freewebapi' };
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Request failed', cached: false, source: 'freewebapi' };
  }
}

/** Tournament schedule for a date. Path: /api/tennis/tournament/{tournamentId}/schedules/{day}/{month}/{year} */
export async function getTournamentSchedules(
  tournamentId: string | number,
  day: number,
  month: number,
  year: number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<unknown[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  if (!getApiKey()) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}/api/tennis/tournament/${tournamentId}/schedules/${day}/${month}/${year}`;
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: c.cacheDuration ?? 900 } });
    if (!res.ok) return { success: false, data: null, error: `${res.status}`, cached: false, source: 'freewebapi' };
    const json = await res.json().catch(() => ({}));
    const events = (json as { events?: unknown[] }).events ?? [];
    return { success: true, data: Array.isArray(events) ? events : [], cached: false, source: 'freewebapi' };
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Request failed', cached: false, source: 'freewebapi' };
  }
}

/** Tournament venues. Path: /api/tennis/tournament/{tournamentId}/season/{seasonId}/venues */
export async function getTournamentVenues(
  tournamentId: string | number,
  seasonId: string | number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<unknown[]>> {
  const c = mergeConfig(config);
  if (!c.enabled) {
    return { success: false, data: null, error: 'FreeWebAPI disabled', cached: false, source: 'freewebapi' };
  }
  if (!getApiKey()) {
    return { success: false, data: null, error: 'RAPIDAPI_KEY not set', cached: false, source: 'freewebapi' };
  }
  try {
    const url = `${BASE_URL}/api/tennis/tournament/${tournamentId}/season/${seasonId}/venues`;
    const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 86400 } });
    if (!res.ok) return { success: false, data: null, error: `${res.status}`, cached: false, source: 'freewebapi' };
    const json = await res.json().catch(() => ({}));
    const venues = (json as { venues?: unknown[] }).venues ?? [];
    return { success: true, data: Array.isArray(venues) ? venues : [], cached: false, source: 'freewebapi' };
  } catch (err: unknown) {
    return { success: false, data: null, error: err instanceof Error ? err.message : 'Request failed', cached: false, source: 'freewebapi' };
  }
}

// --- Mock data (fallback when API key missing or request fails) ---
function getMockRankings(): Player[] {
  return [
    { id: 'player-1', name: 'Carlos Alcaraz', country: 'Spain', rank: 1, playing_style: 'Aggressive baseliner' },
    { id: 'player-2', name: 'Novak Djokovic', country: 'Serbia', rank: 2, playing_style: 'Defensive baseliner' },
    { id: 'player-3', name: 'Jannik Sinner', country: 'Italy', rank: 3, playing_style: 'Aggressive baseliner' },
    { id: 'player-4', name: 'Daniil Medvedev', country: 'Russia', rank: 4 },
    { id: 'player-5', name: 'Andrey Rublev', country: 'Russia', rank: 5 },
  ];
}

function findMockPlayer(name: string): Player | null {
  const rankings = getMockRankings();
  const lower = name.toLowerCase();
  const found = rankings.find(
    (p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
  );
  return found ?? null;
}

function getMockMatches(): Match[] {
  return [
    {
      id: 'mock-1',
      tournament_id: 'mock-t',
      tournament_name: 'Australian Open',
      round: 'F',
      scheduled_time: new Date().toISOString(),
      status: 'scheduled',
      player1: { id: 'p1', name: 'Carlos Alcaraz', rank: 1, seed: 1 },
      player2: { id: 'p2', name: 'Novak Djokovic', rank: 2, seed: 2 },
    },
  ];
}
