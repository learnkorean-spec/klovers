-- ALREADY APPLIED TO PRODUCTION on 2026-09-08, statement by statement, each
-- verified as it went. This file exists so the repository matches the database.
-- Record the version; do not execute it. Every statement is idempotent anyway.
--
-- ── THE LEAK ───────────────────────────────────────────────────────────────
--
-- public.v_trial_bookings_admin was SELECT-able by `anon`, owned by postgres,
-- and carried no security_invoker. A view without that option runs with its
-- OWNER's rights, so row-level security on trial_bookings never applied through
-- it. The table was protected; the view was the way around it.
--
-- Measured as anon before the change: 76 rows, carrying name, email and phone
-- for every trial booking taken since April.
--
-- The self-check had been reporting this since 7 September as
-- "no unexpected SECURITY DEFINER view: v_trial_bookings_admin", once a day,
-- alongside nine other failures, into a table whose bell was not wired until
-- the day before. The finding was right and nobody had read it.
--
-- After: anon 0 rows, admin still 76, so the admin bookings screen is unchanged.

revoke select on public.v_trial_bookings_admin from anon;
alter view public.v_trial_bookings_admin set (security_invoker = true);

-- ── game_xp_rules: RLS on, zero policies ───────────────────────────────────
-- The only table in the database in that state. RLS with no policy denies
-- everyone, so 21 rows of non-secret reference data — how much XP a game awards
-- and how many rounds count — were unreadable by the site and by admin alike.

drop policy if exists "game_xp_rules_read" on public.game_xp_rules;
create policy "game_xp_rules_read" on public.game_xp_rules
  for select to authenticated, anon using (true);

drop policy if exists "game_xp_rules_admin_write" on public.game_xp_rules;
create policy "game_xp_rules_admin_write" on public.game_xp_rules
  for all to authenticated
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

-- ── anon could call a scheduling helper ────────────────────────────────────

revoke execute on function public.fn_student_class_conflicts(
  integer, time without time zone, integer, date, date) from anon;

-- ── one function with an unpinned search_path ──────────────────────────────

alter function public.trial_bookings_track_change_cancel()
  set search_path = public, extensions;

-- ── four foreign keys with no covering index ───────────────────────────────

create index if not exists idx_teacher_schedule_slots_created_by
  on public.teacher_schedule_slots (created_by);
create index if not exists idx_teacher_availability_exceptions_created_by
  on public.teacher_availability_exceptions (created_by);
create index if not exists idx_student_class_sessions_class_id
  on public.student_class_sessions (class_id);
create index if not exists idx_unit_placement_tests_reviewed_by
  on public.unit_placement_tests (reviewed_by);

-- ── ten policies calling auth.uid() once per row ───────────────────────────
-- Wrapping it in a scalar sub-select makes it an InitPlan, evaluated once for
-- the statement. Identical rows, identical result; only the cost changes, and
-- on lead_events (4,777 rows) that is one call instead of 4,777.

alter policy "Users can insert their own milestones" on public.achievement_milestones
  with check ((select auth.uid()) = user_id);
alter policy "Users can update their own milestones" on public.achievement_milestones
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "Admin can manage promo codes" on public.promo_codes
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

alter policy "Students see the busy slots that are theirs" on public.teacher_schedule_slots
  using (student_id = (select auth.uid()));

alter policy "trial_rebook_resend_log_admin_all" on public.trial_rebook_resend_log
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));

alter policy "Admins can mark unit placements" on public.unit_placement_tests
  using (public.has_role((select auth.uid()), 'admin'))
  with check (public.has_role((select auth.uid()), 'admin'));
alter policy "Admins can view all unit placements" on public.unit_placement_tests
  using (public.has_role((select auth.uid()), 'admin'));
alter policy "Users can insert own unit placement" on public.unit_placement_tests
  with check ((select auth.uid()) = user_id);
alter policy "Users can view own unit placement" on public.unit_placement_tests
  using ((select auth.uid()) = user_id);

-- ── two assertions that were crying wolf ───────────────────────────────────
--
-- A check that fails for a reason nobody can act on is worse than no check:
-- it teaches the reader to skip the list, and the real findings go with it.
-- Both of these were doing exactly that, next to the view leak above.
--
-- 1. "at least 20 active cron jobs" counted `where active`. The 13-job email
--    freeze of 7 September is a decision, not a loss. The comment says the
--    check guards against a job being silently UNSCHEDULED, so it now counts
--    scheduled rows and reports both numbers.
--
-- 2. "admin can read students" asserted (n > 0) — a row count dressed up as a
--    permission test. public.students is a legacy table, empty since
--    20260827163417 removed its stale rows, so it failed every day on an empty
--    table. Comparing what the admin sees against what is actually there tests
--    the permission itself, is correct on an empty table, and is stricter on a
--    full one: it now catches an admin who can see SOME rows but not all.

create or replace function checks.automation_health()
returns table(check_name text, detail text, passed boolean)
language plpgsql
as $function$
declare n bigint; s text;
begin
  select count(*), coalesce(string_agg(distinct j.jobname, ', '), '')
    into n, s
    from cron.job j join cron.job_run_details d on d.jobid = j.jobid
   where d.start_time > now() - interval '24 hours' and d.status <> 'succeeded';
  return query select 'no cron job failed in 24h', coalesce(nullif(s,''), 'none') , (n = 0);

  select count(*), coalesce(string_agg(distinct h.job_name, ', '), '')
    into n, s
    from public.cron_health h
   where h.created_at > now() - interval '24 hours' and h.status in ('skipped','error');
  return query select 'no edge invocation skipped or errored in 24h',
                      coalesce(nullif(s,''), 'none'), (n = 0);

  select count(*) into n
    from net._http_response
   where created > now() - interval '24 hours'
     and (status_code >= 400 or error_msg is not null or timed_out);
  return query select 'no failed outbound HTTP call in 24h', n || ' failures', (n = 0);

  select count(*) into n from cron.job;
  return query select 'at least 20 cron jobs scheduled',
                      n || ' scheduled, '
                        || (select count(*) from cron.job where active) || ' active',
                      (n >= 20);

  return query select 'SUPABASE_URL resolves',
                      coalesce(app_private.config('SUPABASE_URL'), 'NULL'),
                      app_private.config('SUPABASE_URL') is not null;
  return query select 'ANON_KEY resolves',
                      case when app_private.config('ANON_KEY') is null then 'NULL' else 'set' end,
                      app_private.config('ANON_KEY') is not null;
  return query select 'CRON_SECRET resolves (3 endpoints need it)',
                      case when app_private.config('CRON_SECRET') is null then 'NULL' else 'set' end,
                      app_private.config('CRON_SECRET') is not null;

  select count(distinct status) into n
    from public.email_logs where created_at > now() - interval '30 days';
  return query select 'email_logs shows >1 status in 30d (webhook alive)',
                      n || ' distinct statuses', (n > 1);

  select count(*) into n
    from public.email_sends
   where status = 'sending' and claimed_at < now() - interval '30 minutes';
  return query select 'no email_sends stuck in sending', n || ' stuck rows', (n = 0);

  select count(*) into n
    from public.trial_bookings
   where status = 'pending' and is_tba is not true
     and trial_date < current_date - interval '2 days';
  return query select 'no stale pending trial bookings', n || ' stale rows', (n = 0);
end $function$;

create or replace function checks.rls_matrix()
returns table(check_name text, detail text, passed boolean)
language plpgsql
as $function$
declare
  v_admin   uuid;
  v_student uuid;
  t         text;
  n         bigint;
  m         bigint;
begin
  select user_id into v_admin
    from public.user_roles where role = 'admin'::public.app_role limit 1;
  select p.user_id into v_student
    from public.profiles p
   where p.user_id is not null
     and not exists (select 1 from public.user_roles r
                      where r.user_id = p.user_id and r.role = 'admin'::public.app_role)
   limit 1;

  foreach t in array array[
    'trial_bookings','lead_events','leads','profiles','enrollments','students',
    'admin_notifications','student_xp','book_assignments','email_logs',
    'checkout_recovery_emails','placement_tests','schedule_resubmission_requests'
  ] loop
    n := checks.as_role('anon', null, format('select count(*) from public.%I', t));
    return query select 'anon cannot read ' || t, n || ' rows visible to anon', (n = 0);
  end loop;

  foreach t in array array[
    'blog_posts','textbook_lessons','lesson_vocabulary','schedule_packages',
    'trial_slots','egp_prices','course_levels'
  ] loop
    n := checks.as_role('anon', null, format('select count(*) from public.%I', t));
    return query select 'anon can still read ' || t, n || ' rows visible to anon', (n > 0);
  end loop;

  n := checks.as_role('anon', null,
        'select count(*) from public.blog_posts where published is not true');
  return query select 'anon cannot read unpublished blog posts', n || ' visible', (n = 0);

  if v_admin is null then
    return query select 'an admin user exists', 'no row in user_roles'::text, false;
  else
    foreach t in array array['trial_bookings','leads','enrollments','lead_events','students'] loop
      n := checks.as_role('authenticated', v_admin, format('select count(*) from public.%I', t));
      execute format('select count(*) from public.%I', t) into m;
      return query select 'admin can read ' || t,
                          n || ' of ' || m || ' rows visible to admin',
                          (n = m);
    end loop;
  end if;

  if v_student is null then
    return query select 'a non-admin profile exists', 'none found'::text, false;
  else
    n := checks.as_role('authenticated', v_student, 'select count(*) from public.admin_notifications');
    return query select 'student cannot read admin_notifications', n || ' visible', (n = 0);
    n := checks.as_role('authenticated', v_student, 'select count(*) from public.checkout_recovery_emails');
    return query select 'student cannot read checkout_recovery_emails', n || ' visible', (n = 0);
    n := checks.as_role('authenticated', v_student, 'select count(*) from public.leads');
    return query select 'student sees at most their own lead', n || ' lead rows visible', (n <= 1);
    n := checks.as_role('authenticated', v_student, 'select count(*) from public.trial_bookings');
    return query select 'student sees only own trial bookings', n || ' booking rows visible', (n = 0);
  end if;

  select count(*) into n
    from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  return query select 'RLS enabled on every public table', n || ' tables without RLS', (n = 0);

  select count(*) into n
    from pg_tables t2
   where t2.schemaname = 'public'
     and not exists (select 1 from pg_policies p
                      where p.schemaname='public' and p.tablename=t2.tablename);
  return query select 'every public table has a policy', n || ' tables with none', (n = 0);

  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f' and p.prosecdef
     and p.prorettype <> 'pg_catalog.trigger'::regtype
     and has_function_privilege('anon', p.oid, 'EXECUTE')
     and not (pg_get_functiondef(p.oid) ilike '%has_role%'
           or pg_get_functiondef(p.oid) ilike '%auth.uid%')
     and p.proname not in ('increment_blog_view','validate_resubmission_token',
                           'complete_schedule_resubmission','upsert_trial_rate_limit');
  return query select 'no unguarded anon-callable SECURITY DEFINER fn', n || ' unguarded', (n = 0);

  select count(*) into n
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and (p.proconfig is null
          or not exists (select 1 from unnest(p.proconfig) c where c like 'search\_path=%'));
  return query select 'search_path pinned on every function', n || ' mutable', (n = 0);

  declare
    v_blocked boolean := false;
    v_why     text;
  begin
    begin
      perform set_config('request.jwt.claims',
        json_build_object('role','authenticated','sub', v_student::text)::text, true);
      set local role authenticated;
      update public.profiles set credits = credits + 1000 where user_id = v_student;
      reset role;
      v_why := 'UPDATE succeeded — protect_profile_fields is not blocking';
    exception when others then
      reset role;
      v_blocked := true;
      v_why := 'blocked: ' || sqlerrm;
    end;
    perform set_config('request.jwt.claims', NULL, true);
    return query select 'student cannot self-grant credits', v_why, v_blocked;
  end;
end $function$;
