-- Event-grain lead tracking
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  source_type text not null,
  source_page text not null,
  cta_label text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_content text,
  referrer text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_events_session_idx on public.lead_events(session_id);
create index lead_events_user_idx    on public.lead_events(user_id);
create index lead_events_type_idx    on public.lead_events(source_type, created_at desc);

alter table public.lead_events enable row level security;

create policy "anyone can insert lead events"
  on public.lead_events for insert
  to anon, authenticated
  with check (true);

create policy "admins read lead events"
  on public.lead_events for select
  to authenticated
  using (exists (select 1 from public.user_roles
                 where user_id = auth.uid() and role = 'admin'));

create or replace function public.attach_session_to_user(p_session uuid)
returns void language sql security definer as $$
  update public.lead_events
     set user_id = auth.uid()
   where session_id = p_session
     and user_id is null
     and auth.uid() is not null;
$$;
grant execute on function public.attach_session_to_user(uuid) to authenticated;

create or replace view public.lead_funnel as
select
  e.session_id,
  min(e.created_at)                                   as first_seen,
  max(e.created_at)                                   as last_seen,
  array_agg(distinct e.source_type)                   as touchpoints,
  bool_or(e.source_type = 'whatsapp')                 as clicked_whatsapp,
  bool_or(e.source_type = 'free_trial')               as clicked_free_trial,
  bool_or(e.source_type = 'placement_test')           as started_placement,
  bool_or(e.source_type = 'pricing')                  as viewed_pricing_cta,
  max(e.user_id)                                      as user_id,
  (max(e.user_id) is not null)                        as signup_completed,
  exists (select 1 from public.trial_bookings tb
            where tb.email = (select email from public.profiles
                              where user_id = max(e.user_id)))         as trial_booked,
  exists (select 1 from public.enrollments en
            where en.user_id = max(e.user_id))                          as enrollment_completed
from public.lead_events e
group by e.session_id;

grant select on public.lead_funnel to authenticated;
