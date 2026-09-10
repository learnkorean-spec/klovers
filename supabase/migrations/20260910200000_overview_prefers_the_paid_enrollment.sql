-- One enrollment per student is attached to admin_student_overview, and the
-- rule for which one was "the newest". A student who has paid, and has since
-- started a new bundle she has not paid for yet, is therefore described by the
-- unpaid row: derived_status = 'LEAD', badge "contacted", excluded from the
-- Confirmed (Paid) list.
--
-- That is exactly Mariam Harb on 10 September 2026 — paid 2350 EGP in July,
-- six lessons taken, invoiced the same morning for the next bundle. The invoice
-- is what erased her from the paid-student list.
--
-- "Newest" is a poor answer to "which enrollment describes this person". A paid
-- one does. The ordering below prefers APPROVED + PAID and falls back to newest,
-- so an unpaid renewal no longer overwrites a paid history.
--
-- Chasing the money is unaffected: the Enrollments tab and the pending-payment
-- badge both read public.enrollments directly, never this view, so the unpaid
-- row stays exactly as visible as it was.
--
-- Column list and order are byte-identical to the previous definition, so
-- CREATE OR REPLACE is safe and no caller needs changing.

CREATE OR REPLACE VIEW public.admin_student_overview AS
 SELECT p.user_id,
    p.email,
    p.name,
    p.country,
        CASE
            WHEN COALESCE(p.level, ''::text) = ''::text THEN COALESCE(le.level, ''::text)
            ELSE p.level
        END AS level,
    p.created_at,
    p.created_at AS joined_at,
    le.id AS enrollment_id,
    le.payment_status,
    le.approval_status,
    le.payment_method,
    le.payment_provider,
    le.plan_type,
    le.duration,
    le.amount,
    le.currency,
    le.sessions_total,
    COALESCE(le.sessions_remaining, 0) AS sessions_remaining,
    le.created_at AS enrollment_created_at,
    le.unit_price,
        CASE
            WHEN le.id IS NULL OR le.payment_status IS DISTINCT FROM 'PAID'::text OR le.approval_status IS DISTINCT FROM 'APPROVED'::text THEN 'LEAD'::text
            WHEN le.sessions_remaining <= '-3'::integer THEN 'LOCKED'::text
            WHEN le.sessions_remaining = 0 THEN 'COMPLETED'::text
            ELSE 'ACTIVE'::text
        END AS derived_status,
        CASE
            WHEN le.payment_provider = 'stripe'::text THEN 'Stripe'::text
            WHEN le.payment_provider = 'egypt_manual'::text THEN 'Egypt'::text
            WHEN le.payment_provider = 'manual'::text THEN 'Manual'::text
            ELSE '—'::text
        END AS source_label,
    GREATEST(0, - COALESCE(le.sessions_remaining, 0)) AS negative_sessions,
        CASE
            WHEN COALESCE(le.sessions_remaining, 0) < 0 THEN GREATEST(0, - le.sessions_remaining)::numeric *
            CASE
                WHEN COALESCE(le.sessions_total, 0) > 0 THEN le.amount / le.sessions_total::numeric
                ELSE COALESCE(le.unit_price, 0::numeric)
            END
            ELSE 0::numeric
        END AS amount_due,
        CASE
            WHEN COALESCE(le.sessions_remaining, 0) > 0 AND COALESCE(le.sessions_total, 0) > 0 THEN round(le.amount / le.sessions_total::numeric * le.sessions_remaining::numeric, 2)
            ELSE 0::numeric
        END AS remaining_balance
   FROM profiles p
     LEFT JOIN LATERAL ( SELECT e.id,
            e.user_id,
            e.plan_type,
            e.duration,
            e.classes_included,
            e.amount,
            e.unit_price,
            e.tx_ref,
            e.receipt_url,
            e.status,
            e.created_at,
            e.reviewed_at,
            e.reviewed_by,
            e.payment_status,
            e.approval_status,
            e.payment_provider,
            e.admin_review_required,
            e.sessions_total,
            e.sessions_remaining,
            e.stripe_payment_intent_id,
            e.matched_batch_id,
            e.matched_at,
            e.timezone,
            e.preferred_days,
            e.preferred_time,
            e.preferred_start,
            e.payment_method,
            e.currency,
            e.due_at,
            e.payment_date,
            e.negative_since,
            e.last_reminder_at,
            e.reminder_count,
            e.level,
            e.preferred_day,
            e.package_id,
            e.enrollment_status,
            e.slot_id,
            e.slot_rejection_reason,
            e.slot_rejection_at,
            e.admin_notes,
            e.assigned_day,
            e.assigned_time,
            e.assigned_timezone
           FROM enrollments e
          WHERE e.user_id = p.user_id
          -- THE CHANGE: a paid, approved enrollment describes this person
          -- better than whichever one was opened most recently.
          ORDER BY (e.payment_status = 'PAID'::text AND e.approval_status = 'APPROVED'::text) DESC,
                   e.created_at DESC
         LIMIT 1) le ON true;

-- Verify against the case that produced this, rather than assuming.
DO $$
DECLARE
  _status text;
  _paid   text;
  _broken integer;
BEGIN
  SELECT derived_status, payment_status INTO _status, _paid
    FROM public.admin_student_overview
   WHERE lower(email) = 'harbmariam84@gmail.com';

  IF _status IS NULL THEN
    RAISE NOTICE 'Mariam Harb has no profile row here; skipping the named check.';
  ELSIF _paid IS DISTINCT FROM 'PAID' THEN
    RAISE EXCEPTION
      'admin_student_overview still describes Mariam Harb by an unpaid enrollment (payment_status=%, derived_status=%)',
      _paid, _status;
  END IF;

  -- Nobody with a paid, approved enrollment may read as 'LEAD'.
  SELECT count(*) INTO _broken
    FROM public.admin_student_overview v
   WHERE v.derived_status = 'LEAD'
     AND EXISTS (
       SELECT 1 FROM public.enrollments e
        WHERE e.user_id = v.user_id
          AND e.payment_status = 'PAID'
          AND e.approval_status = 'APPROVED'
     );
  IF _broken > 0 THEN
    RAISE EXCEPTION '% student(s) with a paid enrollment still read as LEAD', _broken;
  END IF;

  RAISE NOTICE 'admin_student_overview now prefers the paid enrollment; no paid student reads as LEAD.';
END;
$$;
