
CREATE TABLE public.textbook_lessons (
  id serial PRIMARY KEY,
  emoji text NOT NULL DEFAULT '',
  title_en text NOT NULL,
  title_ko text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.textbook_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lessons"
  ON public.textbook_lessons
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage textbook_lessons"
  ON public.textbook_lessons
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
