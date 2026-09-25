-- 20260925140000_teacher_brief.sql
--
-- WHY
-- ---
-- Re, 25 Sep 2026: "as a teacher why i dont get a reminding email 1 day before
-- the class with the book and link and all who will be in the class".
--
-- Because no such email existed. Twenty templates in email_logs, every one of
-- them addressed to a student. This adds the first one addressed to the teacher,
-- plus the table that will hold the books.
--
-- WHAT THIS ADDS
-- --------------
-- 1. public.class_books   — title/url per (level, language). Deliberately the
--                           seed of the admin books library: the student
--                           dashboard will read these same rows, so the book Re
--                           sees in her brief and the book the student opens
--                           cannot drift apart.
-- 2. trigger_teacher_brief() — same shape as trigger_weekly_report().
-- 3. teacher-brief-hourly    — pg_cron, hourly at :55. The function itself
--                              decides whether this is the 09:00-Cairo tick,
--                              exactly as send-weekly-report does, so the
--                              schedule stays correct across the DST boundary.
--
-- NO EMAIL IS SENT BY THIS MIGRATION. The first brief goes out at the next
-- 09:00 Cairo, and only if there is a class the following day.
--
-- class_books ships EMPTY. A level with no row renders "—" in the brief. That
-- is intended: an invented book title is worse than a blank.
--
-- UNDO
-- ----
--   select cron.unschedule('teacher-brief-hourly');
--   drop function if exists public.trigger_teacher_brief();
--   drop table if exists public.class_books;

create table if not exists public.class_books (
  id         bigserial primary key,
  level      text not null,
  language   text not null default 'any',
  title      text not null,
  url        text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_books_level_language_key unique (level, language)
);

comment on table public.class_books is
  'The book for a class, keyed by (level, language). level is ''hangul'', '
  '''level_1''..''level_6'' or ''trial''; language is ''arabic'', ''english'' or '
  '''any'' as the fallback. Read by send-teacher-brief, and intended to be the '
  'same source the student dashboard reads, so teacher and student never see '
  'different books.';

alter table public.class_books enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename  = 'class_books'
       and policyname = 'class_books_admin_all'
  ) then
    create policy class_books_admin_all
      on public.class_books
      for all
      to authenticated
      using      (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

-- Admin-only for now. When the student dashboard lands it needs its own read
-- policy; that belongs in the PR that builds the dashboard, not guessed here.

create or replace function public.trigger_teacher_brief()
 returns void
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public'
as $function$
begin
  perform app_private.invoke_edge('send-teacher-brief', '{}'::jsonb, true, 60000);
end $function$;

comment on function public.trigger_teacher_brief() is
  'Hourly pg_cron entry point for send-teacher-brief. The function itself gates '
  'on the Cairo-local hour, so this fires every hour and sends at most once a day.';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'teacher-brief-hourly') then
    perform cron.unschedule('teacher-brief-hourly');
  end if;
  perform cron.schedule(
    'teacher-brief-hourly',
    '55 * * * *',
    'select public.trigger_teacher_brief()'
  );
end $$;
