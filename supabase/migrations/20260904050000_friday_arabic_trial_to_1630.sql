-- Move the Friday Arabic trial to 16:30 so it stops colliding with the course.
--
-- THIS UPDATES EXISTING ROWS - one trial_slots row and any booking attached to
-- it.
--
-- THE COLLISION
-- -------------
-- Both of these are Friday, 15:00 Africa/Cairo:
--
--   trial_slots       2026-09-11 15:00  arabic   30 min
--   schedule_packages Friday    15:00   hangul   60 min   (Arabic cohort)
--
-- Trials roll over weekly, so this is not a one-week overlap - it repeats
-- every Friday from the moment the cohort starts, and one teacher cannot be
-- in both.
--
-- WHICH ONE MOVES, AND WHY THE TRIAL
-- ----------------------------------
-- The course keeps 15:00. It is the paid commitment, it is twice as long, and
-- a cohort holds its hour for about three years - moving it later would push
-- a 60-minute class to 17:30 Cairo, which is 22:30 where Reham is. The trial
-- is 30 minutes, top of funnel, and can sit beside it.
--
-- 16:30 rather than any other time: it is exactly when the Saturday Arabic
-- trial already runs, so both Arabic trials are now at the same hour and there
-- is one less thing to remember. It also leaves a clean 30-minute gap after
-- the course ends at 16:00 rather than butting straight against it.
--
-- Friday then reads: 15:00-16:00 Hangul cohort, 16:30-17:00 Arabic trial.
--
-- WHY NOW IS THE CHEAP MOMENT
-- ---------------------------
-- Measured before writing: the slot has ZERO live bookings, and the
-- invitations have not been sent. Nobody is being moved and nobody has to be
-- told. A week later this is an email to everyone who booked.
--
-- WHY NOT reschedule_trial_slot()
-- -------------------------------
-- That RPC exists for exactly this and its logic is reproduced below, but its
-- first act is `if not has_role(auth.uid(), 'admin')`. Applied through the
-- migration workflow there is no auth.uid(), so the call would raise
-- not_authorised. The body is inlined instead, in the same order and with the
-- same starts_at recomputation, so the two cannot drift in behaviour.
--
-- Order matters and is preserved: the slot moves BEFORE the bookings, because
-- trial_bookings_validate_slot() rejects any booking whose (day_of_week,
-- start_time) matches no active slot.
--
-- NOT included: the Google Calendar event for this trial room is moved
-- separately, by hand, at the same time. Moving a calendar event does not
-- change its Meet link, so the link stored in this row stays correct either
-- way.
--
-- WHY THIS FILE FAILED ONCE, AND WHAT CHANGED
-- -------------------------------------------
-- Apply Migrations #125 aborted this file with:
--
--   ERROR:  syntax error at or near ">"
--   LINE 15:   IF overlaps > 0 THEN
--
-- The verification block below declared a variable called `overlaps`.
-- OVERLAPS is a type_func_name keyword in Postgres - the period-comparison
-- operator, `(a, b) OVERLAPS (c, d)` - so a bare `overlaps` is parsed as that
-- operator and the IF never reaches its comparison. It is now v_overlaps, the
-- same prefix every variable in the first block already uses. Nothing else in
-- this file changed.
--
-- The failure was clean: the file manages its own transaction, so the move it
-- had already made was rolled back with it. Confirmed on production
-- afterwards - the slot was still 15:00 and this version was not recorded in
-- schema_migrations. Worth knowing because the log shows the NOTICE saying the
-- move happened; that NOTICE is printed inside the transaction that then
-- aborted.

BEGIN;

DO $$
DECLARE
  v_slot_id  CONSTANT uuid := 'd59bac2d-e566-4346-8d4e-6d4d45f90e66';
  v_old      CONSTANT text := '15:00';
  v_new      CONSTANT text := '16:30';
  v_date     date;
  v_tz       text;
  v_lang     text;
  v_live     int;
  v_moved    int;
  v_clash    int;
BEGIN
  SELECT ts.trial_date, ts.timezone, ts.class_language
    INTO v_date, v_tz, v_lang
    FROM public.trial_slots ts
   WHERE ts.id = v_slot_id AND ts.start_time = v_old AND ts.is_active
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'the Friday Arabic trial slot is not where this migration expects it (id %, start %) - it has already been moved or retired, so nothing has been changed', v_slot_id, v_old;
  END IF;

  IF v_lang IS DISTINCT FROM 'arabic' THEN
    RAISE EXCEPTION 'slot % is % , not arabic - refusing to move the wrong slot', v_slot_id, v_lang;
  END IF;

  -- Moving a slot out from under a student who booked it needs telling them,
  -- which is a different job from this one. If that has happened since this
  -- was written, stop and let a person decide.
  SELECT count(*) INTO v_live
    FROM public.trial_bookings tb
   WHERE tb.slot_id = v_slot_id
     AND tb.status NOT IN ('cancelled', 'no_show', 'completed');

  IF v_live > 0 THEN
    RAISE EXCEPTION
      '% live booking(s) on this slot - moving it would change the time for a student who was told 15:00. Nothing has been changed; tell them first.', v_live;
  END IF;

  SELECT count(*) INTO v_clash
    FROM public.trial_slots x
   WHERE x.is_active AND x.trial_date = v_date AND x.start_time = v_new AND x.id <> v_slot_id;

  IF v_clash > 0 THEN
    RAISE EXCEPTION 'another active slot already sits at % on % - pick a different time', v_new, v_date;
  END IF;

  -- Slot first. See the header: the booking guard refuses any booking whose
  -- (day_of_week, start_time) matches no active slot.
  UPDATE public.trial_slots
     SET start_time = v_new
   WHERE id = v_slot_id;

  UPDATE public.trial_bookings tb
     SET start_time = v_new,
         starts_at  = CASE
                        WHEN v_date IS NULL OR v_tz IS NULL THEN tb.starts_at
                        ELSE ((v_date::text || ' ' || v_new)::timestamp AT TIME ZONE v_tz)
                      END
   WHERE tb.slot_id = v_slot_id
     AND tb.start_time = v_old;

  GET DIAGNOSTICS v_moved = row_count;

  RAISE NOTICE 'Friday Arabic trial moved % -> % on %. % booking row(s) moved with it (all non-live).',
    v_old, v_new, v_date, v_moved;
END $$;

-- Prove Friday no longer double-books, from the two tables that decide it.
--
-- v_overlaps, not overlaps: see the header. OVERLAPS is a Postgres keyword and
-- a variable of that name makes this whole block unparseable.
DO $$
DECLARE
  v_overlaps int;
BEGIN
  SELECT count(*) INTO v_overlaps
    FROM public.trial_slots ts
    JOIN public.schedule_packages sp
      ON sp.is_active
     AND sp.day_of_week = ts.day_of_week
     AND sp.timezone    = ts.timezone
     -- Multiplied by an interval literal rather than make_interval's named
     -- argument form.
     --
     -- This is the whole reason 20260904050000 failed three times (runs #123,
     -- #124, #125 on 2026-09-06) with `syntax error at or near ">"` while
     -- every guard inside it was satisfied by the live data. The named
     -- argument arrow is fine in plain SQL - the identical join runs there and
     -- returns the expected count - but this query lives inside a DO block,
     -- and PL/pgSQL's own expression scanner splits that arrow into an equals
     -- and a greater-than. The greater-than then has nothing on its left, and
     -- the parse dies on it.
     --
     -- This is the same arithmetic with no arrow in it, so it parses the same
     -- way in both places.
     AND (ts.start_time)::time <  (sp.start_time + (sp.duration_min * interval '1 minute'))
     AND ((ts.start_time)::time + (ts.duration_min * interval '1 minute')) > sp.start_time
   WHERE ts.is_active;

  IF v_overlaps > 0 THEN
    RAISE EXCEPTION '% trial slot(s) still overlap a paid cohort on the same day', v_overlaps;
  END IF;

  RAISE NOTICE 'No active trial slot overlaps a paid cohort any more.';
END $$;

COMMIT;
