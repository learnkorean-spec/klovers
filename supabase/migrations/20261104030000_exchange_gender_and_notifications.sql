-- Language Exchange follow-up (Re's request, 4 Nov 2026):
--  1) every profile states its own gender and who it wants to practice with
--     (male / female / either), so Discover can filter by mutual preference;
--  2) a user gets an in-app notification the moment they match, instead of
--     only finding out by reopening the Matches tab.
--
-- gender / looking_for_gender: enforced server-side with the same
-- fixed-catalogue CHECK pattern already used for goals, so a client bug can
-- never write a value the UI doesn't know how to render.
--
-- exchange_notifications: a new, user-scoped table (RLS: a user sees/updates
-- only their own rows) -- there is no existing student-facing notification
-- table in this app to extend (admin_notifications is admin-only, a
-- different table with different RLS). exchange_handle_swipe() is extended
-- to insert one notification row per matched user, in the same transaction
-- as the match itself, so the two can never drift out of sync.

alter table public.exchange_profiles
  add column if not exists gender text,
  add column if not exists looking_for_gender text not null default 'any';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exchange_profiles_gender_known_values'
  ) then
    alter table public.exchange_profiles
      add constraint exchange_profiles_gender_known_values
      check (gender is null or gender in ('male', 'female'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exchange_profiles_looking_for_gender_known_values'
  ) then
    alter table public.exchange_profiles
      add constraint exchange_profiles_looking_for_gender_known_values
      check (looking_for_gender in ('male', 'female', 'any'));
  end if;
end $$;

-- Correctness fix found while building chat/notifications on top of matches
-- (not a new issue introduced here): exchange_profiles' existing SELECT
-- policies are "your own row" or "anyone visible, not blocked" -- so a user
-- who matches, then later turns their own visibility off (or the viewer's
-- is_visible check races a profile update), silently vanishes from their
-- match's Matches tab and chat header even though the match/chat rows are
-- still there. Add select access for "the profile of someone I'm matched
-- with", independent of that profile's own is_visible flag.
drop policy if exists "exchange_profiles_select_matched" on public.exchange_profiles;
create policy "exchange_profiles_select_matched"
  on public.exchange_profiles for select
  using (
    exists (
      select 1 from public.exchange_matches m
      where (select auth.uid()) in (m.user_a, m.user_b)
        and exchange_profiles.user_id in (m.user_a, m.user_b)
        and exchange_profiles.user_id <> (select auth.uid())
    )
  );

create table if not exists public.exchange_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'match',
  match_id uuid references public.exchange_matches(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists exchange_notifications_user_unread_idx
  on public.exchange_notifications (user_id, is_read, created_at desc);

alter table public.exchange_notifications enable row level security;

drop policy if exists "exchange_notifications_select_own" on public.exchange_notifications;
create policy "exchange_notifications_select_own"
  on public.exchange_notifications for select
  using ((select auth.uid()) = user_id);

drop policy if exists "exchange_notifications_update_own" on public.exchange_notifications;
create policy "exchange_notifications_update_own"
  on public.exchange_notifications for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "exchange_notifications_admin_all" on public.exchange_notifications;
create policy "exchange_notifications_admin_all"
  on public.exchange_notifications for all
  using (has_role((select auth.uid()), 'admin'::app_role));

-- No insert policy for authenticated/anon on purpose: rows are only ever
-- written by exchange_handle_swipe() below, which runs as SECURITY DEFINER.

create or replace function public.exchange_handle_swipe()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _reverse_liked boolean;
  _a uuid;
  _b uuid;
  _match_id uuid;
  _a_name text;
  _b_name text;
begin
  if new.action = 'like' then
    select exists(
      select 1 from public.exchange_swipes
      where swiper_id = new.target_id and target_id = new.swiper_id and action = 'like'
    ) into _reverse_liked;

    if _reverse_liked then
      if new.swiper_id < new.target_id then
        _a := new.swiper_id; _b := new.target_id;
      else
        _a := new.target_id; _b := new.swiper_id;
      end if;

      insert into public.exchange_matches (user_a, user_b)
      values (_a, _b)
      on conflict (user_a, user_b) do nothing
      returning id into _match_id;

      if _match_id is not null then
        select display_name into _a_name from public.exchange_profiles where user_id = _a;
        select display_name into _b_name from public.exchange_profiles where user_id = _b;

        insert into public.exchange_notifications (user_id, type, match_id, message)
        values
          (_a, 'match', _match_id, coalesce(_b_name, 'Someone') || ' matched with you on Language Exchange'),
          (_b, 'match', _match_id, coalesce(_a_name, 'Someone') || ' matched with you on Language Exchange');
      end if;
    end if;
  end if;
  return new;
end;
$function$;

-- exchange_handle_swipe already has EXECUTE revoked from anon/authenticated
-- (20261104010000_revoke_anon_on_exchange_trigger_functions.sql); CREATE OR
-- REPLACE preserves a function's existing grants, so nothing to re-revoke.
