/**
 * Sportradar API Integration
 * 
 * Documentation: https://developer.sportradar.com/docs/read/tennis/Tennis_v2
 * 
 * Note: Sportradar has different API versions. This uses the Tennis v2 API.
 * You may need to adjust endpoints based on your Sportradar subscription tier.
 */

const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/tennis/trial/v3/en';
const API_KEY = process.env.SPORTRADAR_API_KEY;

if (!API_KEY) {
  console.warn('SPORTRADAR_API_KEY not set. Using mock data.');
}

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
 */
export async function getATPTournaments(year?: number): Promise<Tournament[]> {
  if (!API_KEY) {
    return getMockTournaments();
  }

  const currentYear = year || new Date().getFullYear();
  const url = `${SPORTRADAR_BASE_URL}/tournaments.json?api_key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Sportradar API error:', response.statusText);
      return getMockTournaments();
    }

    const data = await response.json();
    // Filter for ATP tournaments and current/upcoming year
    const tournaments = data.tournaments?.filter((t: any) => {
      const startDate = new Date(t.start_date);
      return startDate.getFullYear() === currentYear || startDate.getFullYear() === currentYear + 1;
    }) || [];

    return tournaments.map((t: any) => ({
      id: t.id,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      location: {
        city: t.location?.city || '',
        country: t.location?.country || '',
      },
      category: {
        id: t.category?.id || '',
        name: t.category?.name || '',
      },
    }));
  } catch (error) {
    console.error('Error fetching tournaments:', error);
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
  if (!API_KEY) {
    return getMockMatches();
  }

  const url = `${SPORTRADAR_BASE_URL}/tournaments/${tournamentId}/matches.json?api_key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes (matches change frequently)
    });

    if (!response.ok) {
      console.error('Sportradar API error:', response.statusText);
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
  if (!API_KEY) {
    return getMockRankings();
  }

  const url = `${SPORTRADAR_BASE_URL}/rankings.json?api_key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Sportradar API error:', response.statusText);
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
// Mock Data (fallback when API key is not set or API fails)
// ============================================================================

function getMockTournaments(): Tournament[] {
  return [
    {
      id: 'mock-ao-2026',
      name: 'Australian Open',
      start_date: '2026-01-19',
      end_date: '2026-02-01',
      location: { city: 'Melbourne', country: 'Australia' },
      category: { id: 'atp', name: 'ATP' },
    },
    {
      id: 'mock-indian-wells-2026',
      name: 'BNP Paribas Open',
      start_date: '2026-03-04',
      end_date: '2026-03-16',
      location: { city: 'Indian Wells', country: 'USA' },
      category: { id: 'atp', name: 'ATP' },
    },
  ];
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
