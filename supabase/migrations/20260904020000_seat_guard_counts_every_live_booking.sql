-- The 8-seat limit does not currently apply to signed-in students.
--
-- Found while making every booking wait on the student's own confirmation.
-- It is NOT caused by that change - it is live now, and the change would have
-- spread it to everybody.
--
-- trial_bookings_validate_slot is the seat guard. It enumerates live statuses
-- in two places, and 'awaiting_attendance' is in neither:
--
--   IF ... OR NEW.status NOT IN ('pending','confirmed') THEN RETURN NEW;
--   ...
--   AND tb.status IN ('pending','confirmed')
--
-- book-trial writes 'awaiting_attendance' for anyone booking while signed in.
-- So for those students the trigger returns early and runs NO capacity check
-- at all, and their row is invisible to everyone else's capacity check. Both
-- halves fail in the same direction: overbooking.
--
-- 37 of the 57 students waiting on a trial have accounts.
--
-- 'confirmed_attendance' is missing from those lists too, so a student who had
-- confirmed would also have stopped occupying a seat.
--
-- Same disease as idx_trial_bookings_unique_active in 20260904010000: a
-- predicate that lists the live statuses, and a status added later in
-- 20260517000003 that was never added to the list. Same fix: name what is
-- dead, so anything new counts as alive. For a capacity guard that is also
-- the safe direction to fail - a status nobody has taught it about blocks a
-- seat rather than silently freeing one.
--
-- Dead, for seat purposes, is exactly: cancelled (withdrawn), no_show and
-- completed (the class already happened). Everything else holds a seat.
--
-- Second function, same root cause with a different consequence.
-- claim_trial_capacity_alert counts registrations to decide whether to tell
-- Reham a group has filled. It counts status IN ('confirmed',
-- 'confirmed_attendance'). Its own comment says it wants students who really
-- confirmed rather than merely booked - which is right - but it reads that
-- from `status`, and respond_trial_attendance does not write `status`. It
-- writes attendance_response and attendance_confirmed_at and leaves the status
-- alone. Once every booking is 'awaiting_attendance', that count is zero
-- forever and the alert never fires again.
--
-- So it now counts the thing it actually means: attendance_response = 'yes'.
-- That is the student saying "I will be there", which is what the alert is
-- about, and it no longer depends on a status transition nothing performs.
--
-- NOT changed here: get_trial_availability_v2 carries the same
-- ('pending','confirmed') list in its slot_range overlap check, so an
-- awaiting_attendance booking does not block the teacher's calendar there.
-- That function is a large SQL body serving a different booking surface, and
-- it deserves its own change rather than being swept into this one.

BEGIN;

CREATE OR REPLACE FUNCTION public.trial_bookings_validate_slot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_slot_id    uuid;
  v_capacity   int;
  v_booked     int;
BEGIN
  -- Skip TBA rows, and rows moving to a status that releases the seat.
  -- Listing the dead statuses rather than the live ones means a status added
  -- later is validated by default instead of slipping past unchecked.
  IF NEW.is_tba IS TRUE
     OR NEW.start_time IS NULL OR NEW.trial_date IS NULL
     OR NEW.start_time = 'TBA' OR NEW.trial_date = '2099-12-31'
     OR NEW.status IN ('cancelled','no_show','completed') THEN
    RETURN NEW;
  END IF;

  -- 1) (day_of_week, start_time) must match an active slot
  SELECT ts.id, ts.capacity
    INTO v_slot_id, v_capacity
    FROM public.trial_slots ts
   WHERE ts.day_of_week = NEW.day_of_week
     AND ts.start_time  = NEW.start_time
     AND ts.is_active   = true
     AND (ts.lifecycle IS NULL OR ts.lifecycle = 'active')
   LIMIT 1;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION
      'trial_slot_invalid: no active trial slot for day_of_week=% start_time=%',
      NEW.day_of_week, NEW.start_time
      USING ERRCODE = '23514';
  END IF;

  -- 2) Slot capacity check. Every booking that has not been withdrawn or
  -- already happened occupies a seat, whatever stage it is at.
  SELECT COUNT(*) INTO v_booked
    FROM public.trial_bookings tb
   WHERE tb.day_of_week = NEW.day_of_week
     AND tb.start_time  = NEW.start_time
     AND tb.trial_date  = NEW.trial_date
     AND tb.is_tba      = false
     AND tb.status NOT IN ('cancelled','no_show','completed')
     AND (TG_OP = 'INSERT' OR tb.id <> NEW.id);

  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION
      'trial_slot_full: % seats already booked for % at % on %',
      v_booked, NEW.day_of_week, NEW.start_time, NEW.trial_date
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_trial_capacity_alert(p_trial_date date, p_start_time text)
 RETURNS TABLE(should_send boolean, day_of_week integer, class_language text, timezone text, capacity integer, confirmed_count integer, fourth_email text, fourth_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_slot_id        uuid;
  v_day_of_week    int;
  v_class_language text;
  v_timezone       text;
  v_capacity       int;
  v_already_sent   timestamptz;
  v_count          int;
  v_fourth_email   text;
  v_fourth_name    text;
BEGIN
  SELECT id, day_of_week, class_language, timezone, capacity, enrollment_alert_sent_at
    INTO v_slot_id, v_day_of_week, v_class_language, v_timezone, v_capacity, v_already_sent
  FROM public.trial_slots
  WHERE trial_date = p_trial_date AND start_time = p_start_time
  FOR UPDATE;

  IF v_slot_id IS NULL OR v_already_sent IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::int, NULL::text, NULL::text, NULL::int, NULL::int, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- A confirmed registration is a student who said they are coming.
  --
  -- This used to read status IN ('confirmed','confirmed_attendance'), which
  -- was the right intent read from the wrong column: respond_trial_attendance
  -- sets attendance_response and attendance_confirmed_at and never touches
  -- status, so no booking ever reaches 'confirmed_attendance'. Reading the
  -- answer itself is both correct today and independent of a status
  -- transition nothing performs.
  SELECT COUNT(*) INTO v_count
  FROM public.trial_bookings
  WHERE trial_date = p_trial_date
    AND start_time = p_start_time
    AND attendance_response = 'yes'
    AND status <> 'cancelled'
    AND is_tba = false;

  IF v_count < 4 THEN
    RETURN QUERY SELECT false, NULL::int, NULL::text, NULL::text, NULL::int, NULL::int, NULL::text, NULL::text;
    RETURN;
  END IF;

  UPDATE public.trial_slots SET enrollment_alert_sent_at = now() WHERE id = v_slot_id;

  -- The registrant who completed the group.
  SELECT tb.email, tb.name INTO v_fourth_email, v_fourth_name
  FROM public.trial_bookings tb
  WHERE tb.trial_date = p_trial_date
    AND tb.start_time = p_start_time
    AND tb.attendance_response = 'yes'
    AND tb.status <> 'cancelled'
    AND tb.is_tba = false
  ORDER BY COALESCE(tb.attendance_confirmed_at, tb.confirmed_at, tb.created_at) DESC
  LIMIT 1;

  RETURN QUERY SELECT true, v_day_of_week, v_class_language, v_timezone, v_capacity, v_count, v_fourth_email, v_fourth_name;
END;
$function$;

-- Prove the lists are gone, rather than trusting that the replace took.
DO $$
DECLARE
  guard text;
  alert text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO guard
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'trial_bookings_validate_slot';

  SELECT pg_get_functiondef(p.oid) INTO alert
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'claim_trial_capacity_alert';

  IF guard IS NULL OR alert IS NULL THEN
    RAISE EXCEPTION 'one of the two functions is missing after replacement';
  END IF;
  IF guard LIKE '%IN (''pending'',''confirmed'')%' OR guard LIKE '%IN (''pending'', ''confirmed'')%' THEN
    RAISE EXCEPTION 'the seat guard still carries the pending/confirmed list';
  END IF;
  IF guard NOT LIKE '%NOT IN (''cancelled'',''no_show'',''completed'')%' THEN
    RAISE EXCEPTION 'the seat guard is not counting by the dead-status list';
  END IF;
  IF alert NOT LIKE '%attendance_response = ''yes''%' THEN
    RAISE EXCEPTION 'the capacity alert is not counting attendance_response';
  END IF;

  RAISE NOTICE 'Seat guard now counts every live booking; capacity alert now counts real confirmations.';
END $$;

COMMIT;
