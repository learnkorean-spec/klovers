-- ============================================================================
-- G1 step 1 — Leaderboard RPCs
-- Plan: claude/GAMES_OPTIMIZATION_PLAN.md v4.3, section G1
--
-- WHY: public.xp_leaderboard is a view with security_invoker = true. RLS on
-- student_xp is own-row-only, so the view's GROUP BY collapses to a single
-- group -- every student sees a leaderboard containing only herself. Same for
-- the streak tab (student_streaks RLS is own-row-only).
--
-- These SECURITY DEFINER functions aggregate above RLS and return ONLY what a
-- leaderboard needs: first name, avatar, total, rank, is_me. No user_id ever
-- leaves the server.
--
-- ADDITIVE. Nothing is dropped here. The view stays until the frontend is live
-- (see 20260830900000_drop_xp_leaderboard_view.sql.PENDING).
-- ============================================================================

-- ---------------------------------------------------------------- XP (all time)
create or replace function public.get_xp_leaderboard(p_limit int default 50)
returns table (
  rank         int,
  display_name text,
  avatar_url   text,
  total_xp     int,
  is_me        boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select sx.user_id,
           coalesce(sum(sx.xp_earned), 0)::int as total_xp
      from public.student_xp sx
     group by sx.user_id
  )
  select (row_number() over (order by t.total_xp desc))::int,
         coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Student'),
         p.avatar_url,
         t.total_xp,
         (t.user_id = auth.uid())
    from totals t
    left join public.profiles p on p.user_id = t.user_id
   order by t.total_xp desc
   limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------- Streak
create or replace function public.get_streak_leaderboard(p_limit int default 50)
returns table (
  rank           int,
  display_name   text,
  avatar_url     text,
  current_streak int,
  is_me          boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select (row_number() over (order by s.current_streak desc))::int,
         coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Student'),
         p.avatar_url,
         s.current_streak,
         (s.user_id = auth.uid())
    from public.student_streaks s
    left join public.profiles p on p.user_id = s.user_id
   where s.current_streak > 0
   order by s.current_streak desc
   limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------- This week
-- Week boundary is Africa/Cairo wall clock, NOT UTC and NOT the device.
-- Both sides of the comparison are timestamp-without-tz in Cairo local time --
-- comparing a timestamptz against a naive timestamp would silently use the
-- server timezone instead.
create or replace function public.get_weekly_leaderboard(p_limit int default 50)
returns table (
  rank         int,
  display_name text,
  avatar_url   text,
  week_xp      int,
  is_me        boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with wk as (
    select sx.user_id,
           sum(sx.xp_earned)::int as week_xp
      from public.student_xp sx
     where (sx.created_at at time zone 'Africa/Cairo')
           >= date_trunc('week', (now() at time zone 'Africa/Cairo'))
     group by sx.user_id
  )
  select (row_number() over (order by w.week_xp desc))::int,
         coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Student'),
         p.avatar_url,
         w.week_xp,
         (w.user_id = auth.uid())
    from wk w
    left join public.profiles p on p.user_id = w.user_id
   order by w.week_xp desc
   limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------- My rank
-- A student outside p_limit gets no row from the functions above, so the client
-- has nothing to render "Your rank: #73" from. row_number() alone does NOT fix
-- that -- this does. Cheap now; annoying to retrofit at 51+ ranked students.
create or replace function public.get_my_xp_rank()
returns table (
  rank     int,
  total_xp int,
  out_of   int
)
language sql
stable
security definer
set search_path = ''
as $$
  with totals as (
    select sx.user_id,
           sum(sx.xp_earned)::int as total_xp
      from public.student_xp sx
     group by sx.user_id
  ), ranked as (
    select t.user_id,
           t.total_xp,
           (row_number() over (order by t.total_xp desc))::int as rk,
           (count(*) over ())::int as n
      from totals t
  )
  select r.rk, r.total_xp, r.n
    from ranked r
   where r.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------- My streak rank
-- Companion to get_my_xp_rank(). The hook returns BOTH currentUserXpRank and
-- currentUserStreakRank (LeaderboardCard renders "Your streak rank: #N" gated
-- on > 10). Shipping only the XP companion would close the rank cliff on one
-- tab and leave it open on the other -- asymmetric, and the asymmetry would be
-- invisible until the 51st ranked student.
create or replace function public.get_my_streak_rank()
returns table (
  rank           int,
  current_streak int,
  out_of         int
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select s.user_id,
           s.current_streak,
           (row_number() over (order by s.current_streak desc))::int as rk,
           (count(*) over ())::int as n
      from public.student_streaks s
     where s.current_streak > 0
  )
  select r.rk, r.current_streak, r.n
    from ranked r
   where r.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------- Grants
-- Postgres grants EXECUTE to PUBLIC by default. Revoke first, then grant
-- narrowly -- otherwise anon can call these.
revoke all on function public.get_xp_leaderboard(int)     from public, anon;
revoke all on function public.get_streak_leaderboard(int) from public, anon;
revoke all on function public.get_weekly_leaderboard(int) from public, anon;
revoke all on function public.get_my_xp_rank()            from public, anon;
revoke all on function public.get_my_streak_rank()        from public, anon;

grant execute on function public.get_xp_leaderboard(int)     to authenticated;
grant execute on function public.get_streak_leaderboard(int) to authenticated;
grant execute on function public.get_weekly_leaderboard(int) to authenticated;
grant execute on function public.get_my_xp_rank()            to authenticated;
grant execute on function public.get_my_streak_rank()        to authenticated;

comment on function public.get_xp_leaderboard(int) is
  'All-time XP leaderboard. SECURITY DEFINER so it aggregates above the own-row RLS on student_xp. Returns first name only, never user_id.';
comment on function public.get_streak_leaderboard(int) is
  'Current-streak leaderboard. SECURITY DEFINER for the same reason. Returns first name only, never user_id.';
comment on function public.get_weekly_leaderboard(int) is
  'XP earned since the start of the current Africa/Cairo week. Replaces the client query that selected the non-existent column xp_amount.';
comment on function public.get_my_xp_rank() is
  'The caller''s own rank and total, regardless of whether they fall inside the leaderboard limit.';
