/**
 * Tournament data from atp_calendar (Supabase).
 * Replaces Sportradar for current/upcoming tournament lists when using static calendar or after sync.
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface TournamentFromDB {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: {
    city: string;
    country: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

/**
 * Get current/active tournaments (started and not yet ended) from atp_calendar.
 */
export async function getCurrentTournamentsFromDB(): Promise<TournamentFromDB[]> {
  const supabase = createAdminSupabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('atp_calendar')
    .select('id, name, start_date, end_date, location, category')
    .lte('start_date', today)
    .gt('end_date', today)
    .order('start_date', { ascending: true });

  if (error) {
    console.warn('[tournaments-from-db] getCurrentTournamentsFromDB error:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    location: (row.location as { city?: string; country?: string }) || { city: '', country: '' },
    category: row.category ? { id: row.category, name: row.category } : undefined,
  }));
}

/**
 * Get upcoming tournaments (starting in the next 30 days) from atp_calendar.
 */
export async function getUpcomingTournamentsFromDB(): Promise<TournamentFromDB[]> {
  const supabase = createAdminSupabase();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('atp_calendar')
    .select('id, name, start_date, end_date, location, category')
    .gt('start_date', today)
    .lte('start_date', thirtyDaysFromNow)
    .order('start_date', { ascending: true });

  if (error) {
    console.warn('[tournaments-from-db] getUpcomingTournamentsFromDB error:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    location: (row.location as { city?: string; country?: string }) || { city: '', country: '' },
    category: row.category ? { id: row.category, name: row.category } : undefined,
  }));
}
