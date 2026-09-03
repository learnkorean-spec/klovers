-- _trial_time_to_minutes(): return NULL for unparseable text instead of raising.
--
-- FOUND
-- -----
-- While verifying the five migrations applied on 2026-09-03, an attempt to move
-- a cancelled booking back to 'pending' failed with:
--
--   ERROR: 22P02 invalid input syntax for type integer: "TBA"
--   CONTEXT: SQL function "_trial_time_to_minutes"
--            PL/pgSQL function trial_bookings_check_conflict() line 25
--
-- Nine rows in trial_bookings carry the literal string 'TBA' in start_time
-- (all currently cancelled, all also carrying the 2099-12-31 sentinel date).
-- trial_bookings_check_conflict() skips TBA rows -- but it decides that from
-- NEW.is_tba and NEW.status, and these nine rows have is_tba = false. So an
-- UPDATE that sets status to 'pending' or 'confirmed' passes the skip check and
-- reaches (split_part('TBA', ':', 1))::int, which raises.
--
-- WHY IT MATTERS NOW
-- ------------------
-- PR #209 declared no_show -> pending as a legal re-invite transition. That is
-- exactly the path that hits this. Before the state machine existed, the crash
-- was a rare curiosity; now it sits on a route the pilot may actually use.
--
-- THE FIX
-- -------
-- The helper already returns NULL for NULL and ''. It now returns NULL for
-- anything that is not HH:MM[:SS] as well, rather than raising a raw type error
-- from inside a trigger.
--
-- Downstream consequence, stated plainly: in trial_bookings_check_conflict(),
-- v_trial_start_min becomes NULL, the overlap comparison evaluates to NULL, the
-- WHERE clause matches nothing and the conflict count is 0. So a booking with no
-- parseable start time is treated as "no conflict found" instead of crashing.
-- That is the correct answer for a row that does not describe a real time, and
-- it is the honest one -- the function cannot detect an overlap with a time it
-- cannot read.
--
-- NOT FIXED HERE, DELIBERATELY
-- ----------------------------
-- The nine rows are not cleaned up in this migration. Nulling start_time and
-- trial_date would set is_tba = true via trg_trial_bookings_sync_is_tba, and
-- that collides with:
--
--   CREATE UNIQUE INDEX idx_trial_bookings_one_tba_per_email
--     ON trial_bookings (lower(email)) WHERE (is_tba = true)
--
-- which does not exclude cancelled rows. Attempting the cleanup fails with
-- 23505 on an email that already holds a TBA booking. That index is the reason
-- the 'TBA' string and the 2099 sentinel exist at all -- they are a workaround
-- for NULLs colliding, not carelessness.
--
-- Separately worth a decision, and not made here: two cancelled TBA bookings
-- currently hold that uniqueness slot for two email addresses, so those two
-- people cannot register a new TBA booking. Adding AND status <> 'cancelled' to
-- the index predicate would fix it, but that changes booking admission and needs
-- its own PR.
--
-- DRY RUN
-- -------
-- Executed against production inside a transaction and rolled back. The UPDATE
-- that previously died with 22P02 was instead cleanly rejected by
-- trg_trial_bookings_validate_status_transition with illegal_status_transition,
-- which also confirms PR #209 is enforcing on production. Parse results after
-- the change: 'TBA' -> NULL, '15:00' -> 900, NULL -> NULL.
--
-- ROLLBACK
-- --------
-- Restore the previous two-branch CASE from 20260421100000_trial_scheduling_hardening.sql.

begin;

create or replace function public._trial_time_to_minutes(t text)
returns integer
language sql
immutable
set search_path to 'public'
as $fn$
  select case
    when t is null or t = '' then null
    -- Anything that is not HH:MM[:SS] -- the legacy literal 'TBA' above all --
    -- has no minute value. Return NULL rather than raising 22P02 from inside a
    -- trigger, where the error is unreadable and aborts the whole statement.
    when t !~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' then null
    else (split_part(t, ':', 1))::int * 60 + (split_part(t, ':', 2))::int
  end
$fn$;

comment on function public._trial_time_to_minutes(text) is
  'Minutes since midnight for an HH:MM[:SS] string. Returns NULL for NULL, empty, or any unparseable value including the legacy literal ''TBA'' -- never raises.';

commit;
