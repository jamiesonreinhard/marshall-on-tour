/**
 * Plan Week (or Plan Month) Job
 *
 * Suggests content_calendar entries from atp_calendar so the full content calendar
 * is populated from ATP + strategy. Entries are inserted as status = 'planned' for
 * review/approval; content intelligence then executes approved entries.
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export async function runPlanWeekJob(options?: { weeksAhead?: number }): Promise<{
  success: boolean;
  suggested: number;
  errors: string[];
}> {
  const weeksAhead = options?.weeksAhead ?? 2;
  const supabase = createAdminSupabase();
  const today = new Date().toISOString().split('T')[0];
  const end = new Date();
  end.setDate(end.getDate() + weeksAhead * 7);
  const endStr = end.toISOString().split('T')[0];
  const errors: string[] = [];

  const { data: tournaments, error: fetchError } = await supabase
    .from('atp_calendar')
    .select('id, name, start_date, end_date, category')
    .gte('start_date', today)
    .lte('start_date', endStr)
    .order('start_date', { ascending: true });

  if (fetchError) {
    return { success: false, suggested: 0, errors: [fetchError.message] };
  }
  if (!tournaments?.length) {
    return { success: true, suggested: 0, errors: [] };
  }

  let suggested = 0;
  for (const t of tournaments) {
    const startDate = t.start_date as string;
    const endDate = t.end_date as string;
    const previewDate = new Date(startDate);
    previewDate.setDate(previewDate.getDate() - 2);
    const previewDateStr = previewDate.toISOString().split('T')[0];
    const recapDate = new Date(endDate);
    recapDate.setDate(recapDate.getDate() + 1);
    const recapDateStr = recapDate.toISOString().split('T')[0];

    const { error: insPreview } = await supabase.from('content_calendar').insert({
      scheduled_date: previewDateStr,
      content_brief: `${t.name} Preview – draw, favorites, and what to watch`,
      category: 'Travel',
      status: 'planned',
      atp_tournament_id: t.id,
      post_type: 'blog',
    });
    if (insPreview) {
      errors.push(`Preview ${t.name}: ${insPreview.message}`);
    } else {
      suggested++;
    }

    const { error: insRecap } = await supabase.from('content_calendar').insert({
      scheduled_date: recapDateStr,
      content_brief: `${t.name} Recap – key takeaways and storylines`,
      category: 'Analysis',
      status: 'planned',
      atp_tournament_id: t.id,
      post_type: 'blog',
    });
    if (insRecap) {
      errors.push(`Recap ${t.name}: ${insRecap.message}`);
    } else {
      suggested++;
    }
  }

  return {
    success: errors.length === 0,
    suggested,
    errors,
  };
}
