/**
 * ATP Calendar Sync
 * Syncs tournament data from Sportradar API to Supabase atp_calendar table
 */

import { getATPTournaments } from '@/lib/data/sportradar';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function syncATPCalendar(year?: number) {
  const tournaments = await getATPTournaments(year);
  const supabase = createAdminSupabase();
  
  let synced = 0;
  let errors = 0;
  
  for (const tournament of tournaments) {
    const { error } = await supabase
      .from('atp_calendar')
      .upsert({
        tournament_id: tournament.id,
        name: tournament.name,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        location: {
          city: tournament.location.city,
          country: tournament.location.country,
        },
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'tournament_id',
      });
    
    if (error) {
      console.error(`Error syncing tournament ${tournament.id}:`, error);
      errors++;
    } else {
      synced++;
    }
  }
  
  console.log(`Synced ${synced} tournaments, ${errors} errors`);
  
  return {
    synced,
    errors,
    total: tournaments.length,
  };
}