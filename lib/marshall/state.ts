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
 * Update Marshall's location when tournament starts
 */
export async function updateLocationForTournament(
  tournamentId: string,
  tournamentName: string
): Promise<void> {
  const supabase = createAdminSupabase();
  
  // Get tournament details
  const { data: tournament } = await supabase
    .from('atp_calendar')
    .select('name, location, start_date, end_date')
    .eq('id', tournamentId)
    .single();
  
  if (!tournament) return;
  
  const location = tournament.location as { city?: string; country?: string };
  
  const updates: Partial<MarshallState> = {
    current_city: location.city,
    current_country: location.country,
    arrived_at: new Date().toISOString(),
  };
  
  if (tournament.end_date) {
    updates.leaving_at = new Date(tournament.end_date).toISOString();
  }
  
  // Clear next tournament since we're here (omit the field to clear it)
  updates.next_tournament_id = undefined;
  
  await updateMarshallState(updates, 'system');
}

/**
 * Update next location when tournament ends
 */
export async function updateNextLocation(tournamentId: string): Promise<void> {
  const supabase = createAdminSupabase();
  
  // Find next tournament
  const { data: nextTournament } = await supabase
    .from('atp_calendar')
    .select('id, name, location, start_date')
    .gt('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(1)
    .single();
  
  if (!nextTournament) return;
  
  const location = nextTournament.location as { city?: string; country?: string };
  
  await updateMarshallState({
    next_city: location.city,
    next_country: location.country,
    next_tournament_id: nextTournament.id,
    traveling_to_at: nextTournament.start_date ? new Date(nextTournament.start_date).toISOString() : undefined,
  }, 'system');
}
