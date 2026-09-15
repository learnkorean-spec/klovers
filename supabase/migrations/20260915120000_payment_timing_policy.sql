-- Payment timing policy — set by Re, 15 September 2026
-- =====================================================
--
-- THE POLICY, in her words: a student holds her seat without paying. She is
-- not asked for money until the group is running, and once asked she has
-- three days from her first class. Exactly two letters, ever:
--
--   1. the payment ask   — 24 hours before the first class
--   2. the final alert   — 23:00 Cairo on the third day after the first class
--
-- and then silence. The seat is NOT released on day three; Re decides what
-- happens next. There are 2 seats held across 8 groups with capacity 15 —
-- there is no contention to justify taking a place back from anyone.
--
-- WHAT THIS REPLACES
-- ------------------
-- `send_receipt_nudge_emails()` chased every unpaid enrolment up to FOUR
-- times, every three days, counting from the row's creation — with no
-- reference to whether the class had started. That is the opposite of the
-- policy above, so its cron is unscheduled here. The function itself is left
-- in place, unscheduled and harmless, so nothing that references it breaks.
--
-- THE MISSING PIECE THIS FIXES FIRST
-- ----------------------------------
-- `pkg_groups` had no start date and `pkg_group_sessions` is empty, so the
-- database could not answer "when does this group begin?" — and every date in
-- the policy is counted from that day. `start_date` is added here and stamped
-- at activation.
--
-- BOTH CRONS ARE CREATED INACTIVE.
-- The two letters they send (`payment_method_reminder`, `receipt_nudge`) still
-- carry their old copy and neither has ever been sent to anyone. They are
-- switched on in the follow-up PR that rewrites that copy — with the payment
-- methods (Vodafone Cash / Fawry on +20 101 000 3084, bank transfer via
-- WhatsApp) and the tone rules. Activating them before that would send real
-- students the wrong letter.

-- ── 1. A group knows when it starts ──────────────────────────────────────────

ALTER TABLE public.pkg_groups
  ADD COLUMN IF NOT EXISTS start_date date;

COMMENT ON COLUMN public.pkg_groups.start_date IS
  'First class date. NULL means the group is not running yet. Stamped by activate_pkg_group(). Every payment deadline is counted from this day.';

-- ── 2. The next occurrence of a weekday, in a given zone ─────────────────────
--
-- Used to pick a start date when a group activates itself on reaching
-- capacity. Cairo, not UTC: a Friday class at 16:30 Cairo is still Thursday in
-- UTC terms for part of the year, and "next Friday" must mean the reader's
-- Friday.

CREATE OR REPLACE FUNCTION public.next_weekday_date(_dow integer, _tz text DEFAULT 'Africa/Cairo')
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (d + ((_dow - EXTRACT(DOW FROM d)::int + 7) % 7))::date
  FROM (SELECT (now() AT TIME ZONE _tz)::date AS d) t;
$$;

COMMENT ON FUNCTION public.next_weekday_date(integer, text) IS
  'The next date falling on _dow (0=Sunday), in _tz. Returns today when today already is that weekday.';

-- ── 3. Activating a group ────────────────────────────────────────────────────
--
-- One call does everything the policy needs to start counting:
--   • stamps the group start date
--   • marks the group active
--   • gives every seated student a first_class_date and a due_at
--
-- due_at is 23:00 Cairo on start_date + 3. It is informational — the alert
-- fires from it, nothing is revoked by it.
--
-- Idempotent: activating an already-started group updates the date and
-- re-derives every member's dates from it, which is what Re wants when a start
-- day moves.

CREATE OR REPLACE FUNCTION public.activate_pkg_group(_group_id uuid, _start_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _grp        RECORD;
  _start      date;
  _seated     integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorised';
  END IF;

  SELECT g.id, g.package_id, g.start_date, sp.day_of_week, sp.timezone
    INTO _grp
    FROM public.pkg_groups g
    JOIN public.schedule_packages sp ON sp.id = g.package_id
   WHERE g.id = _group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_such_group';
  END IF;

  -- Caller's date wins; otherwise the group's existing one; otherwise the next
  -- occurrence of the package's own weekday.
  _start := COALESCE(
    _start_date,
    _grp.start_date,
    public.next_weekday_date(_grp.day_of_week, COALESCE(_grp.timezone, 'Africa/Cairo'))
  );

  UPDATE public.pkg_groups
     SET start_date = _start,
         is_active  = true
   WHERE id = _group_id;

  -- Every seated student gets the same two dates, derived from the group.
  -- Only rows that are not already paid are touched: a student who has paid
  -- has no deadline left to move.
  WITH seated AS (
    SELECT m.enrollment_id
      FROM public.pkg_group_members m
     WHERE m.group_id = _group_id
       AND m.enrollment_id IS NOT NULL
  )
  UPDATE public.enrollments e
     SET first_class_date = _start,
         due_at = ((_start + 3)::timestamp + time '23:00') AT TIME ZONE 'Africa/Cairo'
   WHERE e.id IN (SELECT enrollment_id FROM seated)
     AND e.payment_status <> 'PAID';

  GET DIAGNOSTICS _seated = ROW_COUNT;

  RETURN jsonb_build_object(
    'group_id',   _group_id,
    'start_date', _start,
    'due_at',     ((_start + 3)::timestamp + time '23:00') AT TIME ZONE 'Africa/Cairo',
    'students',   _seated
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_pkg_group(uuid, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.activate_pkg_group(uuid, date) TO authenticated;

COMMENT ON FUNCTION public.activate_pkg_group(uuid, date) IS
  'Admin-only. Starts a group: stamps start_date, marks it active, and gives every seated unpaid student first_class_date and due_at (23:00 Cairo, start + 3 days). This is what the admin "Activate group" button calls.';

-- ── 4. A full group activates itself ─────────────────────────────────────────
--
-- Re named two triggers for the payment ask: the quota filling, or her
-- pressing the button. This is the first of the two. It only fires on the
-- transition INTO full, and only for a group that has no start date yet, so an
-- already-running group is never re-dated by someone joining it.

CREATE OR REPLACE FUNCTION public.tg_activate_group_when_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _capacity integer;
  _members  integer;
  _start    date;
  _dow      integer;
  _tz       text;
BEGIN
  SELECT g.capacity, g.start_date, sp.day_of_week, sp.timezone
    INTO _capacity, _start, _dow, _tz
    FROM public.pkg_groups g
    JOIN public.schedule_packages sp ON sp.id = g.package_id
   WHERE g.id = NEW.group_id;

  IF _start IS NOT NULL THEN
    RETURN NEW;  -- already running; joining it does not move its date
  END IF;

  SELECT count(*) INTO _members
    FROM public.pkg_group_members
   WHERE group_id = NEW.group_id;

  IF _members < COALESCE(_capacity, 15) THEN
    RETURN NEW;
  END IF;

  _start := public.next_weekday_date(_dow, COALESCE(_tz, 'Africa/Cairo'));

  UPDATE public.pkg_groups
     SET start_date = _start, is_active = true
   WHERE id = NEW.group_id;

  UPDATE public.enrollments e
     SET first_class_date = _start,
         due_at = ((_start + 3)::timestamp + time '23:00') AT TIME ZONE 'Africa/Cairo'
   WHERE e.id IN (
     SELECT enrollment_id FROM public.pkg_group_members
      WHERE group_id = NEW.group_id AND enrollment_id IS NOT NULL
   )
     AND e.payment_status <> 'PAID';

  INSERT INTO public.admin_notifications (message, type, related_group_id)
  VALUES (
    'A group filled up and started itself: it reached capacity and was activated for ' || _start || '.',
    'info',
    NEW.group_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_group_when_full ON public.pkg_group_members;
CREATE TRIGGER trg_activate_group_when_full
  AFTER INSERT ON public.pkg_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_activate_group_when_full();

-- ── 5. Letter one — the payment ask, 24h before the first class ──────────────
--
-- Sent once per enrolment, ever: `payment_email_sent_at` is the guard, and it
-- is stamped BEFORE the send so a slow edge call cannot double-send. A student
-- whose group starts in less than 24 hours still gets it on the next hourly
-- run — the window is "the class is within a day and has not happened yet",
-- not a single instant.

CREATE OR REPLACE FUNCTION public.send_payment_ask_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT e.id, e.amount, e.currency, e.first_class_date, e.due_at,
           COALESCE(p.language, 'ar') AS lang,
           p.name AS student_name, p.email AS student_email,
           p.unsubscribe_token
      FROM public.enrollments e
      JOIN public.profiles p ON p.user_id = e.user_id
     WHERE e.payment_status <> 'PAID'
       AND e.deleted_at IS NULL
       AND e.first_class_date IS NOT NULL
       AND e.first_class_date >= (now() AT TIME ZONE 'Africa/Cairo')::date
       AND e.first_class_date <= ((now() AT TIME ZONE 'Africa/Cairo')::date + 1)
       AND e.payment_email_sent_at IS NULL
       AND p.email IS NOT NULL
       AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    UPDATE public.enrollments
       SET payment_email_sent_at = now()
     WHERE id = _rec.id
       AND payment_email_sent_at IS NULL;

    IF FOUND THEN
      PERFORM app_private.invoke_edge(
        'send-confirmation-email',
        jsonb_build_object(
          'template',          'payment_method_reminder',
          'email',             _rec.student_email,
          'name',              _rec.student_name,
          'language',          _rec.lang,
          'enrollment_id',     _rec.id,
          'amount',            _rec.amount,
          'currency',          _rec.currency,
          'first_class_date',  _rec.first_class_date,
          'unsubscribe_token', _rec.unsubscribe_token
        )
      );
      PERFORM pg_sleep(0.15);
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.send_payment_ask_emails() IS
  'Letter one of the payment policy: the only ask, 24h before the first class. Guarded by enrollments.payment_email_sent_at — one per enrolment, ever.';

-- ── 6. Letter two — the final alert, 23:00 Cairo on day three ────────────────
--
-- Runs hourly and checks the Cairo clock itself rather than relying on a UTC
-- cron expression: Egypt observes DST again since 2023, so a fixed UTC hour
-- would drift an hour twice a year and land this letter at 22:00 or midnight.
--
-- This is the LAST letter. Nothing chases afterwards; Re gets an admin
-- notification and decides.

CREATE OR REPLACE FUNCTION public.send_payment_final_alert()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _rec RECORD;
  _n   integer := 0;
BEGIN
  IF EXTRACT(HOUR FROM (now() AT TIME ZONE 'Africa/Cairo')) <> 23 THEN
    RETURN;
  END IF;

  FOR _rec IN
    SELECT e.id, e.amount, e.currency, e.first_class_date, e.due_at,
           COALESCE(p.language, 'ar') AS lang,
           p.name AS student_name, p.email AS student_email,
           p.unsubscribe_token
      FROM public.enrollments e
      JOIN public.profiles p ON p.user_id = e.user_id
     WHERE e.payment_status <> 'PAID'
       AND e.deleted_at IS NULL
       AND e.first_class_date IS NOT NULL
       AND (e.first_class_date + 3) = (now() AT TIME ZONE 'Africa/Cairo')::date
       AND e.receipt_nudge_sent_at IS NULL
       AND p.email IS NOT NULL
       AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    UPDATE public.enrollments
       SET receipt_nudge_sent_at = now()
     WHERE id = _rec.id
       AND receipt_nudge_sent_at IS NULL;

    IF FOUND THEN
      PERFORM app_private.invoke_edge(
        'send-confirmation-email',
        jsonb_build_object(
          'template',          'receipt_nudge',
          'email',             _rec.student_email,
          'name',              _rec.student_name,
          'language',          _rec.lang,
          'enrollment_id',     _rec.id,
          'amount',            _rec.amount,
          'currency',          _rec.currency,
          'first_class_date',  _rec.first_class_date,
          'unsubscribe_token', _rec.unsubscribe_token
        )
      );
      _n := _n + 1;
      PERFORM pg_sleep(0.15);
    END IF;
  END LOOP;

  IF _n > 0 THEN
    INSERT INTO public.admin_notifications (message, type)
    VALUES (
      'Final payment alert sent: ' || _n || ' student(s) reached day three after their first class and received the last payment letter. Nothing chases them from here — their seats are kept, and what happens next is yours to decide.',
      'info'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.send_payment_final_alert() IS
  'Letter two of the payment policy, and the last one: 23:00 Cairo on first_class_date + 3. Checks the Cairo hour itself because Egypt observes DST. Seats are never released by this.';

-- ── 7. Schedules ─────────────────────────────────────────────────────────────
--
-- The old chaser goes. The two new jobs are created INACTIVE — see the header.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-receipt-nudge-emails') THEN
    PERFORM cron.unschedule('send-receipt-nudge-emails');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'payment-ask-hourly') THEN
    PERFORM cron.unschedule('payment-ask-hourly');
  END IF;
  PERFORM cron.schedule('payment-ask-hourly', '20 * * * *',
                        'SELECT public.send_payment_ask_emails()');

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'payment-final-alert-hourly') THEN
    PERFORM cron.unschedule('payment-final-alert-hourly');
  END IF;
  PERFORM cron.schedule('payment-final-alert-hourly', '5 * * * *',
                        'SELECT public.send_payment_final_alert()');

  UPDATE cron.job
     SET active = false
   WHERE jobname IN ('payment-ask-hourly', 'payment-final-alert-hourly');
END;
$$;
