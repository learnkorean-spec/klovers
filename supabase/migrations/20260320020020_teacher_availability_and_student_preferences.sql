-- Create teacher_availability table for managing teacher schedule slots
-- Supports multi-teacher architecture (teacher_id can be extended for multiple teachers)

CREATE TABLE teacher_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL, -- HH:MM format (e.g., '10:00', '15:00')
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, day_of_week, start_time)
);

-- Index for faster queries by teacher
CREATE INDEX idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);

-- Index for faster queries by day/time
CREATE INDEX idx_teacher_availability_day_time ON teacher_availability(day_of_week, start_time)
WHERE is_available = true;

-- Add columns to student_package_preferences for capturing student preferences
ALTER TABLE student_package_preferences
ADD COLUMN IF NOT EXISTS preferred_day_of_week int CHECK (preferred_day_of_week IS NULL OR (preferred_day_of_week >= 0 AND preferred_day_of_week <= 6)),
ADD COLUMN IF NOT EXISTS preferred_start_time text; -- HH:MM format

-- Create index for quick preference lookups
CREATE INDEX IF NOT EXISTS idx_student_preferences_day_time
ON student_package_preferences(preferred_day_of_week, preferred_start_time)
WHERE preferred_day_of_week IS NOT NULL;

-- Enable RLS for teacher_availability table
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

-- Admins can view/edit teacher availability
CREATE POLICY "Admins can view teacher availability" ON teacher_availability
  FOR SELECT USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM profiles WHERE id IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  ));

CREATE POLICY "Admins can insert teacher availability" ON teacher_availability
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM profiles WHERE id IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  ));

CREATE POLICY "Admins can update teacher availability" ON teacher_availability
  FOR UPDATE USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM profiles WHERE id IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  ));

CREATE POLICY "Admins can delete teacher availability" ON teacher_availability
  FOR DELETE USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM profiles WHERE id IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  ));

-- Students can view available teacher times
CREATE POLICY "Public can view available teacher times" ON teacher_availability
  FOR SELECT USING (is_available = true);
