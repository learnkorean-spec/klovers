-- Unit placement test for 세종한국어 1 (the book Klovers teaches from).
--
-- WHY A SECOND TABLE, NOT A COLUMN ON placement_tests:
--   public.placement_tests answers "which course LEVEL is this student?"
--   (hangul / l1…l6) and is written by the public, lead-capturing
--   /placement-test page. This table answers a different question — "which
--   UNIT of Sejong Korean 1 do they start from?" — is login-only, and carries
--   free-text writing plus audio that placement_tests has no shape for.
--   Overloading one table would have made both harder to read.
--
-- CALLERS CHECKED BEFORE WRITING THIS:
--   src/pages/UnitPlacementPage.tsx  — the only writer (one INSERT on submit)
--   src/pages/StudentDashboard.tsx   — reads the latest row for the card
--   Nothing else in src/ references unit_placement_tests.
--
-- SCORING NOTE: mcq_score is stored for reporting only. Placement is decided by
-- start_unit / failed_section — the first section the student did not pass. The
-- total is deliberately not the deciding value; see computeUnitPlacement().
--
-- suggested_level_key is advisory and intentionally has NO foreign key to
-- active_course_levels: nothing here writes profiles.course_level_key, and a
-- teacher confirms the level after reviewing the writing and speaking.

create table if not exists public.unit_placement_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book text not null default 'sejong1',

  -- auto-graded
  section_scores jsonb not null default '{}'::jsonb,   -- {"A":8,"B":9,...}
  mcq_score integer not null,
  start_unit text not null,                            -- prep | u1 | u4 | u7 | u10 | done
  failed_section text,                                 -- A..F, null when all passed
  suggested_level_key text,
  answers jsonb not null default '{}'::jsonb,          -- {"A1":2,"A2":0,...}

  -- teacher-marked
  writing jsonb not null default '[]'::jsonb,          -- [{id,prompt,text}]
  speaking_audio jsonb not null default '[]'::jsonb,   -- [{id,prompt,path}]
  writing_score integer,
  speaking_score integer,
  teacher_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists unit_placement_tests_user_idx
  on public.unit_placement_tests(user_id, created_at desc);

alter table public.unit_placement_tests enable row level security;

drop policy if exists "Users can insert own unit placement" on public.unit_placement_tests;
create policy "Users can insert own unit placement"
  on public.unit_placement_tests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own unit placement" on public.unit_placement_tests;
create policy "Users can view own unit placement"
  on public.unit_placement_tests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all unit placements" on public.unit_placement_tests;
create policy "Admins can view all unit placements"
  on public.unit_placement_tests for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Marking is an admin action. Students deliberately get no UPDATE policy: an
-- attempt is a record of what they did, and letting them edit it after seeing
-- the result would make the writing sample worthless.
drop policy if exists "Admins can mark unit placements" on public.unit_placement_tests;
create policy "Admins can mark unit placements"
  on public.unit_placement_tests for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- Speaking audio. Private bucket; objects are keyed <user_id>/<attempt_id>/<Hn>.webm
-- so the owner check is the first path segment.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'placement-audio', 'placement-audio', false, 10485760,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav']
)
on conflict (id) do nothing;

drop policy if exists "Users can upload own placement audio" on storage.objects;
create policy "Users can upload own placement audio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'placement-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read own placement audio" on storage.objects;
create policy "Users can read own placement audio"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'placement-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins can read all placement audio" on storage.objects;
create policy "Admins can read all placement audio"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'placement-audio'
    and public.has_role(auth.uid(), 'admin')
  );
