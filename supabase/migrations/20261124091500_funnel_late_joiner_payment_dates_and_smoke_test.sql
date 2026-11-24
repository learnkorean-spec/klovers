-- Funnel fix + full-funnel smoke test (24 Nov 2026)
-- ==================================================
--
-- THE LEAK THIS CLOSES
-- --------------------
-- Re's payment policy (migration 20260915120000) sends exactly two letters:
-- the payment ask 24h before the first class, and the final alert at 23:00
-- Cairo on day three after it. Both are keyed on enrollments.first_class_date
-- and due_at, and the ONLY thing that ever wrote those two columns was
-- activate_pkg_group(), which runs once, when a group starts.
--
-- So every student seated into a group that is ALREADY running got neither
-- date, and neither letter, ever. Measured 24 Nov 2026: all 5 unpaid
-- enrolments were late joiners of "Hangul · Friday 15:00 Cairo" (started
-- 25 Sep). Three had never been asked for money at all, 10-18 days in.
--
-- THE FIX
-- -------
-- fn_stamp_running_group_payment_dates() gives a late joiner the same two
-- dates activate_pkg_group() gives everyone else, counted from her first
-- upcoming class instead of the group's start. It touches only rows that have
-- no first_class_date yet, so a date Re or activation already set is never
-- moved, and a student who has already had her letters is never re-sent them
-- (the letters keep their own *_sent_at stamps). Runs hourly at :10, before
-- payment-ask-hourly at :20.
--
-- THE SMOKE TEST
-- --------------
-- fn_funnel_smoke_test() walks one fake student through the whole funnel,
-- visitor -> lead -> account -> trial booking -> said yes -> attended ->
-- placement -> holds a seat in a running group -> payment dates ->
-- paid -> active member of a group with an upcoming class, using the same
-- RPCs and triggers real students hit. Everything runs inside a
-- subtransaction that is always rolled back, including the pg_net queue, so
-- no row survives and no email or Telegram message is sent.

-- 1. Late joiners get their payment dates ------------------------------------

CREATE OR REPLACE FUNCTION public.fn_stamp_running_group_payment_dates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rec   RECORD;
  _first date;
  _n     integer := 0;
  _today date := (now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
  FOR _rec IN
    SELECT DISTINCT ON (e.id)
           e.id AS enrollment_id, g.id AS group_id,
           sp.day_of_week, COALESCE(sp.timezone, 'Africa/Cairo') AS tz
      FROM public.enrollments e
      JOIN public.pkg_group_members m
        ON m.member_status = 'active'
       AND (m.enrollment_id = e.id OR (m.enrollment_id IS NULL AND m.user_id = e.user_id))
      JOIN public.pkg_groups g ON g.id = m.group_id
      JOIN public.schedule_packages sp ON sp.id = g.package_id
     WHERE e.deleted_at IS NULL
       AND e.approval_status = 'APPROVED'
       AND e.payment_status <> 'PAID'
       AND e.first_class_date IS NULL
       AND COALESCE(e.plan_type, 'group') = 'group'
       AND g.is_active
       AND g.start_date IS NOT NULL
     ORDER BY e.id, (m.enrollment_id = e.id) DESC
  LOOP
    SELECT min(s.session_date) INTO _first
      FROM public.pkg_group_sessions s
     WHERE s.group_id = _rec.group_id
       AND s.session_date >= _today;

    _first := COALESCE(_first, public.next_weekday_date(_rec.day_of_week, _rec.tz));

    UPDATE public.enrollments
       SET first_class_date = _first,
           due_at = ((_first + 3)::timestamp + time '23:00') AT TIME ZONE 'Africa/Cairo'
     WHERE id = _rec.enrollment_id
       AND first_class_date IS NULL;

    IF FOUND THEN _n := _n + 1; END IF;
  END LOOP;

  IF _n > 0 THEN
    INSERT INTO public.admin_notifications (message, type)
    VALUES (
      _n || ' student(s) who joined a running group now have payment dates. '
      || 'The payment ask goes 24h before their next class, the final alert on day three after it.',
      'payment_due'
    );
  END IF;

  RETURN _n;
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_stamp_running_group_payment_dates() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('stamp-running-group-payment-dates')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'stamp-running-group-payment-dates');

SELECT cron.schedule(
  'stamp-running-group-payment-dates',
  '10 * * * *',
  $$set statement_timeout = '90s'; SELECT public.fn_stamp_running_group_payment_dates()$$
);

-- 2. Full-funnel smoke test ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_funnel_smoke_test()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _steps   jsonb := '[]'::jsonb;
  _step    text  := 'start';
  _uid     uuid  := gen_random_uuid();
  _email   text;
  _slot    RECORD;
  _grp     RECORD;
  _bid     uuid;
  _token   uuid;
  _eid     uuid;
  _status  text;
  _n       integer;
  _ok      boolean := false;
  _err     text;
  _today   date := (now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
  IF NOT (
       session_user IN ('postgres', 'supabase_admin')
    OR auth.role() = 'service_role'
    OR COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  ) THEN
    RAISE EXCEPTION 'not_authorised' USING ERRCODE = '42501';
  END IF;

  _email := 'smoke+' || replace(_uid::text, '-', '') || '@kloversegy.com';

  BEGIN
    -- 1. Visitor clicks the free-trial CTA
    _step := 'visitor_event';
    INSERT INTO public.lead_events (session_id, source_type, source_page, cta_label, metadata)
    VALUES (gen_random_uuid(), 'free_trial', '/free-trial', 'smoke', '{"smoke": true}');
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 2. She signs up: auth user -> profile via handle_new_user
    _step := 'signup_profile';
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
                            created_at, updated_at)
    VALUES (_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            _email, '', now(), jsonb_build_object('name', 'Smoke Test'),
            '{"provider": "email", "providers": ["email"]}', now(), now());
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid) THEN
      RAISE EXCEPTION 'no profile was created for the new account';
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 3. Lead row
    _step := 'lead';
    INSERT INTO public.leads (name, email, status, source, user_id, phone)
    VALUES ('Smoke Test', _email, 'new', 'smoke_test', _uid, '+201000000000');
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 4. The booking page offers a trial she is allowed to book. Read through
    --    get_trial_availability(), the RPC the page itself calls, and held to
    --    book-trial's own rule (registrations close 1 day before the class):
    --    a slot the page offers but the server refuses is a dead end.
    _step := 'trial_slot_available';
    SELECT a.next_trial_date AS trial_date, a.start_time, a.day_of_week, a.timezone
      INTO _slot
      FROM public.get_trial_availability('arabic') a
     ORDER BY a.next_trial_date, a.start_time
     LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'the booking page offers no Arabic trial: nobody can book one';
    END IF;
    IF _slot.trial_date - (now() AT TIME ZONE COALESCE(_slot.timezone, 'Asia/Kuala_Lumpur'))::date <= 1 THEN
      RAISE EXCEPTION 'the booking page offers % % but book-trial refuses it (closes 1 day before)',
        _slot.trial_date, _slot.start_time;
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true,
                'detail', _slot.trial_date || ' ' || _slot.start_time);

    -- 5. She books it, through the same RPC book-trial uses
    _step := 'trial_booking';
    _bid := public.upsert_trial_booking(
      NULL, 'Smoke Test', _email, '+201000000000', 'hangul', 'smoke test',
      _slot.day_of_week, left(_slot.start_time::text, 5), _slot.trial_date,
      _slot.timezone, 'arabic', _uid, 'awaiting_attendance');
    SELECT status, confirmation_token INTO _status, _token FROM public.trial_bookings WHERE id = _bid;
    IF _status IS DISTINCT FROM 'awaiting_attendance' THEN
      RAISE EXCEPTION 'booking status is % instead of awaiting_attendance', _status;
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 6. She answers yes to "are you coming?"
    _step := 'said_yes';
    IF _token IS NULL THEN
      UPDATE public.trial_bookings SET confirmation_token = gen_random_uuid()
       WHERE id = _bid RETURNING confirmation_token INTO _token;
    END IF;
    PERFORM public.respond_trial_attendance(_token, 'yes');
    SELECT status INTO _status FROM public.trial_bookings WHERE id = _bid;
    IF _status IS DISTINCT FROM 'confirmed_attendance' THEN
      RAISE EXCEPTION 'after yes the status is %', _status;
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 7. Re marks her as attended
    _step := 'marked_attended';
    UPDATE public.trial_bookings
       SET attended = true, attendance_marked_at = now()
     WHERE id = _bid;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 8. Placement test
    _step := 'placement_test';
    INSERT INTO public.placement_tests (user_id, score, max_score, level)
    VALUES (_uid, 3, 20, 'hangul');
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 9. A running group at her level has a free seat
    _step := 'running_group_available';
    SELECT g.id, g.package_id, g.name INTO _grp
      FROM public.pkg_groups g
      JOIN public.schedule_packages sp ON sp.id = g.package_id
     WHERE g.is_active AND g.start_date IS NOT NULL AND sp.is_active
       AND sp.level = 'hangul' AND COALESCE(sp.course_type, 'group') = 'group'
       AND (SELECT count(*) FROM public.pkg_group_members m
             WHERE m.group_id = g.id AND m.member_status = 'active') < COALESCE(g.capacity, 8)
     ORDER BY g.start_date DESC
     LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'no running hangul group with a free seat';
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true, 'detail', _grp.name);

    -- 10. She holds her seat on /enroll-now, as herself (pay later)
    _step := 'seat_held';
    PERFORM set_config('request.jwt.claims',
      jsonb_build_object('sub', _uid, 'role', 'authenticated')::text, true);
    PERFORM public.hold_my_seat(_grp.package_id);
    PERFORM set_config('request.jwt.claims', '', true);
    SELECT e.id INTO _eid
      FROM public.enrollments e
     WHERE e.user_id = _uid AND e.deleted_at IS NULL
       AND e.approval_status = 'APPROVED' AND e.payment_status = 'PENDING_PAYMENT';
    IF _eid IS NULL THEN
      RAISE EXCEPTION 'hold_my_seat left no approved, pending-payment enrolment';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.pkg_group_members m
                    WHERE m.user_id = _uid AND m.group_id = _grp.id AND m.member_status = 'active') THEN
      RAISE EXCEPTION 'hold_my_seat did not seat her in %', _grp.name;
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 11. The leak this migration closes: she now gets payment dates
    _step := 'payment_dates_stamped';
    PERFORM public.fn_stamp_running_group_payment_dates();
    IF NOT EXISTS (SELECT 1 FROM public.enrollments
                    WHERE id = _eid AND first_class_date IS NOT NULL AND due_at IS NOT NULL
                      AND (first_class_date AT TIME ZONE 'Africa/Cairo')::date >= _today) THEN
      RAISE EXCEPTION 'late joiner got no first_class_date / due_at, so no payment letters would ever go';
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true,
                'detail', (SELECT first_class_date::date::text FROM public.enrollments WHERE id = _eid));

    -- 12. She pays
    _step := 'paid';
    UPDATE public.enrollments SET payment_status = 'PAID', payment_date = now() WHERE id = _eid;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    -- 13. She is an active member of a group with a class coming up
    _step := 'active_class';
    SELECT count(*) INTO _n
      FROM public.pkg_group_members m
     WHERE m.user_id = _uid AND m.member_status = 'active' AND m.group_id = _grp.id;
    IF _n <> 1 THEN
      RAISE EXCEPTION 'not an active member after paying';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.pkg_group_sessions s
                    WHERE s.group_id = _grp.id AND s.session_date >= _today) THEN
      RAISE EXCEPTION 'group % has no upcoming session generated', _grp.name;
    END IF;
    _steps := _steps || jsonb_build_object('step', _step, 'ok', true);

    _ok := true;
    RAISE EXCEPTION 'SMOKE_ROLLBACK';
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('request.jwt.claims', '', true);
    IF SQLERRM <> 'SMOKE_ROLLBACK' THEN
      _err := SQLERRM;
      _steps := _steps || jsonb_build_object('step', _step, 'ok', false, 'error', SQLERRM);
    END IF;
  END;

  -- A failure is written where Re looks every morning. Outside the rolled-back
  -- block, so it survives. A pass writes nothing.
  IF NOT _ok THEN
    INSERT INTO public.admin_notifications (message, type, category)
    VALUES ('Funnel smoke test FAILED at step "' || _step || '": ' || COALESCE(_err, 'unknown error')
            || '. A real student reaching this step would get stuck there.', 'warning', 'system');
  END IF;

  RETURN jsonb_build_object(
    'ok', _ok,
    'ran_at', now(),
    'failed_step', CASE WHEN _ok THEN NULL ELSE _step END,
    'error', _err,
    'rolled_back', true,
    'steps', _steps
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_funnel_smoke_test() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_funnel_smoke_test() TO authenticated, service_role;

-- Daily at 02:35 UTC, after the session generators (02:00 and 02:30 UTC).
-- A failure lands in admin notifications; a pass is silent.
SELECT cron.unschedule('funnel-smoke-daily')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'funnel-smoke-daily');

SELECT cron.schedule(
  'funnel-smoke-daily',
  '35 2 * * *',
  $$set statement_timeout = '90s'; SELECT public.fn_funnel_smoke_test()$$
);
