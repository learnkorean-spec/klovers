-- Interview Training Sessions table
CREATE TABLE public.interview_training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  years_experience int NOT NULL DEFAULT 0,
  industry text,
  languages_spoken text[] DEFAULT '{}',
  questions jsonb DEFAULT '[]'::jsonb,
  free_used int NOT NULL DEFAULT 0,
  paid_purchased int NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'none' CHECK (payment_status IN ('none','pending','paid')),
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own" ON public.interview_training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own" ON public.interview_training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own" ON public.interview_training_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_interview_sessions_user ON public.interview_training_sessions(user_id);
