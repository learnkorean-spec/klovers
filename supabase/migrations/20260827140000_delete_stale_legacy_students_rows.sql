-- Deletes all 9 rows in public.students. Founder's decision (25/26 Aug
-- 2026), reached after a multi-step investigation, not on a guess:
--
-- 1. Confirmed zero screens display students.total_classes/total_paid to
--    anyone (admin or student) -- the one code path capable of it always
--    takes a different branch in current data.
-- 2. Confirmed the table is NOT dead code even though those two columns
--    are never rendered: StudentManager.tsx ("Student Admin" tab) and
--    GroupAttendanceManager.tsx ("Group Attendance" tab) are live,
--    unconditionally-mounted admin screens with working CRUD against this
--    table. Content is stale; the screens themselves are real.
-- 3. Confirmed 2 of the 9 rows are the founder's own test data
--    (15202b21.../reham.elshrkawy@gmail.com, her own account, and
--    21fafbe1.../test@gmail.com) -- not real students at all.
-- 4. Attempted to compute a corrected value for the remaining 7 and found
--    6 of them reference an `enrollments` row that is no longer in a
--    qualifying state (REJECTED, or matched_at cleared) since this row was
--    created -- meaning "the correct number" has no single defensible
--    answer for those 6 today. Only one row (d31a0ce1.../Renad Elsenduony,
--    amany.hassana89@gmail.com) has a currently fully-qualifying enrollment
--    behind it.
--
-- Given that, "delete and let the trigger repopulate correctly going
-- forward" is the decision, not "repair to a number nobody can agree on."
-- sync_student_on_approval() (fixed in an earlier migration, 20260824120000)
-- stays live and unmodified: any enrollment that newly qualifies
-- (APPROVED + PAID + matched) will insert a fresh, correct row exactly as
-- designed. This table starts clean, not permanently empty.
--
-- Scope, deliberately narrow: this migration ONLY deletes rows. It does not
-- touch the table's shape, its 3 triggers, its 4 RLS policies, or
-- sync_student_on_approval() itself -- all separate, later decisions.
--
-- Full verbatim snapshot of every row deleted (all 18 columns, including
-- full notes text) is in this migration's pull request description, along
-- with a copy-paste rollback INSERT -- not duplicated here to keep this
-- file to the one operation it performs.

BEGIN;

DELETE FROM public.students;

COMMIT;
