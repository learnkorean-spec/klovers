-- ============================================================================
-- G2 -- Index student_xp on (user_id, created_at desc)
-- Plan: claude/GAMES_OPTIMIZATION_PLAN.md v4.3, section G2
--
-- Today the only non-PK index on student_xp is idx_fk_student_xp_lesson_id.
-- Every XP lookup, every RLS policy evaluation, and all four new leaderboard
-- RPCs aggregate by user_id -- all sequential scans.
--
-- NOT "CONCURRENTLY" on purpose: the Apply Migrations workflow runs statements
-- inside a transaction and CREATE INDEX CONCURRENTLY cannot run in one. At the
-- current row count the plain form locks for well under a millisecond.
-- Revisit if this table ever passes ~100k rows.
--
-- ⚠️ NOTE FOR THE REVIEWER (not a blocker for this migration):
-- supabase/migrations/20260425000001_performance_indexes.sql declares EIGHT
-- indexes and its header says "Applied: 2026-04-25". NONE of them exist in
-- production -- including idx_student_xp_user_id and idx_student_xp_user_activity.
-- That whole migration appears never to have been applied. Anyone grepping the
-- repo for "do we have an index on this?" currently gets the wrong answer for
-- student_xp, student_lesson_progress, student_badges and student_streaks.
-- Left for the backend track deliberately; "if not exists" means no collision
-- if that file is ever applied later.
-- ============================================================================

create index if not exists idx_student_xp_user_created
  on public.student_xp (user_id, created_at desc);
