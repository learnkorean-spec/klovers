-- The two payment letters go live — 15 September 2026
-- ====================================================
--
-- Second half of the change begun in 20260915120000_payment_timing_policy.sql,
-- which created both senders and both crons and deliberately left the crons
-- inactive because the letters still carried their old copy. The copy was
-- rewritten in supabase/functions/send-confirmation-email/templates/payment.ts
-- in this same PR, so the crons can be switched on here.
--
-- TWO BUGS FOUND WHILE WIRING THE COPY UP, both invisible until now because
-- neither cron has ever fired:
--
-- 1. `enrollments.first_class_date` is `timestamp with time zone`, not `date`.
--    send_payment_final_alert() filtered on `(e.first_class_date + 3)`, and
--    timestamptz + integer has no operator: the function raises
--
--        42883: operator does not exist: timestamp with time zone + integer
--
--    on its very first row. Activating it as it stood would have produced a
--    cron job that errors at 23:00 Cairo every night and sends nothing, with
--    the failure buried in the cron log.
--
-- 2. send_payment_ask_emails() compared the same timestamptz against
--    `(now() AT TIME ZONE 'Africa/Cairo')::date`. That comparison casts the
--    date to timestamptz using the SESSION timezone, which on this database is
--    UTC — so the window it actually selected was the UTC day, not the Cairo
--    day it was written to mean. Two or three hours of drift at each edge,
--    enough to send a student her payment letter a day early or a day late.
--
-- Both now derive the Cairo calendar date from the timestamp explicitly:
--
--     (e.first_class_date AT TIME ZONE 'Africa/Cairo')::date
--
-- which is the date a student would name if you asked her when her class is.
-- activate_pkg_group() writes first_class_date from a `date`, so today every
-- row lands on midnight UTC and both readings agree; that is exactly the kind
-- of accident that stops being true the first time a class time is stored
-- with a real hour on it.
--
-- NOTHING IS SENT BY THIS MIGRATION. No enrolment in the table has a
-- first_class_date at all yet — that column is written only by
-- activate_pkg_group() and trg_activate_group_when_full, and no group has
-- been activated. Both letters stay silent until the first group starts,
-- which is the intended order: the student is asked for money once her class
-- is real.

-- ── Letter one ── the last day before the first class.
CREATE OR REPLACE FUNCTION public.send_payment_ask_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rec RECORD;
  _today date := (now() AT TIME ZONE 'Africa/Cairo')::date;
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
       AND (e.first_class_date AT TIME ZONE 'Africa/Cairo')::date >= _today
       AND (e.first_class_date AT TIME ZONE 'Africa/Cairo')::date <= _today + 1
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
$function$;

-- ── Letter two ── 23:00 Africa/Cairo, day three after the first class, and
-- the last letter there will ever be. The seat is not released afterwards;
-- Re gets the notification and decides.
CREATE OR REPLACE FUNCTION public.send_payment_final_alert()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rec RECORD;
  _n   integer := 0;
  _today date := (now() AT TIME ZONE 'Africa/Cairo')::date;
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
       AND ((e.first_class_date AT TIME ZONE 'Africa/Cairo')::date + 3) = _today
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
$function$;

-- ── Switch both crons on ──
-- Through cron.alter_job rather than an UPDATE on cron.job, so pg_cron
-- reloads its own schedule instead of picking the change up whenever it next
-- happens to re-read the table.
DO $$
DECLARE
  _id bigint;
BEGIN
  FOR _id IN
    SELECT jobid FROM cron.job
     WHERE jobname IN ('payment-ask-hourly', 'payment-final-alert-hourly')
  LOOP
    PERFORM cron.alter_job(_id, active => true);
  END LOOP;
END
$$;
