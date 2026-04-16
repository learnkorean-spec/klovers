-- =====================================================================
-- Trial slots capacity bump (2026-04-17)
--
-- Increase capacity from 6 → 8 for both active trial slots:
--     • Wednesday 17:30 Africa/Cairo
--     • Sunday    18:30 Africa/Cairo
-- =====================================================================

BEGIN;

UPDATE public.trial_slots
SET capacity   = 8,
    updated_at = now()
WHERE is_active = true
  AND (
    (day_of_week = 3 AND start_time = '17:30' AND timezone = 'Africa/Cairo') OR
    (day_of_week = 0 AND start_time = '18:30' AND timezone = 'Africa/Cairo')
  );

COMMIT;
