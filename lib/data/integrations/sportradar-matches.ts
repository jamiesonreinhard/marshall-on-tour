/**
 * Match Data Integration
 *
 * Prefers FreeWebAPI (RapidAPI tennis) for today's matches when RAPIDAPI_KEY is set.
 * Falls back to Sportradar when configured, then mock.
 */

import { Match, DataSourceResult, DataSourceConfig } from './types';
import { getATPTournaments } from '../sportradar';
import { getEventSchedules, isFreeWebApiConfigured } from './freewebapi';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 900, // 15 minutes (matches change frequently)
  fallbackToMock: true,
};

const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';

/**
 * Get matches for an active tournament
 */
export async function getTournamentMatches(
  tournamentId: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Match[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Sportradar match integration is disabled',
      cached: false,
      source: 'sportradar-matches',
    };
  }
  
  const apiKey = process.env.SPORTRADAR_API_KEY;
  
  if (!apiKey) {
    console.warn('SPORTRADAR_API_KEY not set. Using mock data.');
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockMatches(tournamentId),
        cached: false,
        source: 'sportradar-matches-mock',
      };
    }
    return {
      success: false,
      data: null,
      error: 'SPORTRADAR_API_KEY not set',
      cached: false,
      source: 'sportradar-matches',
    };
  }
  
  try {
    // TODO: Implement actual Sportradar API call for matches
    // The endpoint structure will depend on Sportradar API v3 documentation
    // Example: /competitions/{id}/matches.json
    
    // For now, return mock data
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockMatches(tournamentId),
        cached: false,
        source: 'sportradar-matches-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Match data API not fully implemented yet',
      cached: false,
      source: 'sportradar-matches',
    };
  } catch (error: any) {
    console.error('Error fetching tournament matches:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockMatches(tournamentId),
        cached: false,
        source: 'sportradar-matches-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'sportradar-matches',
    };
  }
}

/**
 * Get today's matches. Uses FreeWebAPI (RapidAPI) when RAPIDAPI_KEY is set; otherwise Sportradar or mock.
 */
export async function getTodaysMatches(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Match[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Match integration is disabled',
      cached: false,
      source: 'sportradar-matches',
    };
  }

  const today = new Date().toISOString().split('T')[0];

  if (isFreeWebApiConfigured()) {
    const result = await getEventSchedules(today, { ...config, fallbackToMock: false });
    if (result.success && result.data) {
      return { success: true, data: result.data, cached: false, source: 'freewebapi' };
    }
    if (config.fallbackToMock) {
      return { success: true, data: getMockMatches(), cached: false, source: 'sportradar-matches-mock' };
    }
  }

  try {
    const tournaments = await getATPTournaments();
    const activeTournaments = tournaments.filter((t) => {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      const todayDate = new Date(today);
      return start <= todayDate && end >= todayDate;
    });

    const allMatches: Match[] = [];
    for (const tournament of activeTournaments) {
      const result = await getTournamentMatches(tournament.id, config);
      if (result.success && result.data) {
        const todayMatches = result.data.filter((match) => {
          const matchDate = new Date(match.scheduled_time).toISOString().split('T')[0];
          return matchDate === today;
        });
        allMatches.push(...todayMatches);
      }
    }

    return {
      success: true,
      data: allMatches,
      cached: false,
      source: 'sportradar-matches',
    };
  } catch (error: any) {
    if (config.fallbackToMock) {
      return { success: true, data: getMockMatches(), cached: false, source: 'sportradar-matches-mock' };
    }
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'sportradar-matches',
    };
  }
}

/**
 * Detect if a match is a "big match" (finals, semis, top player matchup)
 */
export function isBigMatch(match: Match): boolean {
  // Finals and semis are always big
  if (match.round === 'F' || match.round === 'SF') {
    return true;
  }
  
  // Top 10 player matchups
  const top10Ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const hasTop10 = 
    (match.player1.rank && top10Ranks.includes(match.player1.rank)) ||
    (match.player2.rank && top10Ranks.includes(match.player2.rank));
  
  if (hasTop10 && match.player1.rank && match.player2.rank) {
    // Both players in top 10 = big match
    if (top10Ranks.includes(match.player1.rank) && top10Ranks.includes(match.player2.rank)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Mock matches (fallback)
 */
function getMockMatches(tournamentId?: string): Match[] {
  return [
    {
      id: 'mock-match-1',
      tournament_id: tournamentId || 'mock-tournament',
      tournament_name: 'Australian Open',
      round: 'F',
      scheduled_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      status: 'scheduled',
      player1: {
        id: 'player-1',
        name: 'Carlos Alcaraz',
        rank: 1,
        seed: 1,
      },
      player2: {
        id: 'player-2',
        name: 'Novak Djokovic',
        rank: 2,
        seed: 2,
      },
    },
    {
      id: 'mock-match-2',
      tournament_id: tournamentId || 'mock-tournament',
      tournament_name: 'Australian Open',
      round: 'SF',
      scheduled_time: new Date().toISOString(),
      status: 'live',
      player1: {
        id: 'player-3',
        name: 'Jannik Sinner',
        rank: 3,
        seed: 3,
      },
      player2: {
        id: 'player-4',
        name: 'Daniil Medvedev',
        rank: 4,
        seed: 4,
      },
      score: {
        sets: [
          { player1: 6, player2: 4 },
          { player1: 3, player2: 6 },
        ],
        current_set: 3,
      },
    },
  ];
}
