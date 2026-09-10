-- The payment reminder has never been able to fire. Three reasons, stacked.
--
-- Re's rule, stated 10 Sep 2026: a student may attend and pay afterwards —
-- up to about three sessions of grace — but the system must then chase the
-- payment. The chasing half was never working.
--
-- 1. IMPOSSIBLE CONDITION
--
--    send_receipt_nudge_emails selected on `e.receipt_url IS NULL`.
--    public.enrollments.receipt_url is NOT NULL. No row can ever satisfy it.
--    An attempt to set the column to NULL today raised 23502, which is how
--    this was found. "No receipt yet" is stored as the empty string, and in
--    at least one older row as the literal 'manual' — the same three values
--    validate_receipt_before_approval already treats as absent.
--
-- 2. WRONG STATUS
--
--    It matched approval_status IN ('PENDING','UNDER_REVIEW'). The status a
--    student sits at while they owe money is 'PENDING_PAYMENT', which was
--    not in the list. All three unpaid enrolments today carry it. So even
--    with a nullable receipt column, the rows that matter were excluded.
--
-- 3. ONE SHOT, NOT REMINDERS
--
--    It stamped receipt_nudge_sent_at and never looked at the row again. A
--    single letter is not a reminder schedule, and enrollments already
--    carries reminder_count and last_reminder_at, added for this and unused.
--
-- Rewritten below: absent-receipt matched properly, PENDING_PAYMENT included,
-- and the letter repeated every 3 days up to 4 times. receipt_nudge_sent_at
-- is kept as the first-send stamp so nothing that reads it breaks.
--
-- Four letters over roughly nine days, then silence. A student who has not
-- paid after four reminders needs a person, not a fifth email — and this is
-- the same function family that once sent one student 23 identical reminders
-- on 23 consecutive days, which is what the cap is here to prevent.
--
-- THE CRON JOB IS DELIBERATELY LEFT DISABLED. This migration makes the
-- function correct; switching it on is a separate decision, taken with a
-- count of who would receive one in hand.

CREATE OR REPLACE FUNCTION public.send_receipt_nudge_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rec RECORD;
  _max_reminders constant integer := 4;
  _gap constant interval := interval '3 days';
BEGIN
  FOR _rec IN
    SELECT e.*, COALESCE(p.language, 'ar') AS lang, p.name AS student_name,
           p.email AS student_email, p.unsubscribe_token
      FROM public.enrollments e
      JOIN public.profiles p ON p.user_id = e.user_id
     WHERE e.enrollment_status = 'active'
       AND e.created_at < NOW() - INTERVAL '24 hours'
       -- receipt_url is NOT NULL, so absence is the empty string or the
       -- placeholder. The old `IS NULL` here matched nothing, ever.
       AND (btrim(COALESCE(e.receipt_url, '')) = '' OR e.receipt_url = 'manual')
       -- PENDING_PAYMENT is the status that means "owes money". Its absence
       -- from this list is the second reason nobody was ever chased.
       AND e.approval_status IN ('PENDING', 'UNDER_REVIEW', 'PENDING_PAYMENT')
       AND e.payment_status IN ('UNPAID', 'PENDING')
       AND COALESCE(e.reminder_count, 0) < _max_reminders
       AND (e.last_reminder_at IS NULL OR e.last_reminder_at < NOW() - _gap)
       AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    CONTINUE WHEN _rec.student_email IS NULL;

    -- Claim the row before sending. Two concurrent runs cannot both pass
    -- this, so a student cannot receive the same reminder twice.
    UPDATE public.enrollments
       SET reminder_count       = COALESCE(reminder_count, 0) + 1,
           last_reminder_at     = NOW(),
           receipt_nudge_sent_at = COALESCE(receipt_nudge_sent_at, NOW())
     WHERE id = _rec.id
       AND COALESCE(reminder_count, 0) = COALESCE(_rec.reminder_count, 0)
       AND (last_reminder_at IS NULL OR last_reminder_at < NOW() - _gap);

    IF FOUND THEN
      PERFORM app_private.invoke_edge(
        'send-confirmation-email',
        jsonb_build_object(
          'template', 'receipt_nudge',
          'email', _rec.student_email,
          'name', _rec.student_name,
          'language', _rec.lang,
          'enrollment_id', _rec.id,
          'amount', _rec.amount,
          'currency', _rec.currency,
          'unsubscribe_token', _rec.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$function$;

COMMENT ON FUNCTION public.send_receipt_nudge_emails() IS
  'Chases enrolments that owe money and have no receipt on file. Repeats '
  'every 3 days, at most 4 times, then stops — after four unanswered '
  'reminders the student needs a person, not another email. Absence of a '
  'receipt is the empty string or ''manual'': receipt_url is NOT NULL, so an '
  'IS NULL test here matches nothing.';
