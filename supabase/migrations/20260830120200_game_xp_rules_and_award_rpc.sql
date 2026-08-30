-- ============================================================================
-- G3a -- Server-side XP for games
-- Plan: claude/GAMES_OPTIMIZATION_PLAN.md v4.3, section G3a
--
-- WHY: the INSERT policy on student_xp checks only WHO the row belongs to. It
-- does not validate xp_earned, activity_type or frequency, so a student can
-- insert any amount from the browser console. This moves the arithmetic to the
-- server.
--
-- SCOPE: games only. This migration changes NO policy and revokes NOTHING --
-- the four other client write paths (streak_bonus, awardXp's twelve activity
-- types, daily_bonus, attendance_*) are 41.4% of all XP ever written and are
-- ported in G3b. The policy swap is G3c, and only after both are verified.
--
-- ⚠️ THIS MUST BE A NO-OP ON AWARD AMOUNTS. Every number in the seed below is
-- derived from source and cross-checked against production, not chosen. See the
-- parity table at the bottom of this file. Moving scoring server-side is a
-- security refactor; changing what a game pays is a separate, deliberate PR.
--
-- ⚠️ NO UNIQUE INDEX. An earlier draft added a one-play-per-game-per-day unique
-- index. It fails against live data (12 duplicate groups, 20 surplus rows) and,
-- had it succeeded, would have blocked 13 of the 20 plays in the single most
-- engaged session in the platform's history. A replay cap is a product decision,
-- not something a constraint named "duplicate prevention" should smuggle in.
-- The score clamp below is the real fix.
-- ============================================================================

-- ---------------------------------------------------------------- Rules table
create table if not exists public.game_xp_rules (
  game_id      text primary key,          -- 'match', NOT 'game_match'
  xp_per_round int     not null check (xp_per_round between 0 and 50),
  max_rounds   int     not null check (max_rounds between 1 and 100),
  is_active    boolean not null default true
);

-- Clients never read this table directly; the SECURITY DEFINER function below
-- reads it as the table owner, which bypasses RLS.
alter table public.game_xp_rules enable row level security;
revoke all on table public.game_xp_rules from anon, authenticated;

-- ---------------------------------------------------------------- Seed
-- ⚠️ LOAD-BEARING, AND IT BELONGS IN THIS MIGRATION.
-- award_game_xp raises on a missing row and this table starts empty. If the
-- function ships without the seed, ALL game XP stops on the next deploy rather
-- than degrading.
--
-- xp_per_round = 5 everywhere: XP_VALUES.game_complete is 5
-- (src/constants/gamification.ts:23). Production confirms it -- every game XP
-- row ever written is divisible by 5.
--
-- max_rounds is each game's REAL ceiling, not a round number:
--   hangul    18 -- HangulQuizGame.tsx:109 gives 2 points at a 3+ streak,
--                  so a perfect run is 1 + 1 + (8 x 2) = 18.
--                  Production: five rows at exactly 90 XP, nothing above.
--   flashcard 12 -- FlashcardGame.tsx:44 slice(0, 12); :57 passes cards.length.
--                  Ceiling has never been reached in production (best is 7),
--                  so a wrong value here would UNDERPAY silently.
--   match      6 -- KoreanMatchGame.tsx:73 pairCount = 6; :106 passes it.
--                  Production: all 11 rows exactly 30 XP.
--   sentence   8 -- SentenceBuilderGame.tsx:45 const rounds = 8.
--   the other 16 use totalRounds = 10.
insert into public.game_xp_rules (game_id, xp_per_round, max_rounds) values
  -- four exceptions
  ('match',         5,  6),
  ('hangul',        5, 18),
  ('sentence',      5,  8),
  ('flashcard',     5, 12),
  -- the sixteen that really do use totalRounds = 10
  ('numbers',       5, 10),
  ('colors',        5, 10),
  ('verbs',         5, 10),
  ('greetings',     5, 10),
  ('opposites',     5, 10),
  ('fillblank',     5, 10),
  ('scramble',      5, 10),
  ('counters',      5, 10),
  ('kdrama',        5, 10),
  ('time',          5, 10),
  ('typekorean',    5, 10),
  ('romanization',  5, 10),
  ('speedread',     5, 10),
  ('readingchoice', 5, 10),
  ('sentenceread',  5, 10),
  ('phonics',       5, 10),
  -- not a game: the "Vocab of the day" claim button on the dashboard.
  -- 5 x 5 = 25, which is what production has awarded 12 times.
  -- ⚠️ OPEN QUESTION Q2: StudentDashboard.tsx:740 renders "Claim +5 XP" while
  -- the code awards 25. This seed preserves the LIVE behaviour (25). To make
  -- the button honest instead, it is one statement:
  --   update public.game_xp_rules set xp_per_round = 1 where game_id = 'vocab_daily';
  ('vocab_daily',   5,  5)
on conflict (game_id) do nothing;

-- ---------------------------------------------------------------- Award RPC
create or replace function public.award_game_xp(p_game_id text, p_score int)
returns table (awarded int, total_today int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  r     public.game_xp_rules;
  v_uid uuid := auth.uid();
  v_xp  int;
begin
  -- Without this, SECURITY DEFINER hits a NOT NULL violation for an anon
  -- caller instead of failing cleanly.
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into r
    from public.game_xp_rules
   where game_id = p_game_id and is_active;

  if not found then
    raise exception 'unknown or inactive game: %', p_game_id using errcode = '22023';
  end if;

  -- The client cannot inflate the score past the game's own round count.
  -- coalesce guards a null score; greatest guards a negative one.
  v_xp := least(greatest(coalesce(p_score, 0), 0), r.max_rounds) * r.xp_per_round;

  -- No ON CONFLICT: there is no unique index to conflict on, and an earlier
  -- draft's "on conflict do nothing" made the function report an award it had
  -- not written -- the client would show "+50 XP!" while the leaderboard sat
  -- still. Exactly the silent-failure shape this whole plan exists to remove.
  insert into public.student_xp (user_id, activity_type, xp_earned)
  values (v_uid, 'game_' || p_game_id, v_xp);

  return query
    select v_xp,
           coalesce(sum(sx.xp_earned), 0)::int
      from public.student_xp sx
     where sx.user_id = v_uid
       and (sx.created_at at time zone 'Africa/Cairo')::date
         = (now()          at time zone 'Africa/Cairo')::date;
end;
$$;

revoke all    on function public.award_game_xp(text, int) from public, anon;
grant  execute on function public.award_game_xp(text, int) to authenticated;

comment on function public.award_game_xp(text, int) is
  'Server-authoritative game XP. Takes a game id (not an activity_type) and builds "game_<id>" internally, so runtime-generated activity types keep working. Clamps score to the game''s real round ceiling. Daily total is computed on the Africa/Cairo calendar day.';

-- ============================================================================
-- AWARD-PARITY CHECK -- run on a TEST ACCOUNT before G3b starts.
--
-- With 2 weekly active students, waiting to observe a real play is not viable:
-- a real flashcard run at score 12 may not occur for months, and it is the one
-- row where a wrong ceiling underpays rather than merely failing to bind.
--
--   select * from public.award_game_xp('match',        6);  -- awarded = 30
--   select * from public.award_game_xp('hangul',      18);  -- awarded = 90
--   select * from public.award_game_xp('sentence',     8);  -- awarded = 40
--   select * from public.award_game_xp('flashcard',   12);  -- awarded = 60
--   select * from public.award_game_xp('numbers',     10);  -- awarded = 50
--   select * from public.award_game_xp('vocab_daily',  5);  -- awarded = 25
--
-- Clamp behaviour:
--   select * from public.award_game_xp('match',      999);  -- awarded = 30
--   select * from public.award_game_xp('numbers',     -5);  -- awarded = 0
--   select * from public.award_game_xp('does_not_exist', 1); -- raises 22023
--
-- Then delete the test rows (they belong to the test account only):
--   delete from public.student_xp where user_id = '<test-account-uuid>';
-- ============================================================================
