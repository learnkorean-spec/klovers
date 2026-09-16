-- A paid group no longer starts itself.
--
-- Re, 16 Sep 2026: a group starts when 3 students are confirmed - and only
-- after the system tells her and she confirms. This replaces the 15 Sep rule
-- (RULE_GROUP_STARTS_WHEN_FULL), under which tg_activate_group_when_full set
-- start_date, first_class_date and due_at by itself once min_to_run was met.
--
-- Now the trigger only notifies, once, when seated members reach the group's
-- min_to_run (3 on every group today). Starting stays the GROUPS TO START
-- button on /admin/today (activate_pkg_group), pressed by Re.
--
-- Latent bug fixed on the way: the old trigger inserted NEW.group_id (a
-- pkg_groups id) into admin_notifications.related_group_id, whose foreign key
-- points at student_groups. Seating the 3rd student would have raised 23503
-- and rolled the seat back. The notice now names the group in the message,
-- and a failed notice can never undo a seat.
--
-- Tested on production in a rolled-back transaction: 3rd seat -> one notice,
-- 4th seat -> no second notice, start_date still NULL.

BEGIN;

CREATE OR REPLACE FUNCTION public.tg_activate_group_when_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _min     integer;
  _start   date;
  _name    text;
  _members integer;
BEGIN
  SELECT COALESCE(g.min_to_run, 3), g.start_date, g.name
    INTO _min, _start, _name
    FROM public.pkg_groups g
   WHERE g.id = NEW.group_id;

  -- Already running, or this row is not a seat (waitlist etc.).
  IF _start IS NOT NULL OR COALESCE(NEW.member_status, 'active') <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO _members
    FROM public.pkg_group_members
   WHERE group_id = NEW.group_id
     AND COALESCE(member_status, 'active') = 'active';

  -- Exactly at the minimum: one notice, not one per later seat.
  IF _members <> _min THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.admin_notifications (message, type, category)
    VALUES (
      format(
        'Ready to start: %s now has %s confirmed students. Nothing has started — open Today → GROUPS TO START and press Start when you decide.',
        COALESCE(_name, 'a group'), _members
      ),
      'info',
      'update'
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;  -- a notice must never undo a seat
  END;

  RETURN NEW;
END;
$function$;

-- Verify before commit: the function no longer writes start_date.
DO $$
BEGIN
  IF pg_get_functiondef('public.tg_activate_group_when_full'::regproc) ILIKE '%SET start_date%' THEN
    RAISE EXCEPTION 'Verify failed: trigger still activates groups';
  END IF;
END $$;

COMMIT;
