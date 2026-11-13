-- get_enrollment_for_payment (the SECURITY DEFINER fallback used by
-- EgyptPaymentPage.tsx when the direct, RLS-scoped select finds no row)
-- never returned payment_status. The payment page's "approved but still
-- owes money" branch (approval_status = APPROVED, payment_status <>
-- PAID) needs payment_status to decide whether to show the payment
-- form, so any enrollment fetched through this fallback silently lost
-- its ability to accept a receipt upload and instead rendered the
-- "You're in!" success screen. This was masked for most students by the
-- direct select, which until this same change also selected a
-- `class_type` column that no longer exists on enrollments (it was
-- renamed to `level`) and therefore errored on every call, routing
-- 100% of traffic through this under-specified fallback.
--
-- Adding a column to a RETURNS TABLE function changes its return type, which
-- CREATE OR REPLACE refuses ("cannot change return type of existing
-- function", 13 Nov 2026 Apply Migrations runs), so the function is dropped
-- and recreated in the same transaction. Every clause of the live version is
-- kept (SECURITY DEFINER, STABLE, SET search_path, the auth checks), and its
-- live EXECUTE grants are restored exactly: postgres (owner), authenticated
-- and service_role only, never PUBLIC or anon.
DROP FUNCTION IF EXISTS public.get_enrollment_for_payment(uuid);

CREATE FUNCTION public.get_enrollment_for_payment(p_enrollment_id uuid)
 RETURNS TABLE(id uuid, plan_type text, duration integer, amount numeric, currency text, approval_status text, payment_status text, due_at timestamp with time zone, classes_included integer, receipt_url text, payment_method text, payment_date date, user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    e.id,
    e.plan_type,
    e.duration,
    e.amount,
    e.currency,
    e.approval_status,
    e.payment_status,
    e.due_at,
    e.classes_included,
    e.receipt_url,
    e.payment_method,
    e.payment_date,
    e.user_id
  FROM public.enrollments AS e
  WHERE e.id = p_enrollment_id
    AND auth.uid() IS NOT NULL
    AND (
      e.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
$function$;

REVOKE ALL ON FUNCTION public.get_enrollment_for_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_enrollment_for_payment(uuid) TO authenticated, service_role;
