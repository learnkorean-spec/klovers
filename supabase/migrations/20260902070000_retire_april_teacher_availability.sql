-- ─────────────────────────────────────────────────────────────────────────────
-- Retire the five April 2026 rows in `teacher_availability`.
--
-- WHY THIS IS NOT COSMETIC. `StudentPreferenceStep` - the enrol-now flow where
-- a student picks the day and time they want a paid course - reads this table,
-- and falls back to its own presets only when the table returns nothing:
--
--     const usePresets = availableTimes.length === 0;
--     const timeOptions = usePresets
--       ? PRESET_TIMES                 // 09:00, 12:00, 15:00, 18:00, 20:00
--       : timesForDay.map(...)         // whatever is in this table
--
-- Five stale rows are enough to switch that off. What a student is offered
-- today, filtered to the weekday they choose:
--
--     Sunday        6:30 PM  and  11:00 PM
--     Tuesday       12:30 AM
--     Wednesday     5:30 PM
--     Saturday      4:00 PM
--     Mon/Thu/Fri   nothing at all - "no times available" and a WhatsApp link
--
-- Half past midnight is being offered as a class time. Three days of the week
-- are dead ends. And the Sunday 18:30 and Wednesday 17:30 entries fall inside
-- private lessons that are genuinely happening (18:00-19:30 and 17:00-18:30
-- Cairo), so a student could ask for an hour already taken.
--
-- The same rows also feed scheduleSlotEngine.ts, which turns them into
-- Instagram and Facebook captions advertising class times. That generator is
-- manual and writes drafts, so nothing has been published - but it would have
-- advertised a Tuesday 12:30 AM class.
--
-- WHY is_available = false AND NOT DELETE. Every consumer filters on
--     .eq("is_available", true)
-- so hiding and deleting are indistinguishable to all of them. Hiding keeps
-- the rows, so this is reversible with a single UPDATE if any of these times
-- turn out to still mean something. Deleting to clear a UI is the worse trade
-- when every reader already checks the flag.
--
-- NOT TOUCHED: `teacher_availability_rules`. The Doo block (Mon-Fri
-- 10:00-19:00 Asia/Kuala_Lumpur) and the eight private-lesson blocks added in
-- 20260902060000 are unaffected.
--
-- TO REVERSE: UPDATE public.teacher_availability SET is_available = true
--             WHERE updated_at = '2026-09-02 07:00:00+00';
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.teacher_availability
   SET is_available = false,
       updated_at   = '2026-09-02 07:00:00+00'
 WHERE is_available = true;

-- ── Verification ────────────────────────────────────────────────────────────
-- The point of this migration is that the enrol flow sees an EMPTY list, which
-- is what flips it back to its presets. Assert exactly that, and assert the
-- rows still exist so the reversal above is real rather than aspirational.
DO $$
DECLARE
  v_visible integer;
  v_kept    integer;
  v_rules   integer;
BEGIN
  SELECT count(*) INTO v_visible
    FROM public.teacher_availability WHERE is_available = true;
  IF v_visible <> 0 THEN
    RAISE EXCEPTION 'enrol flow would still see % row(s); expected 0', v_visible;
  END IF;

  SELECT count(*) INTO v_kept FROM public.teacher_availability;
  IF v_kept < 5 THEN
    RAISE EXCEPTION 'expected the 5 rows to survive as hidden, found %', v_kept;
  END IF;

  -- The other availability system must be untouched: 12 seeded rows plus the
  -- 8 private-lesson blocks from 20260902060000.
  SELECT count(*) INTO v_rules FROM public.teacher_availability_rules;
  IF v_rules <> 20 THEN
    RAISE EXCEPTION 'teacher_availability_rules should still hold 20 rows, found %', v_rules;
  END IF;

  RAISE NOTICE 'availability: % rows hidden, enrol flow falls back to presets', v_kept;
END $$;

COMMIT;
