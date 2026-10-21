-- Teacher onboarding system, covering every course level the platform offers.
--
-- Nothing like this existed before: `teacher_availability`, `teacher_students`
-- etc. are all scoped to the one current teacher (Re) and carry no onboarding
-- or roster concept. This adds a real teacher roster plus, per teacher, a
-- checklist tracked against every course level in `course_levels` (the
-- canonical l1..l6 + hangul keys — see src/constants/levels.ts).
--
-- Design notes:
--   * `teachers` is independent of `user_roles`/`app_role` — a teacher can be
--     added (and onboarded) before they have a Supabase login at all, and
--     `app_role` has no 'teacher' value today. `user_id` is filled in once an
--     account exists, and is what lets a teacher read (never write) their own
--     rows.
--   * `teacher_course_progress` is one row per (teacher, course) the teacher
--     is being onboarded for or already teaches.
--   * `teacher_onboarding_steps` is a shared catalogue. A `general` step is
--     instantiated once per teacher; a `per_course` step is instantiated once
--     per teacher PER assigned course.
--   * `teacher_onboarding_progress.course_level_key` uses '' (empty string),
--     not NULL, as the "general step" sentinel — NULL can't be the target of
--     a plain UNIQUE constraint (two NULLs are never equal), and the app
--     needs a plain (teacher_id, step_id, course_level_key) upsert target.
--     It is therefore NOT a foreign key to course_levels (only non-'' values
--     would be valid course keys); every writer is this feature's own code.

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  status text not null default 'onboarding'
    check (status in ('onboarding', 'active', 'paused', 'offboarded')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.teachers is
  'Teacher roster. Independent of user_roles — a teacher can exist, and be onboarded, before they have a login.';

create unique index teachers_email_key on public.teachers (lower(email));
create index teachers_user_id_idx on public.teachers (user_id) where user_id is not null;

create trigger tg_teachers_touch
  before update on public.teachers
  for each row execute function public.update_updated_at_column();

alter table public.teachers enable row level security;

create policy "Admins manage teachers"
  on public.teachers for all
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

create policy "Teachers read their own roster row"
  on public.teachers for select
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------

create table public.teacher_course_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  course_level_key text not null references public.course_levels(key),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'ready', 'active')),
  started_at timestamptz,
  ready_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, course_level_key)
);

comment on table public.teacher_course_progress is
  'One row per (teacher, course level) a teacher is being onboarded for or already teaches.';

create index teacher_course_progress_teacher_idx on public.teacher_course_progress (teacher_id);

create trigger tg_teacher_course_progress_touch
  before update on public.teacher_course_progress
  for each row execute function public.update_updated_at_column();

alter table public.teacher_course_progress enable row level security;

create policy "Admins manage teacher course progress"
  on public.teacher_course_progress for all
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

create policy "Teachers read their own course progress"
  on public.teacher_course_progress for select
  using (teacher_id in (select id from public.teachers where user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------

create table public.teacher_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title_en text not null,
  title_ar text not null,
  description_en text,
  description_ar text,
  scope text not null default 'general' check (scope in ('general', 'per_course')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.teacher_onboarding_steps is
  'Checklist catalogue. scope=general -> once per teacher. scope=per_course -> once per teacher per assigned course.';

alter table public.teacher_onboarding_steps enable row level security;

create policy "Authenticated users read onboarding steps"
  on public.teacher_onboarding_steps for select
  using (auth.role() = 'authenticated');

create policy "Admins manage onboarding steps"
  on public.teacher_onboarding_steps for all
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

-- ---------------------------------------------------------------------------

create table public.teacher_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  step_id uuid not null references public.teacher_onboarding_steps(id) on delete cascade,
  course_level_key text not null default '',
  is_done boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, step_id, course_level_key)
);

comment on table public.teacher_onboarding_progress is
  'Per-teacher checklist state. course_level_key = '''' for a general step, a course_levels.key for a per-course step.';

create index teacher_onboarding_progress_teacher_idx on public.teacher_onboarding_progress (teacher_id);

create trigger tg_teacher_onboarding_progress_touch
  before update on public.teacher_onboarding_progress
  for each row execute function public.update_updated_at_column();

alter table public.teacher_onboarding_progress enable row level security;

create policy "Admins manage onboarding progress"
  on public.teacher_onboarding_progress for all
  using (has_role((select auth.uid()), 'admin'::app_role))
  with check (has_role((select auth.uid()), 'admin'::app_role));

create policy "Teachers read their own onboarding progress"
  on public.teacher_onboarding_progress for select
  using (teacher_id in (select id from public.teachers where user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Seed the step catalogue. Re-runnable: `on conflict (key) do nothing`.

insert into public.teacher_onboarding_steps
  (key, title_en, title_ar, description_en, description_ar, scope, sort_order)
values
  ('contract_signed', 'Contract & agreement signed', 'توقيع العقد والاتفاقية',
   'Teaching agreement, pay terms and policies signed by both sides.',
   'توقيع اتفاقية التدريس وشروط الدفع والسياسات من الطرفين.', 'general', 10),
  ('account_created', 'Platform account created', 'إنشاء حساب على المنصة',
   'Login created on the admin panel and access verified.',
   'تم إنشاء حساب تسجيل الدخول على لوحة التحكم والتحقق من الوصول.', 'general', 20),
  ('platform_walkthrough', 'Admin panel walkthrough completed', 'إتمام شرح لوحة التحكم',
   'Walked through My Students, Scheduling and Availability with an existing teacher or admin.',
   'تم شرح أقسام الطلاب والجدولة والتوفر مع مدرّس أو مسؤول حالي.', 'general', 30),
  ('policies_ack', 'Teaching policies acknowledged', 'الإقرار بسياسات التدريس',
   'Attendance, cancellation and communication policies reviewed and acknowledged.',
   'تمت مراجعة سياسات الحضور والإلغاء والتواصل والإقرار بها.', 'general', 40),
  ('curriculum_review', 'Curriculum & materials reviewed', 'مراجعة المنهج والمواد',
   'Reviewed the textbook, lesson plan and materials for this course.',
   'تمت مراجعة الكتاب وخطة الدرس ومواد هذا المستوى.', 'per_course', 50),
  ('shadow_class', 'Shadowed a live class', 'حضور صف مباشر كمراقب',
   'Observed a live class at this level before teaching it.',
   'تمت مشاهدة صف مباشر في هذا المستوى قبل تدريسه.', 'per_course', 60),
  ('mock_class', 'Led a mock/practice class', 'تقديم صف تجريبي',
   'Led a practice class at this level, reviewed with an admin.',
   'تم تقديم صف تجريبي في هذا المستوى ومراجعته مع المسؤول.', 'per_course', 70),
  ('approved_to_teach', 'Approved to teach this course', 'تمت الموافقة على التدريس',
   'An admin has signed off that this teacher is ready to teach this course level live.',
   'وافق المسؤول على جاهزية المدرّس لتدريس هذا المستوى فعليًا.', 'per_course', 80)
on conflict (key) do nothing;
