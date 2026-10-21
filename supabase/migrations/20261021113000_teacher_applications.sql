-- Public "Teach with Klovers" applications.
--
-- Separate from `teachers` (the internal onboarding roster added in
-- 20261021050526_teacher_onboarding.sql) on purpose: this table is the public
-- intake, writable by anyone on the internet via the homepage "Join Our
-- Teaching Team" CTA (src/pages/TeachWithUsPage.tsx). `teachers` is the
-- admin-managed roster of people already being onboarded. An admin reviews a
-- row here and, on acceptance, creates the matching `teachers` row themselves
-- (src/components/admin/TeacherOnboardingManager.tsx) — nothing here writes
-- to `teachers` directly, and nothing public can read or edit this table.

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  -- Course level keys the applicant says they can teach (hangul, l1..l6 —
  -- see src/constants/levels.ts). Not a foreign key to course_levels: an
  -- applicant may tick levels before an admin has validated anything, and a
  -- stray/typo'd key here should never block the insert of the application
  -- itself.
  course_levels text[] not null default '{}'::text[],
  years_experience text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'rejected')),
  admin_notes text,
  -- Set once an admin accepts this application and creates the matching
  -- `teachers` row, so the application keeps a record of where it led.
  created_teacher_id uuid references public.teachers(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One pending application per email at a time — lets someone resubmit after
-- a typo without the admin list filling with duplicates, but still allows a
-- genuine re-application once a prior one has been reviewed (accepted/
-- rejected), same idea as trial_bookings' "one active trial per email".
create unique index if not exists idx_teacher_applications_unique_pending_email
  on public.teacher_applications (lower(email)) where status = 'new';

create index if not exists idx_teacher_applications_status
  on public.teacher_applications (status, created_at desc);

alter table public.teacher_applications enable row level security;

drop policy if exists "Anyone can submit a teacher application" on public.teacher_applications;
create policy "Anyone can submit a teacher application"
  on public.teacher_applications for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins manage teacher applications" on public.teacher_applications;
create policy "Admins manage teacher applications"
  on public.teacher_applications for all
  to authenticated
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

drop trigger if exists tg_teacher_applications_touch on public.teacher_applications;
create trigger tg_teacher_applications_touch
  before update on public.teacher_applications
  for each row execute function public.update_updated_at_column();

notify pgrst, 'reload schema';
