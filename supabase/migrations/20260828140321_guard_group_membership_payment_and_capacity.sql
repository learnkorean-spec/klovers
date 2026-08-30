-- Closes the gap found investigating why Matcher was flagged 🔴: 8+ different
-- code paths write to public.pkg_group_members (3 separate RPCs, plus 2 raw
-- "Manual Enroll" inserts in StudentManager.tsx / AdminDashboard.tsx with
-- zero capacity or payment check at all), and none of them are guaranteed to
-- run through the same validation. A student could be added to a real seat
-- without a paid, approved enrollment behind them, or into a group that is
-- already full, or into a group that has been soft-deleted (is_active=false).
--
-- Founder's explicit direction: guard the table itself (BEFORE INSERT/UPDATE
-- trigger on pkg_group_members), not each of the 8 screens/RPCs above it -
-- "الحارس على باب الأوضة، مش على كل ممر بيوصلها". This closes the hole for
-- every current caller and any future one, without touching a single screen.
--
-- Scope: only rows landing in member_status = 'active' (a real seat) are
-- guarded. Waitlist inserts pass through untouched - that's a deliberate,
-- narrow scope match to the specific risk raised (an unpaid student taking a
-- paid student's seat), not a redesign of the waitlist flow.
--
-- What the trigger checks, in order, each with its own distinct error
-- message so an admin never sees a bare "failed":
--   1. The target group exists.
--   2. The target group is active (pkg_groups.is_active = true).
--   3. A real enrollment is linked (enrollment_id is not null).
--   4. That enrollment exists.
--   5. That enrollment is approved (approval_status = 'APPROVED').
--   6. That enrollment is paid (payment_status = 'PAID').
--   7. The group has not reached capacity (active-member count < capacity).
--
-- The group row is locked (SELECT ... FOR UPDATE) before the capacity count,
-- so two concurrent assignments to the same group's last open seat serialize
-- through this trigger instead of both reading "room available" and both
-- succeeding - closing the race-condition risk the investigation flagged
-- (present identically in all 3 existing assignment RPCs, since none of them
-- lock anything before their own count-then-insert).
--
-- Tested against a real local Postgres 16 instance (not just read), with a
-- scratch schema matching production's exact column set: unpaid enrollment
-- (rejected), paid+approved enrollment into an open group (accepted), paid
-- enrollment into a full group (rejected), paid enrollment into an inactive
-- group (rejected), and the exact no-enrollment-id shape the two raw Manual
-- Enroll inserts use today (rejected). Waitlist inserts with no enrollment
-- confirmed to still succeed, untouched by this guard.
--
-- Known, deliberate non-fix in this migration: two of the three existing
-- assignment RPCs (assign_student_to_group_from_slot, used automatically
-- after payment approval, and assign_student_to_pkg_group, used in student
-- self-service) have their own separate bug - their "is this student already
-- assigned" check does not require the existing group to still be active, so
-- they can wrongly conclude "already assigned" for a student sitting in a
-- soft-deleted group and skip re-assignment entirely. That happens before
-- any write is attempted, so this trigger cannot catch it - it's a bug in
-- those RPCs' own read logic, not a gap in the write guard. Registered as
-- part of unifying the three RPCs (the founder's next, separate step), not
-- fixed here.
--
-- Also known and deliberately not touched here: 4 orphaned pkg_group_members
-- rows from 14 Apr, all member_status='waitlist', all enrollment_id=null, no
-- matching enrollment found by any lookup. Confirmed dead data, same shape as
-- the students rows deleted yesterday. Registered as its own separate item.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_group_membership_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _group RECORD;
  _enrollment RECORD;
  _active_count integer;
BEGIN
  -- Only guard rows that occupy a real seat. Waitlist rows pass through untouched.
  IF NEW.member_status <> 'active' THEN
    RETURN NEW;
  END IF;

  -- Lock the group row so two concurrent assignments serialize here instead
  -- of both reading "seat available" before either commits.
  SELECT * INTO _group FROM public.pkg_groups WHERE id = NEW.group_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot assign student: group % does not exist.', NEW.group_id;
  END IF;

  IF NOT _group.is_active THEN
    RAISE EXCEPTION 'Cannot assign student to "%": this group is not active.', _group.name;
  END IF;

  IF NEW.enrollment_id IS NULL THEN
    RAISE EXCEPTION 'Cannot assign student to "%": no paid enrollment is linked to this membership.', _group.name;
  END IF;

  SELECT * INTO _enrollment FROM public.enrollments WHERE id = NEW.enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot assign student to "%": linked enrollment % does not exist.', _group.name, NEW.enrollment_id;
  END IF;

  IF _enrollment.approval_status IS DISTINCT FROM 'APPROVED' THEN
    RAISE EXCEPTION 'Cannot assign student to "%": enrollment is not approved (status: %).', _group.name, _enrollment.approval_status;
  END IF;

  IF _enrollment.payment_status IS DISTINCT FROM 'PAID' THEN
    RAISE EXCEPTION 'Cannot assign student to "%": enrollment is not paid (status: %).', _group.name, _enrollment.payment_status;
  END IF;

  -- Capacity check, excluding this row itself so re-saving an already-active
  -- member (e.g. attaching an enrollment_id after the fact) doesn't double-count.
  SELECT count(*) INTO _active_count
    FROM public.pkg_group_members
    WHERE group_id = NEW.group_id
      AND member_status = 'active'
      AND user_id <> NEW.user_id;

  IF _active_count >= _group.capacity THEN
    RAISE EXCEPTION 'Cannot assign student to "%": group is full (%/% seats taken).', _group.name, _active_count, _group.capacity;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_group_membership_guard ON public.pkg_group_members;
CREATE TRIGGER trg_enforce_group_membership_guard
  BEFORE INSERT OR UPDATE ON public.pkg_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_group_membership_guard();

COMMIT;
