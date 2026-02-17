
-- Table to store admin-editable schedule preference options
CREATE TABLE public.schedule_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('weekday', 'time_window', 'start_option')),
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_options ENABLE ROW LEVEL SECURITY;

-- Anyone can read active options
CREATE POLICY "Anyone can read schedule_options"
  ON public.schedule_options FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage schedule_options"
  ON public.schedule_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default weekdays
INSERT INTO public.schedule_options (category, label, sort_order) VALUES
  ('weekday', 'Monday', 1),
  ('weekday', 'Tuesday', 2),
  ('weekday', 'Wednesday', 3),
  ('weekday', 'Thursday', 4),
  ('weekday', 'Friday', 5),
  ('weekday', 'Saturday', 6),
  ('weekday', 'Sunday', 7);

-- Seed default time windows
INSERT INTO public.schedule_options (category, label, sort_order) VALUES
  ('time_window', 'Morning (9am–12pm)', 1),
  ('time_window', 'Afternoon (12pm–5pm)', 2),
  ('time_window', 'Evening (5pm–9pm)', 3);

-- Seed default start options
INSERT INTO public.schedule_options (category, label, sort_order) VALUES
  ('start_option', 'ASAP', 1),
  ('start_option', 'Next week', 2),
  ('start_option', 'Specific date', 3);
