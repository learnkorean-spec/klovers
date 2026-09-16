-- A group starts at three and keeps taking students to eight.
--
-- tg_activate_group_when_full compared the member count against pkg_groups.capacity,
-- so one number meant two things: when the group starts, and how many seats it has.
-- capacity is also the seat limit enforced by hold_my_seat,
-- admin_confirm_student_into_group, enforce_group_membership_guard and
-- assign_student_to_pkg_group, so lowering it to three to start groups sooner would
-- have turned the fourth student away at the door.
--
-- min_to_run separates the two. capacity stays at eight and keeps guarding the seats;
-- min_to_run decides when the group is viable and sets its start date.

ALTER TABLE public.pkg_groups
  ADD COLUMN IF NOT EXISTS min_to_run integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.pkg_groups.min_to_run IS
  'Seated members needed before the group activates and sets its start date. Distinct from capacity, which is the seat limit.';

COMMENT ON COLUMN public.pkg_groups.capacity IS
  'Maximum seats. Enforced on join; see min_to_run for what starts the group.';

UPDATE public.pkg_groups SET min_to_run = 3 WHERE min_to_run IS DISTINCT FROM 3;

CREATE OR REPLACE FUNCTION public.tg_activate_group_when_full()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _min_to_run integer;
  _members    integer;
  _start      date;
  _dow        integer;
  _tz         text;
BEGIN
  SELECT g.min_to_run, g.start_date, sp.day_of_week, sp.timezone
    INTO _min_to_run, _start, _dow, _tz
    FROM public.pkg_groups g
    JOIN public.schedule_packages sp ON sp.id = g.package_id
   WHERE g.id = NEW.group_id;

  IF _start IS NOT NULL THEN
    RETURN NEW;  -- already running; joining it does not move its date
  END IF;

  -- Seated members only. The old count included every row, so waitlisted
  -- students could have started a group and been given a payment due date
  -- for a seat they did not hold.
  SELECT count(*) INTO _members
    FROM public.pkg_group_members
   WHERE group_id = NEW.group_id
     AND COALESCE(member_status, 'active') = 'active';

  IF _members < COALESCE(_min_to_run, 3) THEN
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
    'A group reached its minimum and started itself: it has ' || _members ||
    ' seated students and was activated for ' || _start || '. It stays open for more.',
    'info',
    NEW.group_id
  );

  RETURN NEW;
END;
$function$;
