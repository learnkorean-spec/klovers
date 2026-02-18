
CREATE TABLE public.level_group_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  group_id uuid NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.level_group_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage level_group_config"
  ON public.level_group_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read level_group_config"
  ON public.level_group_config FOR SELECT
  USING (true);
