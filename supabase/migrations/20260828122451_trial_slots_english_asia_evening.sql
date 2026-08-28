-- Move the two English trial slots to an Asia-evening Cairo time, following up
-- on 20260828114539_trial_slots_cairo_time.sql (merged, not yet applied — this
-- migration's guard expects THAT migration's post-state, not the current live
-- state, and will only make sense to run after it, in the same or a later
-- apply).
--
-- Background
-- ----------
-- 20260828114539 moved all four active trial_slots rows onto their real
-- Africa/Cairo representation. That surfaced a second, separate problem for
-- the two English slots specifically: English trials are meant for students
-- in Asia and the USA, and one slot cannot serve both audiences — their
-- evenings are roughly 12 hours apart. Re's decision: serve Asia. (The
-- USA-evening slot is not part of this migration; it is not yet decided.)
--
-- The two English rows currently land at 17:00 Cairo (post-20260828114539),
-- which is late morning/midday across Asia — not evening for anyone there.
-- Re picked new Cairo times that put both slots in the Asia evening window:
--
--   id          date          Cairo local  UTC instant       KL     Seoul  Bangkok
--   b1c14a79…   2026-09-06    15:00        12:00+00 (Sun)    20:00  21:00  19:00
--   369da68c…   2026-09-07    16:00        13:00+00 (Mon)    21:00  22:00  20:00
--
-- timezone stays Africa/Cairo — that is the storage convention
-- 20260828114539 established (every trial_slots row is authored in Cairo
-- local time; a viewer's own zone is derived at read time, never stored).
-- Only start_time moves. This is a real reschedule for both rows: new
-- instants, not a representation change.
--
-- The two Arabic slots (d59bac2d… Friday 14:00, cc68b1b8… Saturday 17:00) are
-- not touched — they serve Egypt and are correct as they are. This migration
-- proves that below: it asserts their instants are byte-identical to the
-- values 20260828114539 already established for them.
--
-- session_period is recomputed from the Cairo-local hour, same formula as
-- 20260828114539 (morning < 12:00, daytime 12:00-16:59, evening >= 17:00).
-- 15:00 and 16:00 Cairo both derive as "daytime". This is internally
-- consistent with the rest of the schema but leaves an open question flagged
-- in this PR's body: session_period describes the Cairo/teacher hour, not the
-- audience's local hour, so a Kuala Lumpur student will see an 8pm class
-- labelled "daytime" — the same shape of bug 20260828114539 fixed for the
-- 5:30am-labelled-evening slot, just not triggered this time because nobody
-- reads session_period as a promise about the *viewer's* evening. Not fixed
-- here — there is no field today recording who a slot is aimed at, and
-- adding one is out of scope for this PR.
--
-- No bookings reference either slot under any representation this migration
-- guards against — verified directly against production before writing this
-- migration, and re-verified inside the guard below. The 59 pending TBA
-- bookings carry no trial_date/start_time and are not touched.

BEGIN;

-- Same attribution pattern as 20260828114539 and 20260826110000: a
-- transaction-scoped set_config, never a disabled trigger.
SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
BEGIN
  -- Guard: both English rows are in EXACTLY 20260828114539's documented
  -- post-state (Africa/Cairo 17:00, active) -- this migration depends on that
  -- one having already run -- or EXACTLY this migration's own post-state
  -- (safe idempotent re-run). Anything else aborts rather than guessing.
  IF NOT EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id = 'b1c14a79-7332-4e48-a84f-a5756eb03e27'
       AND trial_date = '2026-09-06'
       AND lifecycle = 'active' AND is_active
       AND (
         (timezone = 'Africa/Cairo' AND start_time = '17:00')
         OR
         (timezone = 'Africa/Cairo' AND start_time = '15:00')
       )
  ) THEN
    RAISE EXCEPTION 'Guard failed: Sunday English slot (b1c14a79...) is not in 20260828114539''s post-state -- has that migration run yet?';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id = '369da68c-c751-4eef-9b15-f576c404254a'
       AND trial_date = '2026-09-07'
       AND lifecycle = 'active' AND is_active
       AND (
         (timezone = 'Africa/Cairo' AND start_time = '17:00')
         OR
         (timezone = 'Africa/Cairo' AND start_time = '16:00')
       )
  ) THEN
    RAISE EXCEPTION 'Guard failed: Monday English slot (369da68c...) is not in 20260828114539''s post-state -- has that migration run yet?';
  END IF;

  -- Guard: no trial_bookings row currently resolves against either slot,
  -- under whatever representation it currently holds (pre- or already
  -- post-this-migration). Re-verified live here, not trusted from the PR
  -- body.
  IF EXISTS (
    SELECT 1
    FROM public.trial_bookings tb
    JOIN public.trial_slots ts
      ON ts.trial_date = tb.trial_date AND ts.start_time = tb.start_time AND ts.timezone = tb.timezone
    WHERE ts.id IN ('b1c14a79-7332-4e48-a84f-a5756eb03e27', '369da68c-c751-4eef-9b15-f576c404254a')
  ) THEN
    RAISE EXCEPTION 'Guard failed: a trial_bookings row now references one of these two slots -- this migration assumed zero and refuses to run against attached bookings';
  END IF;

  -- Guard: the two Arabic slots are still exactly where 20260828114539 left
  -- them. This migration touches nothing else, and refuses to run if that
  -- has stopped being true for any reason.
  IF NOT EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id = 'd59bac2d-e566-4346-8d4e-6d4d45f90e66'
       AND trial_date = '2026-09-04' AND timezone = 'Africa/Cairo' AND start_time = '14:00'
  ) THEN
    RAISE EXCEPTION 'Guard failed: Friday Arabic slot (d59bac2d...) is not where 20260828114539 left it -- refusing to run';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id = 'cc68b1b8-adbe-4210-82c4-39d96de1f973'
       AND trial_date = '2026-09-05' AND timezone = 'Africa/Cairo' AND start_time = '17:00'
  ) THEN
    RAISE EXCEPTION 'Guard failed: Saturday Arabic slot (cc68b1b8...) is not where 20260828114539 left it -- refusing to run';
  END IF;
END $$;

-- The actual change. Only touches rows still at 17:00 Cairo, so a re-run
-- after a successful apply matches nothing and is a true no-op.
UPDATE public.trial_slots ts
   SET start_time     = v.post_time,
       session_period = CASE
                           WHEN v.post_time::time >= '17:00'::time THEN 'evening'
                           WHEN v.post_time::time >= '12:00'::time THEN 'daytime'
                           ELSE 'morning'
                         END,
       updated_at     = now()
  FROM (VALUES
    ('b1c14a79-7332-4e48-a84f-a5756eb03e27'::uuid, '15:00'),
    ('369da68c-c751-4eef-9b15-f576c404254a'::uuid, '16:00')
  ) AS v(id, post_time)
 WHERE ts.id = v.id
   AND ts.timezone = 'Africa/Cairo'
   AND ts.start_time = '17:00';

-- Verify before commit. Not "should be right" -- asserted.
DO $$
BEGIN
  -- The two English rows landed on exactly the decided new instants.
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'b1c14a79-7332-4e48-a84f-a5756eb03e27')
     <> '2026-09-06 12:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Sunday English slot did not land on the decided new instant (2026-09-06 12:00 UTC)';
  END IF;
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = '369da68c-c751-4eef-9b15-f576c404254a')
     <> '2026-09-07 13:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Monday English slot did not land on the decided new instant (2026-09-07 13:00 UTC)';
  END IF;

  -- session_period agrees with the Cairo-local hour for both -- asserted,
  -- not assumed. (Both are Cairo afternoon, so both derive as "daytime" --
  -- see this migration's header comment and the PR body for the open
  -- question that leaves unresolved.)
  IF (SELECT session_period FROM public.trial_slots WHERE id = 'b1c14a79-7332-4e48-a84f-a5756eb03e27') <> 'daytime' THEN
    RAISE EXCEPTION 'Verify failed: the 15:00 Cairo Sunday slot is not labelled daytime';
  END IF;
  IF (SELECT session_period FROM public.trial_slots WHERE id = '369da68c-c751-4eef-9b15-f576c404254a') <> 'daytime' THEN
    RAISE EXCEPTION 'Verify failed: the 16:00 Cairo Monday slot is not labelled daytime';
  END IF;

  -- The two Arabic slots are byte-identical to their 20260828114539
  -- post-migration instants -- proof this migration changed nothing else.
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'd59bac2d-e566-4346-8d4e-6d4d45f90e66')
     <> '2026-09-04 11:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Friday Arabic slot''s real instant changed -- this migration must not touch it';
  END IF;
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'cc68b1b8-adbe-4210-82c4-39d96de1f973')
     <> '2026-09-05 14:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Saturday Arabic slot''s real instant changed -- this migration must not touch it';
  END IF;
END $$;

COMMIT;
