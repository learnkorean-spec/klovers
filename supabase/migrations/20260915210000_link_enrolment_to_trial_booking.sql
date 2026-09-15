-- An enrolment remembers the trial it came from — 15 September 2026
-- ==================================================================
--
-- Nothing in the database joined `trial_bookings` to `enrollments`. Not a
-- foreign key, not a shared reference, nothing. So the one number that says
-- whether the whole trial machine is worth running — how many people who sat a
-- trial went on to enrol — could not be produced at all.
--
-- It can be approximated by matching email addresses, and that approximation
-- says: 37 people have a live trial booking, 5 people have an enrolment, and
-- **2** of those 5 also sat a trial. The other 3 enrolled without one.
--
-- But an email match is a guess dressed as a fact. It breaks the moment
-- somebody books with one address and signs up with another, it cannot say
-- WHICH booking led to the enrolment when there are several, and it silently
-- drops the 11 guest bookings that carry no user_id. A conversion rate nobody
-- can defend is worse than no conversion rate, because it gets used.
--
-- So the link is stored, once, at the moment it is knowable.
--
-- HOW THE MATCH IS MADE, and why it is a "most recent before" rather than
-- anything cleverer: the enrolment is attributed to the last trial the person
-- booked BEFORE enrolling. A booking made afterwards did not cause it. Where a
-- person has no earlier booking the column stays NULL, which is the honest
-- answer — they enrolled without a trial, and that is a real and interesting
-- category, not a gap to be filled with the nearest row.
--
-- Matching is on user_id first and the profile's email second, because a guest
-- booking has no user_id and an account created later has no way back to it
-- except the address.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS trial_booking_id uuid
    REFERENCES public.trial_bookings(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.enrollments.trial_booking_id IS
  'The trial booking this enrolment came from: the person''s most recent booking before the enrolment was created. NULL means they enrolled without a trial — a real category, not a missing value. Set automatically by trg_enrollments_link_trial.';

CREATE INDEX IF NOT EXISTS idx_enrollments_trial_booking_id
  ON public.enrollments (trial_booking_id)
  WHERE trial_booking_id IS NOT NULL;

-- ── Fill it in for everything that already exists ──
UPDATE public.enrollments e
   SET trial_booking_id = b.id
  FROM public.profiles p,
       LATERAL (
         SELECT tb.id
           FROM public.trial_bookings tb
          WHERE (tb.user_id = e.user_id
                 OR (p.email IS NOT NULL
                     AND lower(btrim(tb.email)) = lower(btrim(p.email))))
            AND tb.status <> 'cancelled'
            AND tb.created_at <= e.created_at
          ORDER BY tb.created_at DESC
          LIMIT 1
       ) b
 WHERE p.user_id = e.user_id
   AND e.trial_booking_id IS NULL;

-- ── And from now on, automatically ──
CREATE OR REPLACE FUNCTION public.tg_enrollments_link_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _booking uuid;
BEGIN
  -- An explicitly supplied link wins: if a caller ever knows better than this
  -- guess, it must not be overwritten by it.
  IF NEW.trial_booking_id IS NOT NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(btrim(email)) INTO _email
    FROM public.profiles WHERE user_id = NEW.user_id;

  SELECT tb.id INTO _booking
    FROM public.trial_bookings tb
   WHERE (tb.user_id = NEW.user_id
          OR (_email IS NOT NULL AND lower(btrim(tb.email)) = _email))
     AND tb.status <> 'cancelled'
     AND tb.created_at <= COALESCE(NEW.created_at, now())
   ORDER BY tb.created_at DESC
   LIMIT 1;

  -- Stays NULL when there is no earlier booking. "Enrolled without a trial" is
  -- an answer, not a hole.
  NEW.trial_booking_id := _booking;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enrollments_link_trial ON public.enrollments;
CREATE TRIGGER trg_enrollments_link_trial
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_enrollments_link_trial();
