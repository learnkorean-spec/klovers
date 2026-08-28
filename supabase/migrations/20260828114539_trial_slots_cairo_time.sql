-- Move the four active trial slots from Asia/Kuala_Lumpur onto their real
-- Africa/Cairo representation, and fix Saturday's actual mistake.
--
-- Background
-- ----------
-- Every trial student is in Egypt. All four active trial_slots rows were
-- stored as Asia/Kuala_Lumpur (the teacher's own zone, inherited from
-- 20260822103000_trial_slots_timezone_myt), which nobody had converted to
-- Cairo local time to sanity-check against the session_period label. Result:
--
--   id          date          stored      Cairo local  language  session_period
--   d59bac2d…   2026-09-04    19:00 KL    14:00        arabic    daytime
--   cc68b1b8…   2026-09-05    10:30 KL    05:30        arabic    evening  ← wrong
--   b1c14a79…   2026-09-06    22:00 KL    17:00        english   evening
--   369da68c…   2026-09-07    22:00 KL    17:00        english   evening
--
-- The Saturday slot is 5:30 in the morning in Cairo, labelled "evening".
-- Nobody would attend it. Re's decision: move Saturday to 17:00 Cairo (a
-- real reschedule — new instant, 2026-09-05 14:00 UTC, was 02:30 UTC).
--
-- Friday, Sunday and Monday keep the exact same real instant they already
-- had — this migration only corrects how that instant is REPRESENTED
-- (Africa/Cairo + its own local start_time instead of Kuala_Lumpur's), the
-- same "representation change, not a reschedule" the 20260822103000
-- migration made for the same four rows' predecessor zone. Friday's actual
-- time (14:00 Cairo, which is Friday prayer time in Egypt) has NOT been
-- decided on by Re and is deliberately left alone here — see the open
-- question in this PR's body.
--
-- session_period is recomputed from the Cairo-local hour (12:00/17:00
-- boundary: morning < 12:00, daytime 12:00–16:59, evening ≥ 17:00) rather
-- than left as whatever it already said, and asserted below rather than
-- assumed — the whole bug was a label nobody cross-checked against the
-- actual local hour, so this migration does not repeat that.
--
-- No bookings reference any of these four slots (trial_bookings has no
-- foreign key to trial_slots; it is matched by trial_date + start_time +
-- timezone, the same way get_trial_availability() matches it) — verified
-- directly against production before writing this migration, and
-- re-verified inside the guard below so the guarantee holds at apply time
-- too, not just at authoring time. The 59 pending TBA bookings are
-- untouched — they carry no trial_date/start_time at all and are not
-- migrated, notified, or assigned to a slot here.
--
-- Retired (lifecycle <> 'active') rows are deliberately left alone: no read
-- path reaches them, and rewriting history to no benefit is exactly what
-- 20260822103000 already decided against doing for the prior zone mistake.

BEGIN;

-- Same attribution pattern as 20260826110000_mariam_bundle_session_correction:
-- transaction-scoped set_config, not a trigger disabled. trial_slots has no
-- audit trigger today (only trg_trial_slots_set_updated_at, which only
-- stamps updated_at), so nothing currently consumes this — set for the same
-- reason every admin-driven data-fix in this repo sets it: so the write is
-- attributable if a future audit trigger on this table ever needs it.
SELECT set_config('request.jwt.claim.sub', 'eb51d4be-8378-493f-b6c7-9c3a5e9b5416', true);

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Guard: all four ids exist and are lifecycle = 'active'.
  IF (
    SELECT count(*) FROM public.trial_slots
     WHERE id IN (
       'd59bac2d-e566-4346-8d4e-6d4d45f90e66', 'cc68b1b8-adbe-4210-82c4-39d96de1f973',
       'b1c14a79-7332-4e48-a84f-a5756eb03e27', '369da68c-c751-4eef-9b15-f576c404254a'
     ) AND lifecycle = 'active'
  ) <> 4 THEN
    RAISE EXCEPTION 'Guard failed: expected 4 active trial_slots rows for the known ids';
  END IF;

  -- Guard: no trial_bookings row currently resolves against any of these
  -- four slots. Re-verified live here, not trusted from the PR body.
  IF EXISTS (
    SELECT 1
    FROM public.trial_bookings tb
    JOIN public.trial_slots ts
      ON ts.trial_date = tb.trial_date AND ts.start_time = tb.start_time AND ts.timezone = tb.timezone
    WHERE ts.id IN (
      'd59bac2d-e566-4346-8d4e-6d4d45f90e66', 'cc68b1b8-adbe-4210-82c4-39d96de1f973',
      'b1c14a79-7332-4e48-a84f-a5756eb03e27', '369da68c-c751-4eef-9b15-f576c404254a'
    )
  ) THEN
    RAISE EXCEPTION 'Guard failed: a trial_bookings row now references one of these four slots -- this migration assumed zero and refuses to run against attached bookings';
  END IF;

  -- Guard: every row is in EXACTLY the documented pre-state (first run) or
  -- EXACTLY the documented post-state (safe idempotent re-run). Anything
  -- else -- a hand-edit, an unexpected value -- aborts rather than guessing.
  FOR r IN
    SELECT * FROM (VALUES
      ('d59bac2d-e566-4346-8d4e-6d4d45f90e66'::uuid, '2026-09-04'::date, 'Asia/Kuala_Lumpur', '19:00', 'Africa/Cairo', '14:00'),
      ('cc68b1b8-adbe-4210-82c4-39d96de1f973'::uuid, '2026-09-05'::date, 'Asia/Kuala_Lumpur', '10:30', 'Africa/Cairo', '17:00'),
      ('b1c14a79-7332-4e48-a84f-a5756eb03e27'::uuid, '2026-09-06'::date, 'Asia/Kuala_Lumpur', '22:00', 'Africa/Cairo', '17:00'),
      ('369da68c-c751-4eef-9b15-f576c404254a'::uuid, '2026-09-07'::date, 'Asia/Kuala_Lumpur', '22:00', 'Africa/Cairo', '17:00')
    ) AS expected(id, trial_date, pre_tz, pre_time, post_tz, post_time)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.trial_slots ts
      WHERE ts.id = r.id
        AND ts.trial_date = r.trial_date
        AND (
          (ts.timezone = r.pre_tz  AND ts.start_time = r.pre_time)
          OR
          (ts.timezone = r.post_tz AND ts.start_time = r.post_time)
        )
    ) THEN
      RAISE EXCEPTION 'Guard failed: trial_slots row % is not in the documented pre- or post-migration state -- refusing to guess', r.id;
    END IF;
  END LOOP;
END $$;

-- The actual change. Only touches rows still in the pre-state, so a re-run
-- after a successful apply matches nothing and is a true no-op.
UPDATE public.trial_slots ts
   SET timezone       = v.post_tz,
       start_time     = v.post_time,
       session_period = CASE
                           WHEN v.post_time::time >= '17:00'::time THEN 'evening'
                           WHEN v.post_time::time >= '12:00'::time THEN 'daytime'
                           ELSE 'morning'
                         END,
       updated_at     = now()
  FROM (VALUES
    ('d59bac2d-e566-4346-8d4e-6d4d45f90e66'::uuid, 'Africa/Cairo', '14:00'),
    ('cc68b1b8-adbe-4210-82c4-39d96de1f973'::uuid, 'Africa/Cairo', '17:00'),
    ('b1c14a79-7332-4e48-a84f-a5756eb03e27'::uuid, 'Africa/Cairo', '17:00'),
    ('369da68c-c751-4eef-9b15-f576c404254a'::uuid, 'Africa/Cairo', '17:00')
  ) AS v(id, post_tz, post_time)
 WHERE ts.id = v.id
   AND ts.timezone = 'Asia/Kuala_Lumpur';

-- Verify before commit. Not "should be right" -- asserted.
DO $$
BEGIN
  -- All four now on Africa/Cairo.
  IF (
    SELECT count(*) FROM public.trial_slots
     WHERE id IN (
       'd59bac2d-e566-4346-8d4e-6d4d45f90e66', 'cc68b1b8-adbe-4210-82c4-39d96de1f973',
       'b1c14a79-7332-4e48-a84f-a5756eb03e27', '369da68c-c751-4eef-9b15-f576c404254a'
     ) AND timezone <> 'Africa/Cairo'
  ) <> 0 THEN
    RAISE EXCEPTION 'Verify failed: not all four rows are on Africa/Cairo after the update';
  END IF;

  -- Friday, Sunday, Monday: byte-identical to their pre-migration real
  -- instant -- a representation change only, never a reschedule.
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'd59bac2d-e566-4346-8d4e-6d4d45f90e66')
     <> '2026-09-04 11:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Friday slot''s real instant changed -- this must be a representation change only';
  END IF;
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'b1c14a79-7332-4e48-a84f-a5756eb03e27')
     <> '2026-09-06 14:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Sunday slot''s real instant changed -- this must be a representation change only';
  END IF;
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = '369da68c-c751-4eef-9b15-f576c404254a')
     <> '2026-09-07 14:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Monday slot''s real instant changed -- this must be a representation change only';
  END IF;

  -- Saturday: the one real reschedule -- must land exactly on the decided
  -- new instant.
  IF (SELECT (trial_date + start_time::time) AT TIME ZONE timezone
        FROM public.trial_slots WHERE id = 'cc68b1b8-adbe-4210-82c4-39d96de1f973')
     <> '2026-09-05 14:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Verify failed: Saturday slot did not land on the decided new instant (2026-09-05 14:00 UTC)';
  END IF;

  -- session_period actually agrees with the Cairo-local hour now -- asserted,
  -- not assumed.
  IF EXISTS (
    SELECT 1 FROM public.trial_slots
     WHERE id IN (
       'cc68b1b8-adbe-4210-82c4-39d96de1f973', 'b1c14a79-7332-4e48-a84f-a5756eb03e27',
       '369da68c-c751-4eef-9b15-f576c404254a'
     ) AND session_period <> 'evening'
  ) THEN
    RAISE EXCEPTION 'Verify failed: a 17:00 Cairo slot is not labelled evening';
  END IF;
  IF (SELECT session_period FROM public.trial_slots WHERE id = 'd59bac2d-e566-4346-8d4e-6d4d45f90e66') <> 'daytime' THEN
    RAISE EXCEPTION 'Verify failed: the 14:00 Cairo Friday slot is not labelled daytime';
  END IF;
END $$;

COMMIT;
