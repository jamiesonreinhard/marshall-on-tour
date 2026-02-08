/**
 * Player Data Integration
 *
 * Fetches player rankings, profiles, and statistics.
 * Primary source: FreeWebAPI (RapidAPI tennisapi1) when RAPIDAPI_KEY is set.
 * Fallback: mock data for development.
 */

import { Player, DataSourceResult, DataSourceConfig } from './types';
import {
  isFreeWebApiConfigured,
  getATPRankings as getFreeWebApiRankings,
  getPlayerByName as getFreeWebApiPlayerByName,
  getHeadToHeadByNames as getFreeWebApiHeadToHead,
} from './freewebapi';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 3600, // 1 hour (rankings change weekly)
  fallbackToMock: true,
};

/**
 * Get player rankings (ATP Top 100).
 * Uses FreeWebAPI when RAPIDAPI_KEY (or FREEWEBAPI_RAPIDAPI_KEY) is set.
 */
export async function getPlayerRankings(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Player[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Player data integration is disabled',
      cached: false,
      source: 'player-data',
    };
  }

  if (isFreeWebApiConfigured()) {
    const result = await getFreeWebApiRankings(config);
    if (result.success && result.data && result.data.length > 0) {
      return result;
    }
    // API failed; fall through to mock if allowed
  }

  if (config.fallbackToMock) {
    return {
      success: true,
      data: getMockRankings(),
      cached: false,
      source: 'player-data-mock',
    };
  }

  return {
    success: false,
    data: null,
    error: 'Player data API not available (set RAPIDAPI_KEY for FreeWebAPI)',
    cached: false,
    source: 'player-data',
  };
}

/**
 * Get player profile by name.
 * Uses FreeWebAPI search/rankings when RAPIDAPI_KEY is set.
 */
export async function getPlayerProfile(
  playerName: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<Player>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Player data integration is disabled',
      cached: false,
      source: 'player-data',
    };
  }

  if (isFreeWebApiConfigured()) {
    const result = await getFreeWebApiPlayerByName(playerName, config);
    if (result.success && result.data) return result;
  }

  if (config.fallbackToMock) {
    const rankings = getMockRankings();
    const player = rankings.find((p) =>
      p.name.toLowerCase().includes(playerName.toLowerCase())
    );
    if (player) {
      return {
        success: true,
        data: player,
        cached: false,
        source: 'player-data-mock',
      };
    }
  }

  return {
    success: false,
    data: null,
    error: `Player "${playerName}" not found`,
    cached: false,
    source: 'player-data',
  };
}

/**
 * Get head-to-head record between two players.
 * Uses FreeWebAPI when RAPIDAPI_KEY is set.
 */
export async function getHeadToHead(
  player1Name: string,
  player2Name: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<{ player1Wins: number; player2Wins: number }>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Player data integration is disabled',
      cached: false,
      source: 'player-data',
    };
  }

  if (isFreeWebApiConfigured()) {
    const result = await getFreeWebApiHeadToHead(player1Name, player2Name, config);
    if (result.success && result.data) return result;
  }

  if (config.fallbackToMock) {
    return {
      success: true,
      data: { player1Wins: 5, player2Wins: 3 },
      cached: false,
      source: 'player-data-mock',
    };
  }

  return {
    success: false,
    data: null,
    error: 'Head-to-head data not available',
    cached: false,
    source: 'player-data',
  };
}

/**
 * Mock rankings (fallback)
 */
function getMockRankings(): Player[] {
  return [
    {
      id: 'player-1',
      name: 'Carlos Alcaraz',
      country: 'Spain',
      rank: 1,
      age: 21,
      playing_style: 'Aggressive baseliner',
    },
    {
      id: 'player-2',
      name: 'Novak Djokovic',
      country: 'Serbia',
      rank: 2,
      age: 37,
      playing_style: 'Defensive baseliner',
    },
    {
      id: 'player-3',
      name: 'Jannik Sinner',
      country: 'Italy',
      rank: 3,
      age: 22,
      playing_style: 'Aggressive baseliner',
    },
    {
      id: 'player-4',
      name: 'Daniil Medvedev',
      country: 'Russia',
      rank: 4,
      age: 28,
      playing_style: 'Defensive baseliner',
    },
    {
      id: 'player-5',
      name: 'Andrey Rublev',
      country: 'Russia',
      rank: 5,
      age: 26,
      playing_style: 'Aggressive baseliner',
    },
  ];
}
