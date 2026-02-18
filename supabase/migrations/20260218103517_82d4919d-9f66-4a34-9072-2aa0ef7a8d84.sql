
-- Step 1a: Clean weekday labels in schedule_options (strip time suffixes)
UPDATE public.schedule_options SET label = 'Friday'   WHERE label LIKE 'Friday%'   AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Monday'   WHERE label LIKE 'Monday%'   AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Thursday' WHERE label LIKE 'Thursday%' AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Sunday'   WHERE label LIKE 'Sunday%'   AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Tuesday'  WHERE label LIKE 'Tuesday%'  AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Wednesday' WHERE label LIKE 'Wednesday%' AND category = 'weekday';
UPDATE public.schedule_options SET label = 'Saturday' WHERE label LIKE 'Saturday%' AND category = 'weekday';

-- Step 1b: Create level_slot_config table
CREATE TABLE IF NOT EXISTS public.level_slot_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  slot_id uuid NOT NULL REFERENCES public.matching_slots(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(level, slot_id)
);

ALTER TABLE public.level_slot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage level_slot_config"
  ON public.level_slot_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read level_slot_config"
  ON public.level_slot_config FOR SELECT
  USING (true);
