-- Drop three orphan trigger functions.
--
-- WHY
-- ---
-- Each of these RETURNS trigger, and measured against production on 2026-09-02:
--
--   * is attached to ZERO triggers,
--   * is referenced by ZERO other functions in public / app_private / checks,
--   * appears in ZERO cron.job commands.
--
-- A function returning `trigger` is not exposed as a PostgREST RPC, so the
-- frontend cannot call them either. There is no path in the system that can
-- reach them. They are dead in the strict sense, not merely unused.
--
--   email_student_on_enrollment
--     SECURITY DEFINER, reads profiles and sends a student email via pg_net.
--     A dormant emailer with no trigger. The live path is
--     email_student_on_approval, which IS attached. Removing this one also
--     removes the risk of someone re-attaching the wrong emailer.
--
--   initialize_vocabulary_review_history
--     Inserts into vocabulary_review_history, a table with 0 rows.
--
--   validate_enrollment_fields
--     Superseded by validate_enrollment_status and validate_enrollment,
--     both of which are attached and enforce the same approval_status set.
--
-- SCOPE
-- -----
-- Functions only. No table is dropped, no column, no policy, no data. This is
-- deliberately the narrowest tranche of the backend cleanup -- the one that can
-- be proven safe from the database alone, with no frontend evidence required.
-- Everything else (42 empty tables, the legacy l1-l6 course_levels keys, the
-- duplicate RPC pairs) needs a frontend reference sweep first and is NOT in
-- this migration. See claude/BACKEND_CLEANUP_PLAN_2026-09-02.md.
--
-- No CASCADE. If any of these ever acquires a dependent, this migration fails
-- loudly rather than removing something unexamined.
--
-- DRY RUN
-- -------
-- Executed against production inside an explicit transaction and rolled back,
-- 2026-09-02: public function count 156 -> 153, trigger count unchanged.
--
-- ROLLBACK
-- --------
-- These are recreatable from history:
--   email_student_on_enrollment          -> 20260424000002_class_link_and_first_class.sql lineage
--   initialize_vocabulary_review_history -> 20260315000000_vocabulary_review_history_srs.sql
--   validate_enrollment_fields           -> 20260407000001_enrollment_integrity_v2.sql lineage
-- Recreating any of them WITHOUT also creating its trigger restores exactly the
-- state this migration removes, so a rollback is only meaningful together with
-- whatever trigger was intended to use it.

begin;

drop function if exists public.email_student_on_enrollment();
drop function if exists public.initialize_vocabulary_review_history();
drop function if exists public.validate_enrollment_fields();

commit;
