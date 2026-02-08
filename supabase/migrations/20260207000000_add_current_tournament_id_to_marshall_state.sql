-- Add current_tournament_id to marshall_state
-- Marshall has exactly one "current" tournament; location is derived from it.
-- Prevents "bouncing" when multiple tournaments are active (e.g. Rotterdam + Dallas same week).

alter table public.marshall_state
  add column if not exists current_tournament_id uuid references public.atp_calendar(id);

comment on column public.marshall_state.current_tournament_id is 'The one tournament Marshall is currently at; current_city/country derive from it. Updated only on arrival (start_date=today and this was next_tournament_id) and cleared on departure.';
