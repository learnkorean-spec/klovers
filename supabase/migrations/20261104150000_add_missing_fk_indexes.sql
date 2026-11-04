-- Add covering indexes for foreign key columns flagged by Supabase's
-- performance advisor (unindexed_foreign_keys lint) as of 2026-11-04.
-- An unindexed foreign key forces a sequential scan on the referencing
-- table for every update/delete on the referenced row (FK existence
-- checks) and for any join/filter on these columns from the app. Purely
-- additive - no data or existing behavior changes.

create index if not exists exchange_blocks_blocked_id_idx
  on public.exchange_blocks (blocked_id);

create index if not exists exchange_matches_user_b_idx
  on public.exchange_matches (user_b);

create index if not exists exchange_reports_reported_id_idx
  on public.exchange_reports (reported_id);

create index if not exists exchange_reports_reporter_id_idx
  on public.exchange_reports (reporter_id);

create index if not exists legacy_issues_import_batch_id_idx
  on public.legacy_issues (import_batch_id);

create index if not exists legacy_issues_legacy_student_id_idx
  on public.legacy_issues (legacy_student_id);

create index if not exists legacy_monthly_records_import_batch_id_idx
  on public.legacy_monthly_records (import_batch_id);

create index if not exists legacy_year_aggregates_import_batch_id_idx
  on public.legacy_year_aggregates (import_batch_id);

create index if not exists teacher_applications_created_teacher_id_idx
  on public.teacher_applications (created_teacher_id);

create index if not exists teacher_course_progress_course_level_key_idx
  on public.teacher_course_progress (course_level_key);

create index if not exists teacher_onboarding_progress_completed_by_idx
  on public.teacher_onboarding_progress (completed_by);

create index if not exists teacher_onboarding_progress_step_id_idx
  on public.teacher_onboarding_progress (step_id);
