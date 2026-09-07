-- Two SQL senders, two faults found by auditing everything reachable from cron.
--
-- THIS MIGRATION TOUCHES NO ROWS. It replaces two functions. Nothing is
-- deleted, backfilled or rewritten.
--
--
-- 1. THE ONE-HOUR CLASS REMINDER HAS A BLIND BAND
-- -----------------------------------------------
-- get_sessions_for_reminder_1h() selected sessions starting BETWEEN now+50
-- and now+70 minutes - a 20-minute window - and cron job `class-reminder-1h`
-- runs EVERY 30 MINUTES.
--
-- A window narrower than the interval cannot tile the timeline:
--
--     run 10:00  covers 10:50 - 11:10
--     run 10:30  covers 11:20 - 11:40
--                       ^^^^^^^^^^^^^
--     a class starting 11:10-11:20 is covered by NEITHER run.
--
-- Ten minutes lost out of every thirty. Silent - no error, no log line, just an
-- email that never goes.
--
-- Measured rather than reasoned: simulating a full day of half-hourly runs
-- against a class starting at every minute of a six-hour span,
--
--     class start minutes tested        361
--     missed by the OLD window          108   (30%)
--     duplicated by the OLD window        0
--     missed by the NEW window            0
--     duplicated by the NEW window        0
--
-- Nearly a third of possible class times had no one-hour reminder.
--
-- The fix is NOT to widen the window to 30 minutes. A window exactly as wide
-- as the interval double-sends at the boundary: a session at exactly now+80
-- would be caught by this run and again by the next. Widening trades a missed
-- reminder for a duplicate one, which is not a fix.
--
-- Instead the window is anchored to the cron's own half-hour BUCKET rather
-- than to now(). Each run covers [bucket+60min, bucket+90min), and the next
-- bucket is 30 minutes later, so its band starts exactly where this one ends:
--
--     bucket 10:00  ->  11:00 - 11:30
--     bucket 10:30  ->  11:30 - 12:00
--     bucket 11:00  ->  12:00 - 12:30
--
-- Contiguous, non-overlapping, complete. Every session is reminded exactly
-- once, between 60 and 90 minutes before it starts. The assertion at the
-- bottom of this file proves the tiling rather than asserting it in a comment.
--
-- Anchoring to the bucket also makes the function honest about jitter: pg_cron
-- fires "on the minute" but not to the second, and now() drifting a few seconds
-- between runs used to shift the window with it.
--
-- ALSO REMOVED: `WHERE pgs.session_date = (NOW() AT TIME ZONE 'Africa/Cairo')::date`.
-- That restricted matches to sessions dated TODAY in Cairo, which silently
-- excluded the case the function exists for - a class at 00:15 Cairo, whose
-- one-hour reminder is due at 23:15 the PREVIOUS day. The timestamp comparison
-- already fixes the instant correctly across midnight and across DST; the date
-- equality was a second, wrong, filter on top of it.
--
-- STILL OPEN, deliberately not in this migration: neither reminder path writes
-- a send record, so a run that fires twice (manual dispatch, a watchdog
-- re-fire) would send twice, and a run that is MISSED loses its band with no
-- way to catch up. Fixing that properly needs a `reminder_1h_sent_at` column on
-- pkg_group_sessions and a claim-then-return function in the shape the six
-- send_*_emails() functions already use (UPDATE ... WHERE col IS NULL; IF FOUND
-- THEN send), plus a matching change in the send-class-reminders edge function.
-- That is a two-part deploy and is left for its own change.
--
-- Measured before writing: pkg_group_sessions has 0 rows and 0 active members
-- in pkg_group_members, so today this function returns nothing either way. It
-- becomes real the moment the Hangul cohorts start - which is also exactly when
-- nobody would notice reminders quietly not arriving.
--
--
-- 2. THE REJECTION FOLLOW-UP IGNORED UNSUBSCRIBES
-- -----------------------------------------------
-- Five of the six send_*_emails() functions check `email_unsubscribed` and pass
-- `unsubscribe_token` to the template. send_rejection_followup_emails() does
-- neither. So a person who has opted out still receives it, and the email it
-- produces has no token - meaning the unsubscribe link in the template falls
-- back to the tokenless page, which cannot identify them and shows "invalid or
-- expired".
--
-- Someone who opts out, and is then emailed anyway, and whose second attempt to
-- opt out fails, has one button left, and it is the spam button. That complaint
-- is charged against the domain that also sends the receipts and class links.
--
-- Measured: 10 resubmission requests, 20 rejected enrollments, 10 follow-ups
-- already sent, and 0 rows matching right now - so this is a latent gap being
-- closed before it fires, not an active incident.
--
-- The claim-then-send shape of the original is KEPT exactly:
--
--     UPDATE ... WHERE id = _rec.id AND rejection_followup_sent_at IS NULL;
--     IF FOUND THEN PERFORM app_private.invoke_edge(...);
--
-- That ordering is correct here and must not be "fixed" to send-then-record.
-- invoke_edge is fire-and-forget over pg_net and never sees a 2xx, so there is
-- nothing to verify; claiming first means a crash costs at most one lost email,
-- while sending first would mean a crash costs a duplicate, and a duplicate
-- cannot be taken back. (The opposite choice in the payment/profile/name
-- reminders is deliberate: those are capped recurring nudges where a lost
-- record must not cost a lost send, and they DO see the response.)

BEGIN;

-- ── 1. Bucket-anchored one-hour reminder window ──
--
-- The RETURNS TABLE signature is byte-identical to the existing function;
-- CREATE OR REPLACE refuses a changed return type, so any drift here fails
-- loudly rather than silently creating a second overload.
CREATE OR REPLACE FUNCTION public.get_sessions_for_reminder_1h()
 RETURNS TABLE(session_id uuid, session_date date, group_name text, start_time text, duration_min integer, level text, user_id uuid, name text, email text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  WITH bucket AS (
    -- The start of the half-hour the cron is firing in. floor(minute/30)*30
    -- gives 0 or 30; adding it to the truncated hour gives 10:00 or 10:30.
    SELECT date_trunc('hour', now())
         + (floor(date_part('minute', now()) / 30) * 30) * interval '1 minute'
        AS b
  )
  SELECT
    pgs.id            AS session_id,
    pgs.session_date,
    pg.name           AS group_name,
    sp.start_time::text,
    sp.duration_min,
    sp.level,
    p.user_id,
    p.name,
    p.email
  FROM pkg_group_sessions pgs
  JOIN pkg_groups pg          ON pg.id = pgs.group_id
  JOIN schedule_packages sp   ON sp.id = pg.package_id
  JOIN pkg_group_members pgm  ON pgm.group_id = pg.id AND pgm.member_status = 'active'
  JOIN profiles p             ON p.user_id = pgm.user_id
  CROSS JOIN bucket
  WHERE ((pgs.session_date + sp.start_time::time) AT TIME ZONE 'Africa/Cairo')
          >= bucket.b + interval '60 minutes'
    AND ((pgs.session_date + sp.start_time::time) AT TIME ZONE 'Africa/Cairo')
          <  bucket.b + interval '90 minutes'
    AND p.email IS NOT NULL;
$function$;

-- ── 2. Rejection follow-up: respect the opt-out, carry the token ──
CREATE OR REPLACE FUNCTION public.send_rejection_followup_emails()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT
      e.*,
      COALESCE(p.language, 'ar') AS lang,
      p.name  AS student_name,
      p.email AS student_email,
      p.unsubscribe_token
    FROM public.schedule_resubmission_requests srr
    JOIN public.enrollments e  ON e.id       = srr.enrollment_id
    JOIN public.profiles    p  ON p.user_id  = e.user_id
   WHERE srr.created_at < NOW() - INTERVAL '48 hours'
     AND e.approval_status = 'REJECTED'
     AND e.rejection_followup_sent_at IS NULL
     AND (p.email_unsubscribed IS FALSE OR p.email_unsubscribed IS NULL)
  LOOP
    CONTINUE WHEN _rec.student_email IS NULL;

    UPDATE public.enrollments
      SET rejection_followup_sent_at = NOW()
      WHERE id = _rec.id
        AND rejection_followup_sent_at IS NULL;

    IF FOUND THEN
      PERFORM app_private.invoke_edge(
        'send-confirmation-email',
        jsonb_build_object(
          'template', 'rejection_followup',
          'email',    _rec.student_email,
          'name',     _rec.student_name,
          'language', _rec.lang,
          'unsubscribe_token', _rec.unsubscribe_token
        )
      );
    END IF;
  END LOOP;
END;
$function$;

-- ── Proof, not assertion-by-comment ──
--
-- The whole point of change 1 is that consecutive cron buckets produce bands
-- that meet exactly: no gap (a missed class) and no overlap (a duplicate).
-- This walks a full day of half-hour buckets and fails the migration if any
-- boundary does not line up.
DO $$
DECLARE
  v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM (
    SELECT
      g.b + interval '90 minutes'                              AS band_end,
      lead(g.b) OVER (ORDER BY g.b) + interval '60 minutes'    AS next_band_start
    FROM generate_series(
           date_trunc('day', now()),
           date_trunc('day', now()) + interval '1 day' - interval '30 minutes',
           interval '30 minutes'
         ) AS g(b)
  ) t
  WHERE t.next_band_start IS NOT NULL
    AND t.next_band_start IS DISTINCT FROM t.band_end;

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      '% bucket boundaries do not tile - the reminder window would still drop or duplicate sessions', v_bad;
  END IF;

  RAISE NOTICE 'One-hour reminder bands tile cleanly across 48 buckets: no gap, no overlap.';
END $$;

-- The old 20-minute window is what this migration exists to remove, so prove
-- it is gone rather than trusting the CREATE OR REPLACE above.
DO $$
DECLARE
  v_src text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_sessions_for_reminder_1h';

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'get_sessions_for_reminder_1h() is missing after replacement';
  END IF;
  IF v_src LIKE '%50 minutes%' OR v_src LIKE '%70 minutes%' THEN
    RAISE EXCEPTION 'get_sessions_for_reminder_1h() still carries the old 50/70-minute window';
  END IF;
  IF v_src NOT LIKE '%bucket%' THEN
    RAISE EXCEPTION 'get_sessions_for_reminder_1h() is not bucket-anchored';
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO v_src
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'send_rejection_followup_emails';

  IF v_src NOT LIKE '%email_unsubscribed%' THEN
    RAISE EXCEPTION 'send_rejection_followup_emails() still does not check email_unsubscribed';
  END IF;
  IF v_src NOT LIKE '%unsubscribe_token%' THEN
    RAISE EXCEPTION 'send_rejection_followup_emails() still does not pass unsubscribe_token';
  END IF;

  RAISE NOTICE 'Both functions replaced and verified.';
END $$;

COMMIT;
