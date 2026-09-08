-- ============================================================================
-- P0-1 -- the games leaderboard was rendering a student's email address
-- Plan: claude/WEBSITE_UX_CRO_ACTION_PLAN_2026-09-07.md, section 4, item P0-1
--
-- WHAT WAS ACTUALLY WRONG
-- -----------------------
-- Not the RPCs' intent -- the comments on 20260830120000_games_leaderboard_rpcs
-- say "Returns first name only, never user_id", and that was the design. The
-- implementation of "first name" was:
--
--     coalesce(nullif(split_part(p.name, ' ', 1), ''), 'Student')
--
-- `split_part(..., ' ', 1)` takes everything up to the first SPACE. An email
-- address contains no space, so for any profile whose `name` is an email the
-- "first name" is the entire address -- passed through untouched to every
-- signed-in student on /games.
--
-- MEASURED AGAINST PRODUCTION, 2026-09-08
--   * 2 of 102 rows in public.profiles hold an email address in `name`
--   * one of them was rank 10 of the live all-time XP board, so the address
--     rendered for every authenticated visitor to the leaderboard
--   (the address is deliberately not written into this repository; it is
--    recoverable with:  select user_id from profiles where name like '%@%')
--
-- HOW IT GETS THERE: handle_new_user() copies raw_user_meta_data->>'full_name'
-- into profiles.name and never validates it, and ProfilePage lets a student
-- type anything into the name field. So this is not a one-off to be cleaned up
-- by hand -- the next student who types an email into "name" reproduces it.
-- The guard therefore belongs at the point of DISPLAY, which is here.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- It does not touch the two existing rows. Fixing stored data is a judgement
-- call about someone's account (do you blank it? guess a first name from it?)
-- and it is not needed to stop the leak -- after this migration those rows
-- render as 'Student'. Left for Re.
-- ============================================================================

begin;

-- ---------------------------------------------------------- the single rule
-- One function, so "what may be shown of a stored name" is defined once
-- instead of re-derived at each call site. The TypeScript mirror is
-- src/lib/displayName.ts -- change the two together.
--
-- Rules, in order:
--   1. take the first whitespace-separated token of the stored name
--   2. reject it if it contains '@'  -> an email, or a handle
--   3. reject it if it is only digits and phone punctuation -> a phone number
--   4. anything left is a first name; empty means we never had one
--
-- Rule 2 is deliberately applied to the TOKEN, not the whole string, so
-- 'Ahmed ahmed@example.com' still renders as 'Ahmed' rather than collapsing
-- a perfectly good first name into 'Student'.
create or replace function public.public_display_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  with t as (
    select trim(split_part(trim(coalesce(p_name, '')), ' ', 1)) as tok
  )
  select coalesce(
           nullif(
             case
               when tok like '%@%'            then ''   -- email / handle
               when tok ~ '^[-+0-9()._ ]+$'   then ''   -- phone-shaped
               else tok
             end,
             ''),
           'Student')
    from t;
$$;

comment on function public.public_display_name(text) is
  'The only sanctioned way to turn profiles.name into something shown to another user. Returns the first name, or ''Student'' when the stored value is an email, a phone number or empty. Mirrored in src/lib/displayName.ts.';

-- ------------------------------------------------------- apply it to the RPCs
-- Bodies are otherwise byte-for-byte the deployed definitions; the only change
-- in each is the display_name expression.

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
         public.public_display_name(p.name),
         p.avatar_url,
         t.total_xp,
         (t.user_id = auth.uid())
    from totals t
    left join public.profiles p on p.user_id = t.user_id
   order by t.total_xp desc
   limit least(greatest(p_limit, 1), 100);
$$;

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
         public.public_display_name(p.name),
         p.avatar_url,
         s.current_streak,
         (s.user_id = auth.uid())
    from public.student_streaks s
    left join public.profiles p on p.user_id = s.user_id
   where s.current_streak > 0
   order by s.current_streak desc
   limit least(greatest(p_limit, 1), 100);
$$;

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
         public.public_display_name(p.name),
         p.avatar_url,
         w.week_xp,
         (w.user_id = auth.uid())
    from wk w
    left join public.profiles p on p.user_id = w.user_id
   order by w.week_xp desc
   limit least(greatest(p_limit, 1), 100);
$$;

-- ------------------------------------------------------------------- grants
-- CREATE OR REPLACE does not reset a function's ACL, but this project's
-- pg_default_acl grants EXECUTE on new public functions to anon and
-- authenticated -- which is why the new helper must be revoked explicitly
-- rather than assumed safe. Same reasoning as
-- 20260902200000_rpc_authorization_gaps.sql.
--
-- The helper reads no table, so an anon caller could learn nothing from it,
-- but there is no reason for it to be reachable from PostgREST at all. The
-- three leaderboard RPCs are SECURITY DEFINER and execute as the owner, so
-- they can call it regardless of what `authenticated` may do.
revoke all on function public.public_display_name(text) from public, anon, authenticated;

revoke all on function public.get_xp_leaderboard(int)     from public, anon;
revoke all on function public.get_streak_leaderboard(int) from public, anon;
revoke all on function public.get_weekly_leaderboard(int) from public, anon;

grant execute on function public.get_xp_leaderboard(int)     to authenticated;
grant execute on function public.get_streak_leaderboard(int) to authenticated;
grant execute on function public.get_weekly_leaderboard(int) to authenticated;

comment on function public.get_xp_leaderboard(int) is
  'All-time XP leaderboard. SECURITY DEFINER so it aggregates above the own-row RLS on student_xp. Display name is sanitised by public_display_name(); never returns user_id, an email or a phone number.';
comment on function public.get_streak_leaderboard(int) is
  'Current-streak leaderboard. SECURITY DEFINER for the same reason. Display name is sanitised by public_display_name().';
comment on function public.get_weekly_leaderboard(int) is
  'XP earned since the start of the current Africa/Cairo week. Display name is sanitised by public_display_name().';

commit;

-- ============================================================================
-- VERIFY AFTER APPLY (expect zero rows from each)
--
--   select display_name from public.get_xp_leaderboard(100)
--    where display_name like '%@%';
--   select display_name from public.get_streak_leaderboard(100)
--    where display_name like '%@%';
--   select display_name from public.get_weekly_leaderboard(100)
--    where display_name like '%@%';
--
-- And the rows that were leaking should now read 'Student':
--   select public.public_display_name(name) from public.profiles
--    where name like '%@%';
-- ============================================================================
