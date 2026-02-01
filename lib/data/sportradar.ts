/**
 * Sportradar API Integration
 * 
 * Documentation: https://developer.sportradar.com/docs/read/tennis/Tennis_v2
 * 
 * Note: Sportradar has different API versions. This uses the Tennis v3 API.
 * 
 * TRIAL MODE: This integration is designed to work with a trial subscription
 * (1,000 quota, expires 03/02/2026). When quota is exhausted or trial expires,
 * the system automatically falls back to comprehensive mock data.
 * 
 * To force mock data mode (e.g., to preserve quota), set USE_MOCK_DATA=true
 * in your environment variables.
 */

const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';

// Check if we should force mock data mode
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Types for Sportradar responses
export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: {
    city: string;
    country: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export interface Match {
  id: string;
  scheduled: string;
  status: string;
  tournament: {
    id: string;
    name: string;
  };
  competitors: Array<{
    id: string;
    name: string;
    seed?: number;
  }>;
  scores?: Array<{
    home_score: number;
    away_score: number;
  }>;
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  ranking?: number;
}

/**
 * Fetch ATP tournament schedule
 * 
 * Automatically falls back to mock data if:
 * - USE_MOCK_DATA=true is set
 * - API key is missing
 * - API returns 429 (quota exhausted)
 * - API returns 401/403 (auth failed)
 * - Any other API error occurs
 */
export async function getATPTournaments(year?: number): Promise<Tournament[]> {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  
  // Force mock data mode if flag is set (to preserve quota)
  if (USE_MOCK_DATA) {
    console.log('USE_MOCK_DATA=true - Using mock data to preserve quota');
    return getMockTournaments();
  }
  
  if (!apiKey) {
    console.warn('SPORTRADAR_API_KEY not set. Using mock data.');
    return getMockTournaments();
  }

  console.log('Using Sportradar API key (length:', apiKey.length, ')');
  
  const currentYear = year || new Date().getFullYear();
  
  // Sportradar Tennis API v3 endpoint structure
  // Documentation: https://developer.sportradar.com/tennis/reference/overview
  // The v3 API uses /competitions endpoint, not /tournaments
  const url = `${SPORTRADAR_BASE_URL}/competitions.json?api_key=${apiKey}`;
  
  console.log('Fetching from Sportradar:', url.replace(apiKey, '***'));

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour to preserve quota
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Sportradar API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sportradar API error:', response.status, response.statusText);
      
      // Handle quota exhaustion (429 Too Many Requests)
      if (response.status === 429) {
        console.warn('⚠️  Quota exhausted (429). Falling back to mock data.');
        console.warn('💡 To preserve quota, set USE_MOCK_DATA=true in your .env.local');
        return getMockTournaments();
      }
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('API key authentication failed. Check your SPORTRADAR_API_KEY.');
        console.warn('Falling back to mock data.');
        return getMockTournaments();
      }
      
      // Any other error - fall back to mock data
      console.warn('API error. Falling back to mock data.');
      return getMockTournaments();
    }

    const data = await response.json();
    console.log('✅ Sportradar API success. Response structure:', Object.keys(data));
    
    // Handle v3 API response structure
    // v3 API returns competitions, not tournaments
    let competitions = data.competitions || data.tournaments || data.schedule || data.results || [];
    console.log('Found', competitions.length, 'competitions in response');
    
    // Filter for ATP competitions and current/upcoming year
    competitions = competitions.filter((c: any) => {
      // Check if it's an ATP competition
      const isATP = c.category?.id === 'atp' || 
                   c.category?.name?.toLowerCase().includes('atp') ||
                   c.name?.toLowerCase().includes('atp') ||
                   c.type === 'atp' ||
                   c.competition_type === 'atp';
      
      if (!isATP) return false;
      
      // Check year
      const startDate = new Date(c.start_date || c.start || c.scheduled);
      return startDate.getFullYear() === currentYear || startDate.getFullYear() === currentYear + 1;
    });

    console.log('Filtered to', competitions.length, 'ATP competitions for year', currentYear);

    if (competitions.length > 0) {
      console.log('✅ Using real Sportradar data');
      return competitions.map((c: any) => ({
        id: c.id || c.competition_id || c.tournament_id,
        name: c.name || c.competition_name || c.tournament_name,
        start_date: c.start_date || c.start || c.scheduled,
        end_date: c.end_date || c.end || c.scheduled_end,
        location: {
          city: c.location?.city || c.venue?.city || c.city || '',
          country: c.location?.country || c.venue?.country || c.country || '',
        },
        category: {
          id: c.category?.id || c.category_id || '',
          name: c.category?.name || c.category_name || '',
        },
      }));
    } else {
      console.warn('No ATP competitions found for year', currentYear, '- using mock data');
      return getMockTournaments();
    }
  } catch (error: any) {
    console.error('Error fetching tournaments from Sportradar:', error.message);
    console.warn('Falling back to mock data.');
    return getMockTournaments();
  }
}

/**
 * Get upcoming tournaments (next 30 days)
 */
export async function getUpcomingTournaments(): Promise<Tournament[]> {
  const tournaments = await getATPTournaments();
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return tournaments.filter((tournament) => {
    const startDate = new Date(tournament.start_date);
    return startDate >= now && startDate <= thirtyDaysFromNow;
  });
}

/**
 * Get current/active tournaments
 */
export async function getCurrentTournaments(): Promise<Tournament[]> {
  const tournaments = await getATPTournaments();
  const now = new Date();

  return tournaments.filter((tournament) => {
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    return startDate <= now && endDate >= now;
  });
}

/**
 * Fetch match results for a tournament
 */
export async function getTournamentMatches(tournamentId: string): Promise<Match[]> {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  
  if (USE_MOCK_DATA || !apiKey) {
    return getMockMatches();
  }

  const url = `${SPORTRADAR_BASE_URL}/tournaments/${tournamentId}/matches.json?api_key=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes (matches change frequently)
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('⚠️  Quota exhausted. Using mock match data.');
      }
      return getMockMatches();
    }

    const data = await response.json();
    return data.matches?.map((m: any) => ({
      id: m.id,
      scheduled: m.scheduled,
      status: m.status,
      tournament: {
        id: m.tournament?.id || tournamentId,
        name: m.tournament?.name || '',
      },
      competitors: m.competitors?.map((c: any) => ({
        id: c.id,
        name: c.name,
        seed: c.seed,
      })) || [],
      scores: m.scores,
    })) || [];
  } catch (error) {
    console.error('Error fetching matches:', error);
    return getMockMatches();
  }
}

/**
 * Get ATP player rankings
 */
export async function getATPRankings(): Promise<Player[]> {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  
  if (USE_MOCK_DATA || !apiKey) {
    return getMockRankings();
  }

  const url = `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('⚠️  Quota exhausted. Using mock rankings.');
      }
      return getMockRankings();
    }

    const data = await response.json();
    return data.players?.map((p: any) => ({
      id: p.id,
      name: p.name,
      nationality: p.nationality || '',
      ranking: p.rank,
    })) || [];
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return getMockRankings();
  }
}

// ============================================================================
// Mock Data (fallback when API key is not set, quota exhausted, or API fails)
// ============================================================================
// Comprehensive mock data for 2026 ATP season to enable development without API

function getMockTournaments(): Tournament[] {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  // Generate a full 2026 ATP calendar with major tournaments
  return [
    // Grand Slams
    {
      id: 'mock-ao-2026',
      name: 'Australian Open',
      start_date: `${nextYear}-01-19`,
      end_date: `${nextYear}-02-01`,
      location: { city: 'Melbourne', country: 'Australia' },
      category: { id: 'atp', name: 'Grand Slam' },
    },
    {
      id: 'mock-fo-2026',
      name: 'French Open',
      start_date: `${nextYear}-05-24`,
      end_date: `${nextYear}-06-07`,
      location: { city: 'Paris', country: 'France' },
      category: { id: 'atp', name: 'Grand Slam' },
    },
    {
      id: 'mock-wimbledon-2026',
      name: 'Wimbledon',
      start_date: `${nextYear}-06-29`,
      end_date: `${nextYear}-07-12`,
      location: { city: 'London', country: 'United Kingdom' },
      category: { id: 'atp', name: 'Grand Slam' },
    },
    {
      id: 'mock-usopen-2026',
      name: 'US Open',
      start_date: `${nextYear}-08-31`,
      end_date: `${nextYear}-09-13`,
      location: { city: 'New York', country: 'USA' },
      category: { id: 'atp', name: 'Grand Slam' },
    },
    // ATP 1000 Masters
    {
      id: 'mock-indian-wells-2026',
      name: 'BNP Paribas Open',
      start_date: `${nextYear}-03-04`,
      end_date: `${nextYear}-03-16`,
      location: { city: 'Indian Wells', country: 'USA' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-miami-2026',
      name: 'Miami Open',
      start_date: `${nextYear}-03-18`,
      end_date: `${nextYear}-03-30`,
      location: { city: 'Miami', country: 'USA' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-montecarlo-2026',
      name: 'Monte-Carlo Masters',
      start_date: `${nextYear}-04-12`,
      end_date: `${nextYear}-04-19`,
      location: { city: 'Monte Carlo', country: 'Monaco' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-madrid-2026',
      name: 'Madrid Open',
      start_date: `${nextYear}-04-26`,
      end_date: `${nextYear}-05-03`,
      location: { city: 'Madrid', country: 'Spain' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-rome-2026',
      name: 'Italian Open',
      start_date: `${nextYear}-05-10`,
      end_date: `${nextYear}-05-17`,
      location: { city: 'Rome', country: 'Italy' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-canada-2026',
      name: 'National Bank Open',
      start_date: `${nextYear}-08-03`,
      end_date: `${nextYear}-08-09`,
      location: { city: 'Toronto', country: 'Canada' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-cincinnati-2026',
      name: 'Western & Southern Open',
      start_date: `${nextYear}-08-17`,
      end_date: `${nextYear}-08-23`,
      location: { city: 'Cincinnati', country: 'USA' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-shanghai-2026',
      name: 'Shanghai Masters',
      start_date: `${nextYear}-10-05`,
      end_date: `${nextYear}-10-11`,
      location: { city: 'Shanghai', country: 'China' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    {
      id: 'mock-paris-2026',
      name: 'Paris Masters',
      start_date: `${nextYear}-10-26`,
      end_date: `${nextYear}-11-01`,
      location: { city: 'Paris', country: 'France' },
      category: { id: 'atp', name: 'ATP 1000' },
    },
    // ATP 500
    {
      id: 'mock-rotterdam-2026',
      name: 'ABN AMRO Open',
      start_date: `${nextYear}-02-09`,
      end_date: `${nextYear}-02-15`,
      location: { city: 'Rotterdam', country: 'Netherlands' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-dubai-2026',
      name: 'Dubai Tennis Championships',
      start_date: `${nextYear}-02-23`,
      end_date: `${nextYear}-03-01`,
      location: { city: 'Dubai', country: 'UAE' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-barcelona-2026',
      name: 'Barcelona Open',
      start_date: `${nextYear}-04-19`,
      end_date: `${nextYear}-04-25`,
      location: { city: 'Barcelona', country: 'Spain' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-hamburg-2026',
      name: 'Hamburg European Open',
      start_date: `${nextYear}-07-20`,
      end_date: `${nextYear}-07-26`,
      location: { city: 'Hamburg', country: 'Germany' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-washington-2026',
      name: 'Citi Open',
      start_date: `${nextYear}-07-27`,
      end_date: `${nextYear}-08-02`,
      location: { city: 'Washington', country: 'USA' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-beijing-2026',
      name: 'China Open',
      start_date: `${nextYear}-09-28`,
      end_date: `${nextYear}-10-04`,
      location: { city: 'Beijing', country: 'China' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-vienna-2026',
      name: 'Erste Bank Open',
      start_date: `${nextYear}-10-19`,
      end_date: `${nextYear}-10-25`,
      location: { city: 'Vienna', country: 'Austria' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    {
      id: 'mock-basel-2026',
      name: 'Swiss Indoors',
      start_date: `${nextYear}-10-19`,
      end_date: `${nextYear}-10-25`,
      location: { city: 'Basel', country: 'Switzerland' },
      category: { id: 'atp', name: 'ATP 500' },
    },
    // ATP Finals
    {
      id: 'mock-atp-finals-2026',
      name: 'ATP Finals',
      start_date: `${nextYear}-11-15`,
      end_date: `${nextYear}-11-22`,
      location: { city: 'Turin', country: 'Italy' },
      category: { id: 'atp', name: 'ATP Finals' },
    },
  ].filter(t => {
    // Only include tournaments in current or next year
    const startDate = new Date(t.start_date);
    return startDate.getFullYear() === currentYear || startDate.getFullYear() === nextYear;
  });
}

function getMockMatches(): Match[] {
  return [
    {
      id: 'mock-match-1',
      scheduled: new Date().toISOString(),
      status: 'closed',
      tournament: { id: 'mock-ao-2026', name: 'Australian Open' },
      competitors: [
        { id: 'player-1', name: 'Carlos Alcaraz', seed: 1 },
        { id: 'player-2', name: 'Novak Djokovic', seed: 2 },
      ],
      scores: [{ home_score: 6, away_score: 4 }],
    },
  ];
}

function getMockRankings(): Player[] {
  return [
    { id: 'player-1', name: 'Carlos Alcaraz', nationality: 'ESP', ranking: 1 },
    { id: 'player-2', name: 'Novak Djokovic', nationality: 'SRB', ranking: 2 },
    { id: 'player-3', name: 'Jannik Sinner', nationality: 'ITA', ranking: 3 },
  ];
}
