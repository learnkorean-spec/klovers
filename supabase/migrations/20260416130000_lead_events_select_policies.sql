-- Add SELECT policies so lead_funnel view and admin dashboard can read lead_events.
-- The original migration only had INSERT; reads were silently blocked by RLS.

create policy "users read own lead events"
  on public.lead_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "anon read lead events for funnel"
  on public.lead_events for select
  to anon
  using (true);
