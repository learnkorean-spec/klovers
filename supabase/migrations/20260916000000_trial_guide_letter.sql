-- The trial book letter — 15 September 2026.
--
-- Re's rule: before every trial class, the book that lives in the system goes
-- to the students who said they are coming. Not to the whole session: the prep
-- letter already writes to everyone booked. This one is for
-- `attendance_response = 'yes'` only.
--
-- Numbered 20260916000000 and not 20260915200000: that version was taken by
-- a_booked_day_is_kept while this change was in review. Apply Migrations
-- resolves a version by filename PREFIX, so two files sharing one prefix means
-- the second can never run — the CI collision check exists for exactly this.
--
-- Three parts:
--   1. `trial_bookings.guide_sent_at` — the stamp that keeps it to one letter
--      per booking, the same shape as the four `followup_*_sent_at` columns.
--   2. the `student-materials` bucket — public, PDF-only, 10 MB cap. It holds
--      `klovers-trial-guide-ar.pdf` and `trial-guide-en.pdf` at its root, both
--      already uploaded. Public because the letter carries a plain link and a
--      signed URL would expire.
--   3. `trigger_trial_guide()` + the hourly cron that calls it. `dry_run:
--      false` is passed explicitly — the function refuses to send without it,
--      so a manual call can never mail anyone by accident.

alter table public.trial_bookings
  add column if not exists guide_sent_at timestamptz;

comment on column public.trial_bookings.guide_sent_at is
  'When the trial book letter (template trial_guide) was sent to this booking. Set only by send-trial-guide, only for attendance_response = yes.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-materials', 'student-materials', true, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf'];

-- The upload path for this bucket is the Supabase dashboard (or any
-- service-role caller). No anon write policy: the bucket is read-only to the
-- public web, which is all a link in an email needs.
drop policy if exists "temp_anon_upload_student_materials" on storage.objects;

create or replace function public.trigger_trial_guide()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  perform app_private.invoke_edge('send-trial-guide', '{"dry_run": false}'::jsonb, true, 60000);
end $function$;

revoke all on function public.trigger_trial_guide() from public;

do $$
begin
  perform cron.unschedule('trial-guide-hourly');
exception when others then
  null;
end $$;

select cron.schedule(
  'trial-guide-hourly',
  '40 * * * *',
  $$select public.trigger_trial_guide()$$
);
