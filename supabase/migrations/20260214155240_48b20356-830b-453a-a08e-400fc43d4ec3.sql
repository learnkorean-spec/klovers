
-- 1. Extend student_groups with scheduling fields
ALTER TABLE public.student_groups
  ADD COLUMN IF NOT EXISTS schedule_day text,
  ADD COLUMN IF NOT EXISTS schedule_time text,
  ADD COLUMN IF NOT EXISTS schedule_timezone text DEFAULT 'Africa/Cairo',
  ADD COLUMN IF NOT EXISTS level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS course_type text DEFAULT 'group',
  ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 10;

-- 2. Create student_schedule_preferences table
CREATE TABLE IF NOT EXISTS public.student_schedule_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  level text DEFAULT '',
  group_id uuid REFERENCES public.student_groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_schedule_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule preference"
  ON public.student_schedule_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule preference"
  ON public.student_schedule_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule preference"
  ON public.student_schedule_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all schedule preferences"
  ON public.student_schedule_preferences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_schedule_preferences_updated_at
  BEFORE UPDATE ON public.student_schedule_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  related_user_id uuid,
  related_group_id uuid REFERENCES public.student_groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications"
  ON public.admin_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add member_status to batch_members
ALTER TABLE public.batch_members
  ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'active';
