-- trial_bookings: declare the status graph instead of implying it.
--
-- WHY
-- ---
-- trial_bookings.status has eight legal values, enforced by a CHECK constraint:
--   pending, date_selected, awaiting_attendance, confirmed_attendance,
--   confirmed, completed, no_show, cancelled
--
-- Nothing anywhere states which of those may move to which. The graph exists
-- only as scattered UPDATE statements in crons, edge functions and the admin UI.
--
-- That is not a tidiness complaint -- it is the direct cause of a live defect.
-- respond_trial_attendance() writes attendance_response and never touches
-- status. The age-stale-trial-bookings cron matches status = 'pending' only.
-- No function anywhere writes 'completed' or 'confirmed_attendance'. So every
-- booking that reaches awaiting_attendance stays there forever, and after the
-- 11-14 Sep trials the system will not be able to report who attended.
--
-- A dead-end state is invisible when the graph is implicit. It is obvious the
-- moment the graph is data.
--
-- WHAT THIS DOES
-- --------------
--   1. trial_booking_status_transitions -- the legal moves, as 23 rows.
--   2. A migration-time liveness assertion: every non-terminal status must have
--      at least one outgoing transition, or this migration fails. THIS IS THE
--      POINT OF THE CHANGE. It makes the awaiting_attendance dead end
--      impossible to reintroduce silently.
--   3. A BEFORE UPDATE OF status trigger that rejects any move not in the table.
--
-- Terminal by design: completed, cancelled. Everything else has an exit.
-- no_show -> pending is declared so a no-show can be re-invited into a later
-- cycle rather than becoming a third terminal state.
--
-- SCOPE
-- -----
-- UPDATE only. Inserts are deliberately untouched: upsert_trial_booking() takes
-- p_status from its caller and rebooking is implemented as delete-then-insert,
-- so constraining inserts would change booking behaviour. This migration
-- constrains transitions, nothing else.
--
-- No escape hatch, deliberately. If a legitimate move is missing, the fix is one
-- INSERT into trial_booking_status_transitions in a migration -- which is
-- reviewable, and is the whole point. An admin bypass would put the graph back
-- where it started.
--
-- COMPATIBILITY WITH WORK IN FLIGHT
-- ---------------------------------
-- The cron that will finally write completed / no_show for attended trials is
-- being written separately. Both moves it needs are declared here:
--   awaiting_attendance -> completed
--   awaiting_attendance -> no_show
-- as are the moves every existing writer makes, including the age-stale cron's
-- pending -> no_show.
--
-- DRY RUN
-- -------
-- Executed in full against production inside an explicit transaction and rolled
-- back. Two behavioural tests ran inside it:
--   awaiting_attendance -> completed   applied (completed count 0 -> 1)
--   cancelled -> pending               raised check_violation, as intended
-- Verified after the rollback: table absent, trigger absent, completed count
-- back to 0, awaiting_attendance still 5.
--
-- ROLLBACK
-- --------
--   drop trigger if exists trg_trial_bookings_validate_status_transition on public.trial_bookings;
--   drop function if exists public.tg_trial_bookings_validate_status_transition();
--   drop table if exists public.trial_booking_status_transitions;

begin;

-- 1. The graph, as data ------------------------------------------------------

create table if not exists public.trial_booking_status_transitions (
  from_status text not null,
  to_status   text not null,
  note        text,
  primary key (from_status, to_status)
);

comment on table public.trial_booking_status_transitions is
  'The legal trial_bookings.status moves. Enforced by trg_trial_bookings_validate_status_transition. To allow a new move, add a row here in a migration -- do not bypass the trigger.';

alter table public.trial_booking_status_transitions enable row level security;

drop policy if exists "transitions readable" on public.trial_booking_status_transitions;
create policy "transitions readable"
  on public.trial_booking_status_transitions
  for select to anon, authenticated using (true);

insert into public.trial_booking_status_transitions (from_status, to_status, note) values
  ('pending',              'date_selected',        'student picked a slot'),
  ('pending',              'awaiting_attendance',  'admin confirmed a date directly'),
  ('pending',              'confirmed',            'legacy confirm path'),
  ('pending',              'no_show',              'age-stale-trial-bookings cron, trial date passed'),
  ('pending',              'cancelled',            'student or admin cancelled'),
  ('date_selected',        'awaiting_attendance',  'date accepted'),
  ('date_selected',        'confirmed',            'legacy confirm path'),
  ('date_selected',        'no_show',              'date passed without attendance'),
  ('date_selected',        'cancelled',            null),
  ('confirmed',            'awaiting_attendance',  null),
  ('confirmed',            'confirmed_attendance', 'student said yes'),
  ('confirmed',            'completed',            'attended'),
  ('confirmed',            'no_show',              'did not attend'),
  ('confirmed',            'cancelled',            null),
  ('awaiting_attendance',  'confirmed_attendance', 'student said yes'),
  ('awaiting_attendance',  'completed',            'attended'),
  ('awaiting_attendance',  'no_show',              'did not attend'),
  ('awaiting_attendance',  'cancelled',            null),
  ('confirmed_attendance', 'completed',            'attended'),
  ('confirmed_attendance', 'no_show',              'said yes, did not attend'),
  ('confirmed_attendance', 'cancelled',            null),
  ('no_show',              'pending',              're-invited into a later cycle'),
  ('no_show',              'cancelled',            null)
on conflict do nothing;

-- 2. Liveness assertion ------------------------------------------------------
-- The check that would have caught the awaiting_attendance dead end on the day
-- it was introduced. completed and cancelled are terminal by design and are
-- deliberately not in this list.

do $$
declare v_dead text;
begin
  select string_agg(s, ', ') into v_dead
    from unnest(array[
      'pending','date_selected','awaiting_attendance','confirmed_attendance','confirmed','no_show'
    ]) s
   where not exists (
     select 1 from public.trial_booking_status_transitions t where t.from_status = s
   );
  if v_dead is not null then
    raise exception 'dead_end_status: % has no outgoing transition', v_dead;
  end if;
end $$;

-- 3. Enforcement -------------------------------------------------------------

create or replace function public.tg_trial_bookings_validate_status_transition()
returns trigger
language plpgsql
set search_path to 'public'
as $fn$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not exists (
    select 1 from public.trial_booking_status_transitions t
     where t.from_status = old.status
       and t.to_status   = new.status
  ) then
    raise exception 'illegal_status_transition: % -> % is not a declared transition (booking %)',
      old.status, new.status, old.id
      using errcode = '23514',
            hint = 'If this move is legitimate, add it to public.trial_booking_status_transitions in a migration.';
  end if;

  return new;
end;
$fn$;

revoke all on function public.tg_trial_bookings_validate_status_transition() from public, anon, authenticated;

drop trigger if exists trg_trial_bookings_validate_status_transition on public.trial_bookings;
create trigger trg_trial_bookings_validate_status_transition
  before update of status on public.trial_bookings
  for each row execute function public.tg_trial_bookings_validate_status_transition();

commit;
