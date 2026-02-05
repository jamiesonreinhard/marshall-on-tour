/**
 * Historical Player Data Integration
 * 
 * Provides data about historical tennis players for nostalgia posts
 * Sources: JSON file, Wikipedia (future), Grokpedia (future)
 */

import { DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 86400 * 7, // 7 days (historical data doesn't change)
  fallbackToMock: true,
};

export interface HistoricalPlayer {
  name: string;
  fullName?: string;
  era: string; // e.g., "1980s-1990s", "2000s", "2010s"
  country: string;
  activeYears: string; // e.g., "1980-1995"
  grandSlams: number;
  atpTitles?: number;
  highestRanking: number;
  playingStyle: string;
  notableAchievements: string[];
  careerHighlights: string[];
  rivalries?: string[];
  retirementYear?: number;
  wikipediaUrl?: string;
}

/**
 * Get historical player data
 */
export async function getHistoricalPlayerData(
  playerName: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<HistoricalPlayer>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Historical player data integration is disabled',
      cached: false,
      source: 'historical-players',
    };
  }
  
  try {
    // Try to load from JSON file
    const historicalData = await loadHistoricalPlayersData();
    const playerLower = playerName.toLowerCase();
    
    const player = historicalData.find(p => 
      p.name.toLowerCase() === playerLower ||
      p.fullName?.toLowerCase().includes(playerLower)
    );
    
    if (player) {
      return {
        success: true,
        data: player,
        cached: false,
        source: 'historical-players-json',
      };
    }
    
    // Not found in JSON, return error
    if (config.fallbackToMock) {
      // Return basic structure
      return {
        success: true,
        data: {
          name: playerName,
          era: 'Unknown',
          country: 'Unknown',
          activeYears: 'Unknown',
          grandSlams: 0,
          highestRanking: 0,
          playingStyle: 'Unknown',
          notableAchievements: [],
          careerHighlights: [],
        },
        cached: false,
        source: 'historical-players-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: `Historical player "${playerName}" not found`,
      cached: false,
      source: 'historical-players',
    };
  } catch (error: any) {
    console.error('Error loading historical player data:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: {
          name: playerName,
          era: 'Unknown',
          country: 'Unknown',
          activeYears: 'Unknown',
          grandSlams: 0,
          highestRanking: 0,
          playingStyle: 'Unknown',
          notableAchievements: [],
          careerHighlights: [],
        },
        cached: false,
        source: 'historical-players-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'historical-players',
    };
  }
}

/**
 * Load historical players data from JSON file
 */
async function loadHistoricalPlayersData(): Promise<HistoricalPlayer[]> {
  try {
    // In Next.js, we can use dynamic import for JSON
    // But for server-side, we'll use fs in Node.js environment
    if (typeof window === 'undefined') {
      // Server-side: use fs
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'lib', 'data', 'historical-players.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } else {
      // Client-side: fetch
      const response = await fetch('/api/data/historical-players');
      if (response.ok) {
        return await response.json();
      }
      return [];
    }
  } catch (error) {
    // File doesn't exist yet, return empty array
    console.warn('Historical players JSON file not found, using empty data');
    return [];
  }
}
