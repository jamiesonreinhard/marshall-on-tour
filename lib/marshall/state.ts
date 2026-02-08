/**
 * Marshall's Current State Management
 * 
 * Tracks Marshall's current gear, location, preferences for authentic content generation
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface MarshallState {
  id: string;
  current_racket?: string;
  current_racket_affiliate_link?: string;
  current_shoes?: string;
  current_shoes_affiliate_link?: string;
  other_gear?: Record<string, any>;
  current_city?: string;
  current_country?: string;
  /** The one tournament Marshall is currently at; location derives from it. Updated only on arrival/departure. */
  current_tournament_id?: string;
  current_hotel?: string;
  current_hotel_affiliate_link?: string;
  current_coffee_shop?: string;
  arrived_at?: string;
  leaving_at?: string;
  next_city?: string;
  next_country?: string;
  next_tournament_id?: string;
  traveling_to_at?: string;
  favorite_players?: string[];
  up_and_coming_player_watching?: string;
  favorite_tournaments?: string[];
  current_interests?: string[];
  updated_at: string;
  updated_by: string;
  notes?: string;
}

/**
 * Get Marshall's current state (singleton - only one row)
 */
export async function getMarshallState(): Promise<MarshallState | null> {
  const supabase = createAdminSupabase();
  
  const { data, error } = await supabase
    .from('marshall_state')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching Marshall state:', error);
    return null;
  }
  
  return data;
}

/**
 * Update Marshall's state
 */
export async function updateMarshallState(
  updates: Partial<MarshallState>,
  updatedBy: 'system' | 'manual' = 'system'
): Promise<MarshallState | null> {
  const supabase = createAdminSupabase();
  
  // Get current state first
  const current = await getMarshallState();
  
  if (!current) {
    // Filter out undefined values (Supabase doesn't accept undefined)
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<MarshallState>;
    
    // Create initial state if it doesn't exist
    const { data, error } = await supabase
      .from('marshall_state')
      .insert({
        ...cleanUpdates,
        updated_by: updatedBy,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating Marshall state:', error);
      return null;
    }
    
    return data;
  }
  
  // Filter out undefined values (Supabase doesn't accept undefined)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  ) as Partial<MarshallState>;
  
  // Update existing state
  const { data, error } = await supabase
    .from('marshall_state')
    .update({
      ...cleanUpdates,
      updated_by: updatedBy,
    })
    .eq('id', current.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating Marshall state:', error);
    return null;
  }
  
  return data;
}

/**
 * Update Marshall's location when he arrives at a tournament.
 * Only updates when this tournament is his next_tournament_id (or we're initializing with no current).
 */
export async function updateLocationForTournament(
  tournamentId: string,
  tournamentName: string
): Promise<boolean> {
  const current = await getMarshallState();
  // Only update when this tournament is his designated next, or we have no current (initialization)
  if (current?.next_tournament_id && current.next_tournament_id !== tournamentId) {
    return false;
  }
  if (current?.current_tournament_id && current.current_tournament_id !== tournamentId) {
    // Already at a different tournament; don't overwrite
    return false;
  }

  const supabase = createAdminSupabase();
  const { data: tournament } = await supabase
    .from('atp_calendar')
    .select('name, location, start_date, end_date')
    .eq('id', tournamentId)
    .single();

  if (!tournament) return false;

  const location = tournament.location as { city?: string; country?: string };

  const updates: Partial<MarshallState> = {
    current_tournament_id: tournamentId,
    current_city: location.city,
    current_country: location.country,
    arrived_at: new Date().toISOString(),
    next_tournament_id: undefined,
  };

  if (tournament.end_date) {
    updates.leaving_at = new Date(tournament.end_date).toISOString();
  }

  await updateMarshallState(updates, 'system');
  return true;
}

/** European countries for "prefer Europe when choosing next/current tournament" (same as scoring). */
const EUROPEAN_COUNTRIES = new Set([
  'Albania', 'Andorra', 'Armenia', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
  'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland',
  'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
  'Kazakhstan', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
  'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland',
  'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
  'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'UK', 'Vatican City',
]);

function isAmericanSwing(): boolean {
  const month = new Date().getMonth() + 1; // 1–12
  return month === 3 || month === 8 || month === 9; // March (IW/Miami), Aug–Sep (US Open)
}

export interface TournamentForPreference {
  id: string;
  name: string;
  location?: { city?: string; country?: string };
  start_date?: string;
}

/**
 * Pick the preferred "next" or "current" tournament when several are possible.
 * Prefer European tournaments over others (e.g. Rotterdam over Dallas); during American swing (Mar, Aug, Sep) US is allowed.
 */
export function selectTournamentByRegionPreference(tournaments: TournamentForPreference[]): TournamentForPreference | null {
  if (!tournaments.length) return null;
  const americanSwing = isAmericanSwing();
  const country = (t: TournamentForPreference) => (t.location as { country?: string } | undefined)?.country ?? '';
  const isEuropean = (t: TournamentForPreference) => country(t) && EUROPEAN_COUNTRIES.has(country(t));
  const isUSA = (t: TournamentForPreference) => {
    const c = country(t);
    return c === 'United States' || c === 'USA' || c === 'US';
  };
  const sorted = [...tournaments].sort((a, b) => {
    const aEuro = isEuropean(a);
    const bEuro = isEuropean(b);
    const aUS = isUSA(a);
    const bUS = isUSA(b);
    if (!americanSwing) {
      // Prefer Europe
      if (aEuro && !bEuro) return -1;
      if (!aEuro && bEuro) return 1;
    } else {
      // American swing: US can compete
      if (aUS && !bUS) return -1;
      if (!aUS && bUS) return 1;
    }
    // Tie-break: earliest start_date
    return (a.start_date || '').localeCompare(b.start_date || '');
  });
  return sorted[0];
}

/**
 * Update next location when Marshall's current tournament ends.
 * Only runs when tournamentId is his current_tournament_id.
 * Picks next tournament with European preference (Rotterdam over Dallas when both upcoming).
 */
export async function updateNextLocation(tournamentId: string): Promise<boolean> {
  const current = await getMarshallState();
  if (!current || current.current_tournament_id !== tournamentId) {
    return false;
  }

  const supabase = createAdminSupabase();
  const { data: upcoming } = await supabase
    .from('atp_calendar')
    .select('id, name, location, start_date')
    .gt('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(15);

  const nextTournament = selectTournamentByRegionPreference(upcoming ?? []);

  const updates: Partial<MarshallState> = {
    current_tournament_id: undefined,
    current_city: undefined,
    current_country: undefined,
    arrived_at: undefined,
    leaving_at: undefined,
  };

  if (nextTournament) {
    const location = nextTournament.location as { city?: string; country?: string };
    updates.next_city = location.city;
    updates.next_country = location.country;
    updates.next_tournament_id = nextTournament.id;
    updates.traveling_to_at = nextTournament.start_date ? new Date(nextTournament.start_date).toISOString() : undefined;
  } else {
    updates.next_tournament_id = undefined;
    updates.next_city = undefined;
    updates.next_country = undefined;
    updates.traveling_to_at = undefined;
  }

  await updateMarshallState(updates, 'system');
  return true;
}
