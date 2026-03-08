
CREATE TABLE public.lesson_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  korean text NOT NULL,
  romanization text NOT NULL DEFAULT '',
  meaning text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.lesson_grammar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  structure text NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  examples jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.lesson_dialogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  korean text NOT NULL,
  romanization text NOT NULL DEFAULT '',
  english text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.lesson_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  explanation text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.lesson_reading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id integer NOT NULL REFERENCES public.textbook_lessons(id) ON DELETE CASCADE,
  korean_text text NOT NULL,
  english_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

-- RLS for all tables
ALTER TABLE public.lesson_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson_vocabulary" ON public.lesson_vocabulary FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson_vocabulary" ON public.lesson_vocabulary FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view lesson_grammar" ON public.lesson_grammar FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson_grammar" ON public.lesson_grammar FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view lesson_dialogues" ON public.lesson_dialogues FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson_dialogues" ON public.lesson_dialogues FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view lesson_exercises" ON public.lesson_exercises FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson_exercises" ON public.lesson_exercises FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view lesson_reading" ON public.lesson_reading FOR SELECT USING (true);
CREATE POLICY "Admins can manage lesson_reading" ON public.lesson_reading FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
