-- `starts_at` is realigned with `trial_date` — 16 September 2026.
--
-- WHAT WAS WRONG
-- Eight bookings for Friday 18 September carried `starts_at = 2026-09-25
-- 13:30+00` while `trial_date` said 18 September. Measured across every live
-- future booking, those eight were the only rows whose `starts_at` disagreed
-- with their own slot's wall clock:
--
--   Nermeen Shogaa · Samaa Abd Elsalam · Mai · رضا · Jana El Saadany
--   (confirmed) · Reham elghalban · Salmawael · ragehhiba@gmail.com
--
-- The drift came from a slot date moving under bookings that kept their own
-- `starts_at` — see claude/FRIDAY_18_SEP_DATE_MISMATCH_2026-09-15.md.
--
-- WHICH COLUMN WINS, AND WHY THIS IS NOT "CHANGING A CONFIRMED DATE"
-- `trial_date` is what every student-facing message reads and therefore what
-- each of the eight was told; one of them confirmed it. This migration does
-- NOT touch `trial_date`. It corrects the derived instant so it agrees with
-- the date the student holds. Re's rule - never touch a date a student
-- confirmed attending - is kept by moving the other column TO it.
--
-- SCOPE
-- Future, non-cancelled bookings that have a slot, where the recomputed
-- instant differs. Past bookings are left as historical record. Idempotent:
-- a second run updates nothing.

update public.trial_bookings b
   set starts_at = ((b.trial_date::text || ' ' || s.start_time::text)::timestamp
                      at time zone coalesce(s.timezone, 'Africa/Cairo'))
  from public.trial_slots s
 where s.id = b.slot_id
   and b.trial_date >= current_date
   and coalesce(b.status, '') <> 'cancelled'
   and b.starts_at is distinct from
       ((b.trial_date::text || ' ' || s.start_time::text)::timestamp
          at time zone coalesce(s.timezone, 'Africa/Cairo'));

-- Leaves a line in the logs saying how many rows were realigned, so the run
-- can be read back later without re-deriving the comparison.
do $$
declare
  remaining integer;
begin
  select count(*) into remaining
    from public.trial_bookings b
    join public.trial_slots s on s.id = b.slot_id
   where b.trial_date >= current_date
     and coalesce(b.status, '') <> 'cancelled'
     and b.starts_at is distinct from
         ((b.trial_date::text || ' ' || s.start_time::text)::timestamp
            at time zone coalesce(s.timezone, 'Africa/Cairo'));
  raise notice 'trial_bookings with starts_at still disagreeing with trial_date: %', remaining;
end $$;
