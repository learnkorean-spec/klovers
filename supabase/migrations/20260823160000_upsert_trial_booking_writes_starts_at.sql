-- Switch on the safety layer that Phase 2 built and nothing has been feeding.
--
-- The hole
-- --------
-- Phase 2 (20260822120000) added trial_bookings.starts_at, a slot_range derived
-- from it by trigger, and an exclusion constraint that makes overlapping
-- bookings impossible:
--
--   EXCLUDE USING gist (slot_range WITH &&)
--    WHERE (slot_range IS NOT NULL AND status IN ('pending','confirmed'))
--
-- upsert_trial_booking — the RPC every booking goes through — never learned to
-- write starts_at. So slot_range stays NULL, the WHERE clause excludes the row,
-- and the constraint has never once been consulted. Measured 2026-08-23: 75
-- bookings, 59 live, and ZERO live rows carry starts_at.
--
-- Three things were silently inert as a result:
--   * trial_bookings_no_overlap — double-booking a slot is currently possible
--   * get_trial_availability_v2 — cannot hide a slot that is already booked,
--     because its NOT EXISTS test requires slot_range IS NOT NULL
--   * fn_student_class_conflicts — the "this class would run over a booked
--     trial" guard finds nothing, for the same reason
--
-- Computing starts_at here rather than in book-trial is deliberate: the RPC is
-- the single door every booking passes through, so one change covers the edge
-- function, the admin screens, and anything added later. The BEFORE trigger
-- already turns starts_at into slot_range, so writing the instant is enough.
--
-- What this does NOT do
-- ---------------------
-- No backfill. The 59 live bookings are TBA — trial_date and start_time are
-- both NULL — so they have no instant to compute and must keep slot_range NULL.
-- They are correctly outside the constraint until they are given real dates.
--
-- Once applied, a second booking of an occupied slot raises SQLSTATE 23P01.
-- book-trial gains a readable message for that in its own PR; merge that one
-- first so the message exists before the constraint can fire.

BEGIN;

CREATE OR REPLACE FUNCTION public.upsert_trial_booking(
  p_delete_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_level text,
  p_goal text,
  p_day_of_week integer,
  p_start_time text,
  p_trial_date date,
  p_timezone text,
  p_language text,
  p_user_id uuid,
  p_status text
)
 RETURNS uuid
 LANGUAGE plpgsql
 -- Reproduced verbatim from the live definition. 'extensions' is on the path
 -- because gist/btree_gist live there; dropping it would break the exclusion
 -- constraint this function now feeds.
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_id        uuid;
  v_starts_at timestamptz;
  v_tz        text;
BEGIN
  -- Delete old booking atomically within same transaction
  IF p_delete_id IS NOT NULL THEN
    DELETE FROM trial_bookings WHERE id = p_delete_id;
  END IF;

  -- Resolve the absolute instant this trial starts.
  --
  -- Left NULL for anything that is not a real dated slot, which keeps TBA
  -- bookings out of the exclusion constraint exactly as they are today:
  --   * no date, or no time                      -> TBA placeholder
  --   * start_time that is not HH:MM[:SS]        -> legacy "TBA" style values;
  --     casting those to time would raise and fail the whole booking
  --   * the 2099 sentinel date book-trial uses to mark a placeholder
  IF p_trial_date IS NOT NULL
     AND p_trial_date < DATE '2099-01-01'
     AND p_start_time ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$'
  THEN
    v_tz := COALESCE(NULLIF(btrim(p_timezone), ''), 'Asia/Kuala_Lumpur');

    -- An unknown zone makes AT TIME ZONE raise, which would turn a cosmetic
    -- data problem into a failed booking. Fall back to the teacher's own zone
    -- instead — the same value book-trial and trial_slots default to.
    IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_tz) THEN
      RAISE WARNING 'upsert_trial_booking: unknown timezone %, falling back to Asia/Kuala_Lumpur', v_tz;
      v_tz := 'Asia/Kuala_Lumpur';
    END IF;

    -- Naive local time, then anchored to the slot's zone. Reading it back in
    -- any other zone gives the same moment, which is the whole point of
    -- storing the instant rather than a label.
    v_starts_at := (p_trial_date + p_start_time::time) AT TIME ZONE v_tz;
  END IF;

  INSERT INTO trial_bookings (
    name, email, phone, level, goal,
    day_of_week, start_time, trial_date, timezone,
    class_language, user_id, status, confirmed_at,
    starts_at
  ) VALUES (
    p_name, p_email, p_phone, p_level, p_goal,
    p_day_of_week, p_start_time, p_trial_date, p_timezone,
    p_language, p_user_id, p_status, now(),
    v_starts_at
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

COMMENT ON FUNCTION public.upsert_trial_booking(uuid, text, text, text, text, text, integer, text, date, text, text, uuid, text) IS
  'Creates a trial booking. Computes starts_at from trial_date + start_time in '
  'the slot''s timezone, which the BEFORE trigger turns into slot_range and the '
  'trial_bookings_no_overlap exclusion constraint then enforces. Leaves '
  'starts_at NULL for TBA placeholders so they stay outside that constraint.';

COMMIT;
