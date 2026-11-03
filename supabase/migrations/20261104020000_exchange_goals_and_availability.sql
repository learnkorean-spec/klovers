-- Language Exchange follow-up (Re's request, 4 Nov 2026): every profile must
-- say what they're looking for (study partner / culture friend / TOPIK prep
-- / native-speaker practice / casual chat / travel prep) and must give two
-- times they're free, so a match knows when to actually reach out instead of
-- guessing. Mirrors this app's existing "pick your free times" pattern
-- (student_slot_preferences / SlotRanker: a small fixed set the student picks
-- from, capped count) rather than inventing a new shape.
--
-- goals: multi-select, 1-3, from a fixed catalogue (enforced server-side so a
-- future client bug can't write an unknown tag that the UI then can't render).
-- availability_slots: exactly 2 "Day:bucket" tokens (e.g. "Monday:evening"),
-- free-text on this end (day names/time buckets are a client-side concern,
-- like interests already are on this table) but capped at 2 so the column
-- can't be abused as an unbounded list.
-- timezone: IANA zone the two free-time slots are expressed in, so a match in
-- a different timezone isn't left guessing which "evening" is meant.

alter table public.exchange_profiles
  add column if not exists goals text[] not null default '{}',
  add column if not exists availability_slots text[] not null default '{}',
  add column if not exists timezone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exchange_profiles_goals_known_values'
  ) then
    alter table public.exchange_profiles
      add constraint exchange_profiles_goals_known_values
      check (goals <@ array[
        'study_partner', 'culture_friend', 'topik_prep',
        'native_practice', 'casual_chat', 'travel_prep'
      ]::text[]);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exchange_profiles_goals_max_three'
  ) then
    alter table public.exchange_profiles
      add constraint exchange_profiles_goals_max_three check (cardinality(goals) <= 3);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'exchange_profiles_availability_max_two'
  ) then
    alter table public.exchange_profiles
      add constraint exchange_profiles_availability_max_two
      check (cardinality(availability_slots) <= 2);
  end if;
end $$;
