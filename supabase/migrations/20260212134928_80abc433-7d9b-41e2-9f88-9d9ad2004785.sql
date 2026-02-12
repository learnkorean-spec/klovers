
-- =============================================
-- Phase 1: Extend enrollments table (safe, additive)
-- =============================================

-- New columns on enrollments (skip if already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='sessions_total') THEN
    ALTER TABLE public.enrollments ADD COLUMN sessions_total integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='sessions_remaining') THEN
    ALTER TABLE public.enrollments ADD COLUMN sessions_remaining integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN stripe_payment_intent_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='matched_batch_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN matched_batch_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='matched_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN matched_at timestamptz;
  END IF;
END $$;

-- Backfill sessions from classes_included for existing rows
UPDATE public.enrollments
SET sessions_total = classes_included, sessions_remaining = classes_included
WHERE sessions_total = 0 AND classes_included > 0;

-- Indexes on enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_approval_payment ON public.enrollments (approval_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_matched_batch ON public.enrollments (matched_batch_id);

-- =============================================
-- courses table
-- =============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  level text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('PRIVATE', 'GROUP')),
  sessions_included integer NOT NULL DEFAULT 4,
  price_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT
  USING (true);

-- =============================================
-- batches table
-- =============================================
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id),
  level text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'FULL')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage batches" ON public.batches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active batches" ON public.batches FOR SELECT
  USING (status IN ('ACTIVE', 'FULL'));

-- =============================================
-- batch_members table
-- =============================================
CREATE TABLE IF NOT EXISTS public.batch_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.batches(id),
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.enrollments(id),
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.batch_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage batch members" ON public.batch_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own batch membership" ON public.batch_members FOR SELECT
  USING (auth.uid() = user_id);

-- Index for batch membership queries
CREATE INDEX IF NOT EXISTS idx_batch_members_batch ON public.batch_members (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_members_user ON public.batch_members (user_id);

-- FK from enrollments.matched_batch_id to batches
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_enrollments_matched_batch' AND table_name = 'enrollments'
  ) THEN
    ALTER TABLE public.enrollments
      ADD CONSTRAINT fk_enrollments_matched_batch
      FOREIGN KEY (matched_batch_id) REFERENCES public.batches(id);
  END IF;
END $$;
